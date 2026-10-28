import type { PSVEvent } from '../types';

/** True for install / out-for-service / inventory transitions only. */
export function isStatusChangeEvent(event: PSVEvent): boolean {
  return event.type === 'status-change';
}

export function statusChangeEvents(events: PSVEvent[]): PSVEvent[] {
  return events.filter(isStatusChangeEvent);
}

/** In-place test / recertification entries. These valves stay installed. */
export function isServiceEvent(event: PSVEvent): boolean {
  return event.type === 'service';
}

export function serviceEvents(events: PSVEvent[]): PSVEvent[] {
  return events.filter(isServiceEvent);
}

/**
 * Events that belong in the history feed for a valve.
 * Tested-in-place valves have no meaningful status changes (they stay installed),
 * so the feed is their service dates. Swap valves keep status transitions.
 */
export function dashboardHistoryEvent(
  psv: { servicedOnSite?: boolean } | undefined,
  event: PSVEvent,
): boolean {
  if (psv?.servicedOnSite) return isServiceEvent(event);
  return isStatusChangeEvent(event);
}

export function replacementEvents(events: PSVEvent[]): PSVEvent[] {
  return events.filter((e) => e.type === 'replacement');
}

/** Install + replacement events for commercial use-and-replace valves. */
export function useAndReplaceHistory(events: PSVEvent[]): PSVEvent[] {
  const replacements = replacementEvents(events);
  const firstInstall = events
    .filter((e) => e.type === 'status-change' && e.status === 'installed')
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const combined = firstInstall ? [firstInstall, ...replacements] : [...replacements];
  const seen = new Set<string>();
  return combined.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
}

export function sortEventsNewestFirst(events: PSVEvent[]): PSVEvent[] {
  return [...events].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.recordedAt < b.recordedAt ? 1 : -1;
  });
}
