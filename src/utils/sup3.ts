import type { Equipment, Location, PSV } from '../types';

/** Collapse spaces, dashes, etc. so "SUP-3", "SUP 3", and "SUP3" all match. */
function siteCode(value: string): string {
  return value.replace(/[\s._\-/]/g, '').toUpperCase();
}

function containsSup3(value: string): boolean {
  const code = siteCode(value);
  return code.includes('SUP3') || code.includes('SUP03');
}

/** True when this equipment is SUP3 (name, tag, area, or type). */
export function isSup3Equipment(
  equipment: Pick<Equipment, 'name' | 'tag' | 'area' | 'type' | 'minimalFaceplates'>,
): boolean {
  if (equipment.minimalFaceplates) return true;
  return [equipment.name, equipment.tag, equipment.area, equipment.type].some((part) =>
    containsSup3(part ?? ''),
  );
}

export function isSup3Location(location: Pick<Location, 'name' | 'tag'>): boolean {
  return [location.name, location.tag].some((part) => containsSup3(part ?? ''));
}

/** Minimal cards: commercial-boiler valves, SUP3 equipment/locations, or explicit equipment setting. */
export function useCompactPsvView(
  psv: Pick<PSV, 'useAndReplace'>,
  equipment?: Pick<Equipment, 'name' | 'tag' | 'area' | 'type' | 'minimalFaceplates'>,
  location?: Pick<Location, 'name' | 'tag'>,
): boolean {
  if (psv.useAndReplace) return true;
  if (equipment && isSup3Equipment(equipment)) return true;
  if (location && isSup3Location(location)) return true;
  return false;
}

export function useCompactLocationRow(
  psvs: Array<Pick<PSV, 'useAndReplace'>>,
  equipment?: Pick<Equipment, 'name' | 'tag' | 'area' | 'type' | 'minimalFaceplates'>,
  location?: Pick<Location, 'name' | 'tag'>,
): boolean {
  if (psvs.some((p) => p.useAndReplace)) return true;
  if (equipment && isSup3Equipment(equipment)) return true;
  if (location && isSup3Location(location)) return true;
  return false;
}
