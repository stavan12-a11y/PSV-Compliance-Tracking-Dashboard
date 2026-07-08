import type { AppData, ComplianceSnapshot, PSV, PSVStatus } from '../types';
import { summarize } from './compliance';
import { addDays, addYears, daysBetween, DUE_SOON_DAYS, RECERT_INTERVAL_YEARS, todayISO } from './dates';

/** Increment when the daily snapshot formula changes to rebuild stored history. */
export const COMPLIANCE_HISTORY_VERSION = 2;

function psvExistsAsOf(psv: PSV, asOfDate: string): boolean {
  return psv.createdAt.slice(0, 10) <= asOfDate;
}

function statusAsOf(psv: PSV, asOfDate: string): PSVStatus {
  const changes = psv.events
    .filter((e) => e.type === 'status-change' && e.status && e.date <= asOfDate)
    .sort((a, b) => a.date.localeCompare(b.date) || a.recordedAt.localeCompare(b.recordedAt));
  return changes.length ? changes[changes.length - 1].status! : 'inventory';
}

function isMonitoredInstalled(psv: PSV, asOfDate: string): boolean {
  return psv.servicedOnSite || statusAsOf(psv, asOfDate) === 'installed';
}

function lastInstallDateAsOf(psv: PSV, asOfDate: string): string | null {
  const installs = psv.events
    .filter((e) => e.type === 'status-change' && e.status === 'installed' && e.date <= asOfDate)
    .map((e) => e.date)
    .sort();
  return installs.length ? installs[installs.length - 1] : null;
}

function lastServiceDateAsOf(psv: PSV, asOfDate: string): string | null {
  const services = psv.events
    .filter((e) => e.type === 'service' && e.date <= asOfDate)
    .map((e) => e.date)
    .sort();
  return services.length ? services[services.length - 1] : null;
}

function certDateAsOf(psv: PSV, asOfDate: string): string | null {
  if (psv.servicedOnSite) {
    return lastServiceDateAsOf(psv, asOfDate) ?? lastInstallDateAsOf(psv, asOfDate);
  }
  return lastInstallDateAsOf(psv, asOfDate);
}

type SnapshotComplianceState = 'compliant' | 'due_soon' | 'overdue' | 'not_installed';

function complianceStateAsOf(psv: PSV, asOfDate: string): SnapshotComplianceState {
  if (!isMonitoredInstalled(psv, asOfDate)) return 'not_installed';

  const certDate = certDateAsOf(psv, asOfDate);
  if (!certDate) return 'not_installed';

  const dueDate = addYears(certDate, RECERT_INTERVAL_YEARS);
  const daysRemaining = daysBetween(asOfDate, dueDate);
  if (daysRemaining < 0) return 'overdue';
  if (daysRemaining <= DUE_SOON_DAYS) return 'due_soon';
  return 'compliant';
}

/** Builds a daily snapshot using the same rules as the live KPI summary. */
export function snapshotFromSummary(psvs: PSV[], date: string): ComplianceSnapshot {
  const s = summarize(psvs);
  return {
    date,
    complianceRate: s.complianceRate,
    installed: s.installed,
    compliant: s.compliant,
    overdue: s.overdue,
    dueSoon: s.dueSoon,
    total: s.total,
  };
}

/**
 * Computes site-wide compliance for a past date from event history.
 * Compliant % = compliant installed valves ÷ total installed (incl. overdue).
 */
export function snapshotFromPsvs(psvs: PSV[], asOfDate: string): ComplianceSnapshot {
  const activePsvs = psvs.filter((p) => psvExistsAsOf(p, asOfDate));
  let installed = 0;
  let compliant = 0;
  let overdue = 0;
  let dueSoon = 0;

  for (const psv of activePsvs) {
    if (!isMonitoredInstalled(psv, asOfDate)) continue;

    installed += 1;
    const state = complianceStateAsOf(psv, asOfDate);
    if (state === 'overdue') overdue += 1;
    else if (state === 'due_soon') dueSoon += 1;
    else if (state === 'compliant') compliant += 1;
  }

  const complianceRate =
    installed === 0 ? 100 : Math.round((compliant / installed) * 100);

  return {
    date: asOfDate,
    complianceRate,
    installed,
    compliant,
    overdue,
    dueSoon,
    total: activePsvs.length,
  };
}

