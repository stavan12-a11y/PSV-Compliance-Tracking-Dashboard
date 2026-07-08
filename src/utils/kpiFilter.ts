import type { PSV } from '../types';
import { getCompliance } from './compliance';

export type KPIFilterKey = 'total' | 'installed' | 'out_for_service' | 'overdue' | 'compliant';

export const KPI_FILTER_LABELS: Record<KPIFilterKey, string> = {
  total: 'All PSVs',
  installed: 'Installed',
  out_for_service: 'Out for Service',
  overdue: 'Overdue',
  compliant: 'Compliant',
};

export function filterPSVsByKPI(psvs: PSV[], filter: KPIFilterKey): PSV[] {
  switch (filter) {
    case 'total':
      return psvs;
    case 'installed':
      return psvs.filter((p) => p.status === 'installed');
    case 'out_for_service':
      return psvs.filter((p) => p.status === 'out_for_service');
    case 'overdue':
      return psvs.filter((p) => getCompliance(p).state === 'overdue');
    case 'compliant':
      return psvs.filter((p) => getCompliance(p).state === 'compliant');
  }
}
