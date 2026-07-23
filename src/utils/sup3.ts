import type { Equipment } from '../types';

/** True when this equipment is SUP3 (name, tag, or area). */
export function isSup3Equipment(equipment: Pick<Equipment, 'name' | 'tag' | 'area'>): boolean {
  const parts = [equipment.name, equipment.tag, equipment.area].map((s) =>
    (s ?? '').trim().toUpperCase(),
  );
  return parts.some((p) => p === 'SUP3' || p.includes('SUP3'));
}
