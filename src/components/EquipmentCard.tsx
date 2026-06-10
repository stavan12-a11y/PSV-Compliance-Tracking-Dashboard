import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, MapPin, Pencil, Trash2 } from 'lucide-react';
import type { Equipment } from '../types';
import { usePSV } from '../store/PSVContext';
import { summarize } from '../utils/compliance';

interface EquipmentCardProps {
  equipment: Equipment;
  onEdit: () => void;
}

export function EquipmentCard({ equipment, onEdit }: EquipmentCardProps) {
  const navigate = useNavigate();
  const { psvsForEquipment, locationsForEquipment, deleteEquipment } = usePSV();
  const psvs = psvsForEquipment(equipment.id);
  const locations = locationsForEquipment(equipment.id);
  const summary = summarize(psvs);

  return (
    <div
      onClick={() => navigate(`/equipment/${equipment.id}`)}
      className="card group cursor-pointer p-5 transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-lg font-bold text-slate-900">{equipment.name}</h3>
            <span className="rounded-md bg-maroon-50 px-2 py-0.5 text-xs font-semibold text-maroon-800">
              {equipment.tag}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-slate-500">{equipment.type}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            title="Edit equipment"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (
                confirm(
                  `Delete ${equipment.name} and all of its locations and PSVs? This cannot be undone.`,
                )
              ) {
                deleteEquipment(equipment.id);
              }
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
            title="Delete equipment"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
        <MapPin className="h-3.5 w-3.5" />
        {equipment.area}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
        <Stat value={locations.length} label="Locations" />
        <Stat value={summary.total} label="PSVs" />
        <Stat value={summary.installed} label="Installed" />
      </div>

      {(summary.overdue > 0 || summary.dueSoon > 0) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {summary.overdue > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              {summary.overdue} overdue
            </span>
          )}
          {summary.dueSoon > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              <Clock className="h-3.5 w-3.5" />
              {summary.dueSoon} due soon
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-xl font-bold text-slate-900">{value}</p>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}
