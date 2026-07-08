import type { AppData, ComplianceSnapshot, PSV, PSVStatus } from '../types';
import { addDays, addYears, daysBetween, DUE_SOON_DAYS, RECERT_INTERVAL_YEARS, todayISO } from './dates';

function psvExistsAsOf(psv: PSV, asOfDate: string): boolean {
  return psv.createdAt.slice(0, 10) <= asOfDate;
}

function statusAsOf(psv: PSV, asOfDate: string): PSVStatus {
  const changes = psv.events
    .filter((e) => e.type === 'status-change' && e.status && e.date <= asOfDate)
    .sort((a, b) => a.date.localeCompare(b.date) || a.recordedAt.localeCompare(b.recordedAt));
  return changes.length ? changes[changes.length - 1].status! : 'inventory';
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
  const status = statusAsOf(psv, asOfDate);
  const active = psv.servicedOnSite || status === 'installed';
  const certDate = certDateAsOf(psv, asOfDate);

  if (!active || !certDate) return 'not_installed';

  const dueDate = addYears(certDate, RECERT_INTERVAL_YEARS);
  const daysRemaining = daysBetween(asOfDate, dueDate);
  if (daysRemaining < 0) return 'overdue';
  if (daysRemaining <= DUE_SOON_DAYS) return 'due_soon';
  return 'compliant';
}

/** Computes site-wide compliance metrics as they would have been on a given date. */
export function snapshotFromPsvs(psvs: PSV[], asOfDate: string): ComplianceSnapshot {
  const activePsvs = psvs.filter((p) => psvExistsAsOf(p, asOfDate));
  let installed = 0;
  let compliant = 0;
  let overdue = 0;
  let dueSoon = 0;

  for (const psv of activePsvs) {
    const status = statusAsOf(psv, asOfDate);
    if (status === 'installed') installed += 1;

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
    snapshots.push(snapshotFromPsvs(psvs, d));
    d = addDays(d, 1);
  }
  return snapshots;
}

/** Ensures history exists and today's snapshot reflects current PSV data. */
export function ensureComplianceHistory(data: AppData): AppData {
  let history = data.complianceHistory ?? [];

  if (history.length === 0 && data.psvs.length > 0) {
    history = backfillComplianceHistory(data.psvs);
  }

  const todaySnapshot = snapshotFromPsvs(data.psvs, todayISO());
  const nextHistory = upsertSnapshot(history, todaySnapshot);

  if (nextHistory === data.complianceHistory) return data;
  return { ...data, complianceHistory: nextHistory };
}

/** Returns the most recent N days of history for charts (oldest first). */
export function recentComplianceHistory(
  history: ComplianceSnapshot[] | undefined,
  days = 30,
): ComplianceSnapshot[] {
  if (!history?.length) return [];
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.slice(Math.max(0, sorted.length - days));
}
