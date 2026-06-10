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

/**
 * Computes compliance for a PSV. The recertification due date is always measured
 * from the most recent INSTALL date (not the service date) + the recert interval.
 * PSVs that are not currently installed do not contribute a live due date.
 */
export function getCompliance(psv: PSV): ComplianceInfo {
  const installDate = lastInstallDate(psv);

  if (psv.status !== 'installed' || !installDate) {
    return {
      state: 'not_installed',
      dueDate: null,
      daysRemaining: null,
      lastInstallDate: installDate,
    };
  }

  const dueDate = addYears(installDate, RECERT_INTERVAL_YEARS);
  const daysRemaining = daysBetween(todayISO(), dueDate);

  let state: ComplianceState;
  if (daysRemaining < 0) state = 'overdue';
  else if (daysRemaining <= DUE_SOON_DAYS) state = 'due_soon';
  else state = 'compliant';

  return { state, dueDate, daysRemaining, lastInstallDate: installDate };
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

  const activeMonitored = summary.installed;
  summary.complianceRate =
    activeMonitored === 0
      ? 100
      : Math.round((summary.compliant / activeMonitored) * 100);

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
