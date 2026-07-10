import type { PSVEvent } from '../types';

/** True for install / out-for-service / inventory transitions only. */
export function isStatusChangeEvent(event: PSVEvent): boolean {
  return event.type === 'status-change';
}

export function statusChangeEvents(events: PSVEvent[]): PSVEvent[] {
  return events.filter(isStatusChangeEvent);
}

export function sortEventsNewestFirst(events: PSVEvent[]): PSVEvent[] {
  return [...events].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.recordedAt < b.recordedAt ? 1 : -1;
  });
}
