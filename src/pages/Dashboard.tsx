import { useMemo, useState } from 'react';
import { FileSpreadsheet, Loader2, Plus } from 'lucide-react';
import { usePSV } from '../store/PSVContext';
import { summarize } from '../utils/compliance';
import type { KPIFilterKey } from '../utils/kpiFilter';
import { exportToExcel } from '../utils/excelExport';
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
  const [exporting, setExporting] = useState(false);

  const summary = useMemo(() => summarize(data.psvs), [data.psvs]);

  const handleDownloadReport = async () => {
    setExporting(true);
    try {
      await exportToExcel(data);
    } catch {
      alert('Could not create the Excel report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Site Compliance Overview</h2>
          <p className="text-sm text-slate-500">
            Pressure Safety Valve tracking across all monitored equipment.
          </p>
        </div>
        <button
          className="btn-secondary"
          onClick={handleDownloadReport}
          disabled={data.psvs.length === 0 || exporting}
          title="Downloads PSV-Full-Report-*.xlsx with 5 sheets: All PSVs, Installed, Out for Service, Overdue, Upcoming Due"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
          Download Excel Report
        </button>
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