function snapshotsEqual(a: ComplianceSnapshot, b: ComplianceSnapshot): boolean {
  return (
    a.date === b.date &&
    a.complianceRate === b.complianceRate &&
    a.installed === b.installed &&
    a.compliant === b.compliant &&
    a.overdue === b.overdue &&
    a.dueSoon === b.dueSoon &&
    a.total === b.total
  );
}

function upsertSnapshot(
  history: ComplianceSnapshot[],
  snapshot: ComplianceSnapshot,
): ComplianceSnapshot[] {
  const idx = history.findIndex((h) => h.date === snapshot.date);
  if (idx >= 0) {
    if (snapshotsEqual(history[idx], snapshot)) return history;
    const next = [...history];
    next[idx] = snapshot;
    return next;
  }
  return [...history, snapshot].sort((a, b) => a.date.localeCompare(b.date));
}

function earliestActivityDate(psvs: PSV[]): string {
  let min = todayISO();
  for (const psv of psvs) {
    const created = psv.createdAt.slice(0, 10);
    if (created < min) min = created;
    for (const e of psv.events) {
      if (e.date < min) min = e.date;
    }
  }
  return min;
}

/** Rebuilds daily snapshots from PSV event history (first load / empty history). */
export function backfillComplianceHistory(psvs: PSV[]): ComplianceSnapshot[] {
  if (!psvs.length) return [];
  const snapshots: ComplianceSnapshot[] = [];
  let d = earliestActivityDate(psvs);
  const today = todayISO();
  while (d <= today) {
    snapshots.push(
      d === today ? snapshotFromSummary(psvs, d) : snapshotFromPsvs(psvs, d),
    );
    d = addDays(d, 1);
  }
  return snapshots;
}

/** Ensures history exists and today's snapshot reflects current PSV data. */
export function ensureComplianceHistory(data: AppData): AppData {
  const today = todayISO();
  const todaySnapshot = snapshotFromSummary(data.psvs, today);

  if (!data.psvs.length) {
    if (!data.complianceHistory?.length) return data;
    return { ...data, complianceHistory: [], complianceHistoryVersion: COMPLIANCE_HISTORY_VERSION };
  }

  let history =
    (data.complianceHistoryVersion ?? 0) < COMPLIANCE_HISTORY_VERSION
      ? backfillComplianceHistory(data.psvs)
      : (data.complianceHistory ?? backfillComplianceHistory(data.psvs));

  const nextHistory = upsertSnapshot(history, todaySnapshot);

  if (
    nextHistory === data.complianceHistory &&
    data.complianceHistoryVersion === COMPLIANCE_HISTORY_VERSION
  ) {
    return data;
  }

  return {
    ...data,
    complianceHistory: nextHistory,
    complianceHistoryVersion: COMPLIANCE_HISTORY_VERSION,
  };
}

/** Returns one snapshot per day in [startDate, endDate]. */
export function getSnapshotsForRange(
  psvs: PSV[],
  _history: ComplianceSnapshot[] | undefined,
  startDate: string,
  endDate: string,
): ComplianceSnapshot[] {
  const today = todayISO();
  const snapshots: ComplianceSnapshot[] = [];
  let d = startDate;

  while (d <= endDate) {
    snapshots.push(d === today ? snapshotFromSummary(psvs, d) : snapshotFromPsvs(psvs, d));
    d = addDays(d, 1);
  }

  return snapshots;
}

/** Earliest date we can report (first valve activity). */
export function earliestComplianceDate(psvs: PSV[]): string {
  if (!psvs.length) return todayISO();
  return earliestActivityDate(psvs);
}
