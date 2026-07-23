import type {
  ComplianceInfo,
  ComplianceState,
  KPISummary,
  PSV,
  PSVStatus,
} from '../types';
import {
  addYears,
  daysBetween,
  DUE_SOON_DAYS,
  RECERT_INTERVAL_YEARS,
  todayISO,
} from './dates';

/** Returns the most recent install date (YYYY-MM-DD) from a PSV's events, or null. */
export function lastInstallDate(psv: PSV): string | null {
  const installs = psv.events
    .filter((e) => e.type === 'status-change' && e.status === 'installed')
    .map((e) => e.date)
    .sort();
  return installs.length ? installs[installs.length - 1] : null;
}

/** Returns the most recent on-site service date (YYYY-MM-DD), or null. */
export function lastServiceDate(psv: PSV): string | null {
  const services = psv.events
    .filter((e) => e.type === 'service')
    .map((e) => e.date)
    .sort();
  return services.length ? services[services.length - 1] : null;
}

/** Returns the most recent use-and-replace replacement date, or null. */
export function lastReplacementDate(psv: PSV): string | null {
  const replacements = psv.events
    .filter((e) => e.type === 'replacement')
    .map((e) => e.date)
    .sort();
  return replacements.length ? replacements[replacements.length - 1] : null;
}

/**
 * Returns the date the recertification clock starts from.
 * - Swap valves: the most recent INSTALL date (a spare's off-site service does
 *   not start the clock — only installation does).
 * - On-site serviced valves (no spare): the most recent SERVICE date, since they
 *   are recertified in place; falls back to the install date if never serviced.
 * - Use-and-replace (commercial boiler): the most recent REPLACEMENT date, or
 *   the initial install if never replaced yet.
 */
export function getCertDate(psv: PSV): string | null {
  if (psv.useAndReplace) {
    return lastReplacementDate(psv) ?? lastInstallDate(psv);
  }
  if (psv.servicedOnSite) {
    return lastServiceDate(psv) ?? lastInstallDate(psv);
  }
  return lastInstallDate(psv);
}

/**
 * Computes compliance for a PSV. The due date = certification date + recert
 * interval (3 years). PSVs that are not currently installed (and not serviced
 * on site) do not contribute a live due date.
 */
export function getCompliance(psv: PSV): ComplianceInfo {
  const installDate = lastInstallDate(psv);
  const certDate = getCertDate(psv);
  const active = psv.useAndReplace || psv.servicedOnSite || psv.status === 'installed';

  if (!active || !certDate) {
    return {
      state: 'not_installed',
      dueDate: null,
      daysRemaining: null,
      lastInstallDate: installDate,
    };
  }

  const dueDate = addYears(certDate, RECERT_INTERVAL_YEARS);
  const daysRemaining = daysBetween(todayISO(), dueDate);

  let state: ComplianceState;
  if (daysRemaining < 0) state = 'overdue';
  else if (daysRemaining <= DUE_SOON_DAYS) state = 'due_soon';
  else state = 'compliant';

  return { state, dueDate, daysRemaining, lastInstallDate: installDate };
}

/** Due-soon valves count as compliant for the compliance-rate KPI. */
export function isCompliantForRate(state: ComplianceState): boolean {
  return state === 'compliant' || state === 'due_soon';
}

/**
 * Compliance % = (compliant + due soon) / (compliant + due soon + overdue).
 * Only installed / on-site valves with an active due date are in scope.
 * Inventory and out-for-service valves are excluded from this rate.
 */
export function computeComplianceRate(counts: {
  compliant: number;
  dueSoon: number;
  overdue: number;
}): number {
  const passing = counts.compliant + counts.dueSoon;
  const monitored = passing + counts.overdue;
  return monitored === 0 ? 100 : Math.round((passing / monitored) * 100);
}

/** Aggregates a set of PSVs into KPI counts. */
export function summarize(psvs: PSV[]): KPISummary {
  const summary: KPISummary = {
    total: psvs.length,
    installed: 0,
    inventory: 0,
    outForService: 0,
    dueSoon: 0,
    overdue: 0,
    compliant: 0,
    complianceRate: 100,
  };

  for (const psv of psvs) {
    if (psv.status === 'installed') summary.installed += 1;
    else if (psv.status === 'inventory') summary.inventory += 1;
    else if (psv.status === 'out_for_service') summary.outForService += 1;

    const c = getCompliance(psv);
    if (c.state === 'overdue') summary.overdue += 1;
    else if (c.state === 'due_soon') summary.dueSoon += 1;
    else if (c.state === 'compliant') summary.compliant += 1;
  }

  summary.complianceRate = computeComplianceRate(summary);

  return summary;
}

export const STATUS_LABELS: Record<PSVStatus, string> = {
  installed: 'Installed',
  out_for_service: 'Out for Service',
  inventory: 'In Inventory',
};

export const COMPLIANCE_LABELS: Record<ComplianceState, string> = {
  compliant: 'Compliant',
  due_soon: 'Due Soon',
  overdue: 'Overdue',
  not_installed: 'Not Installed',
};
