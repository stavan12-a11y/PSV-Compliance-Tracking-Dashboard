import { useMemo } from 'react';
import { X } from 'lucide-react';
import type { PSV } from '../types';
import { KPI_FILTER_LABELS, filterPSVsByKPI, type KPIFilterKey } from '../utils/kpiFilter';
import { PSVFaceplate } from './PSVFaceplate';

interface KPIFilteredPSVListProps {
  psvs: PSV[];
  filter: KPIFilterKey;
  onClear: () => void;
}

export function KPIFilteredPSVList({ psvs, filter, onClear }: KPIFilteredPSVListProps) {
  const filtered = useMemo(() => filterPSVsByKPI(psvs, filter), [psvs, filter]);
  const label = KPI_FILTER_LABELS[filter];

  return (
    <section className="card p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{label}</h3>
          <p className="text-sm text-slate-500">
            {filtered.length} valve{filtered.length === 1 ? '' : 's'} matching this KPI
          </p>
        </div>
        <button className="btn-secondary" onClick={onClear}>
          <X className="h-4 w-4" />
          Clear filter
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">No valves match this filter.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((psv) => (
            <PSVFaceplate key={psv.id} psv={psv} />
          ))}
        </div>
      )}
    </section>
  );
}
