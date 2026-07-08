import { useMemo, useState } from 'react';
import { FileSpreadsheet, LineChart, Plus } from 'lucide-react';
import { usePSV } from '../store/PSVContext';
import { summarize } from '../utils/compliance';
import { earliestComplianceDate } from '../utils/complianceHistory';
import type { KPIFilterKey } from '../utils/kpiFilter';
import { exportComplianceTrendToExcel, exportToExcel } from '../utils/excelExport';
import { addDays, todayISO } from '../utils/dates';
import { KPIGrid } from '../components/KPIGrid';
import { KPIFilterModal } from '../components/KPIFilterModal';
import { EquipmentCard } from '../components/EquipmentCard';
import { UrgencyHistoryPanel } from '../components/UrgencyHistoryPanel';
import { EquipmentFormModal } from '../components/forms/EquipmentFormModal';

export function Dashboard() {
  const { data } = usePSV();
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [kpiFilter, setKpiFilter] = useState<KPIFilterKey | null>(null);
  const [trendStart, setTrendStart] = useState(() => addDays(todayISO(), -30));
  const [trendEnd, setTrendEnd] = useState(todayISO);

  const summary = useMemo(() => summarize(data.psvs), [data.psvs]);
  const minTrendDate = useMemo(() => earliestComplianceDate(data.psvs), [data.psvs]);
  const trendRangeValid = trendStart <= trendEnd;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Site Compliance Overview</h2>
          <p className="text-sm text-slate-500">
            Pressure Safety Valve tracking across all monitored equipment.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <label className="text-xs font-semibold text-slate-500">
              <span className="mb-1 block">Compliance trend from</span>
              <input
                type="date"
                className="input py-1.5 text-sm"
                value={trendStart}
                min={minTrendDate}
                max={trendEnd}
                onChange={(e) => setTrendStart(e.target.value)}
              />
            </label>
            <label className="text-xs font-semibold text-slate-500">
              <span className="mb-1 block">to</span>
              <input
                type="date"
                className="input py-1.5 text-sm"
                value={trendEnd}
                min={trendStart}
                max={todayISO()}
                onChange={(e) => setTrendEnd(e.target.value)}
              />
            </label>
            <button
              className="btn-secondary whitespace-nowrap"
              onClick={() => exportComplianceTrendToExcel(data, trendStart, trendEnd)}
              disabled={data.psvs.length === 0 || !trendRangeValid}
              title="Download daily compliant % (compliant ÷ installed) for the selected dates"
            >
              <LineChart className="h-4 w-4" />
              Compliance Trend
            </button>
          </div>
          <button
            className="btn-secondary"
            onClick={() => exportToExcel(data)}
            disabled={data.psvs.length === 0}
            title="Export the full PSV register and compliance report to Excel"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </button>
        </div>
      </div>

      <KPIGrid summary={summary} onFilterSelect={setKpiFilter} />

      <KPIFilterModal
        open={kpiFilter !== null}
        filter={kpiFilter ?? 'total'}
        psvs={data.psvs}
        onClose={() => setKpiFilter(null)}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-slate-900">Equipment</h3>
            <button className="btn-primary whitespace-nowrap" onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4" />
              Add Equipment
            </button>
          </div>

          {data.equipment.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="font-semibold text-slate-600">No equipment yet</p>
              <p className="mt-1 text-sm text-slate-400">
                Add your first piece of equipment to start tracking PSVs.
              </p>
              <button className="btn-primary mt-4 inline-flex" onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4" />
                Add Equipment
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {data.equipment.map((eq) => (
                <EquipmentCard key={eq.id} equipment={eq} onEdit={() => setEditId(eq.id)} />
              ))}
            </div>
          )}
        </section>

        <section className="lg:col-span-1">
          <div className="h-[640px]">
            <UrgencyHistoryPanel />
          </div>
        </section>
      </div>

      <EquipmentFormModal open={showAdd} onClose={() => setShowAdd(false)} />
      <EquipmentFormModal
        open={editId !== null}
        equipmentId={editId ?? undefined}
        onClose={() => setEditId(null)}
      />
    </div>
  );
}
