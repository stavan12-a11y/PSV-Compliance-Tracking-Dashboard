import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { usePSV } from '../store/PSVContext';
import { summarize } from '../utils/compliance';
import { KPIGrid } from '../components/KPIGrid';
import { EquipmentCard } from '../components/EquipmentCard';
import { UrgencyHistoryPanel } from '../components/UrgencyHistoryPanel';
import { EquipmentFormModal } from '../components/forms/EquipmentFormModal';

export function Dashboard() {
  const { data } = usePSV();
  const [query, setQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const summary = useMemo(() => summarize(data.psvs), [data.psvs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data.equipment;
    return data.equipment.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.tag.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q) ||
        e.area.toLowerCase().includes(q),
    );
  }, [data.equipment, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Site Compliance Overview</h2>
          <p className="text-sm text-slate-500">
            Pressure Safety Valve tracking across all monitored equipment.
          </p>
        </div>
      </div>

      <KPIGrid summary={summary} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-slate-900">Equipment</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="input w-48 pl-9 sm:w-64"
                  placeholder="Search equipment…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <button className="btn-primary whitespace-nowrap" onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4" />
                Add Equipment
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="card p-10 text-center text-slate-400">
              No equipment matches your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {filtered.map((eq) => (
                <EquipmentCard key={eq.id} equipment={eq} onEdit={() => setEditId(eq.id)} />
              ))}
            </div>
          )}
        </section>

        <section className="lg:col-span-1">
          <h3 className="mb-4 text-lg font-bold text-slate-900">Urgency &amp; History</h3>
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
