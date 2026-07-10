import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PSV } from '../types';
import { usePSV } from '../store/PSVContext';
import { getCompliance, STATUS_LABELS } from '../utils/compliance';
import { formatDate, relativeDays } from '../utils/dates';
import { KPI_FILTER_LABELS, filterPSVsByKPI, type KPIFilterKey } from '../utils/kpiFilter';
import { ComplianceBadge, StatusBadge } from './Badges';
import { Modal } from './Modal';

interface KPIFilterModalProps {
  open: boolean;
  filter: KPIFilterKey;
  psvs: PSV[];
  onClose: () => void;
}

function dueText(days: number | null): string {
  if (days === null) return '—';
  return relativeDays(days);
}

export function KPIFilterModal({ open, filter, psvs, onClose }: KPIFilterModalProps) {
  const navigate = useNavigate();
  const { data } = usePSV();

  const rows = useMemo(() => {
    const filtered = filterPSVsByKPI(psvs, filter);
    const eqById = new Map(data.equipment.map((e) => [e.id, e]));
    const locById = new Map(data.locations.map((l) => [l.id, l]));

    return filtered
      .map((psv) => {
        const loc = locById.get(psv.locationId);
        const eq = loc ? eqById.get(loc.equipmentId) : undefined;
        const compliance = getCompliance(psv);
        return { psv, loc, eq, compliance };
      })
      .sort((a, b) => {
        const da = a.compliance.daysRemaining ?? 99999;
        const db = b.compliance.daysRemaining ?? 99999;
        if (da !== db) return da - db;
        return a.psv.serialNumber.localeCompare(b.psv.serialNumber);
      });
  }, [psvs, filter, data.equipment, data.locations]);

  const label = KPI_FILTER_LABELS[filter];

  const openPSV = (psvId: string) => {
    onClose();
    navigate(`/psv/${psvId}`);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={label}
      description={`${rows.length} safety valve${rows.length === 1 ? '' : 's'}`}
      size="xl"
    >
      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">No valves match this KPI.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="min-w-[7rem] px-4 py-3">Serial</th>
                <th className="min-w-[8rem] px-4 py-3">Inventory ID</th>
                <th className="min-w-[10rem] px-4 py-3">Equipment</th>
                <th className="min-w-[10rem] px-4 py-3">Location</th>
                <th className="min-w-[7rem] px-4 py-3">Status</th>
                <th className="min-w-[8rem] px-4 py-3">Due Date</th>
                <th className="min-w-[7rem] px-4 py-3">Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(({ psv, loc, eq, compliance }) => (
                <tr
                  key={psv.id}
                  onClick={() => openPSV(psv.id)}
                  className="cursor-pointer transition-colors hover:bg-maroon-50/40"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{psv.serialNumber}</p>
                    {psv.tag && <p className="text-xs text-slate-400">{psv.tag}</p>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-700">
                    {psv.inventoryId || '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{eq?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{loc?.name ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusBadge status={psv.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {compliance.dueDate ? (
                      <div>
                        <p className="font-medium text-slate-800">{formatDate(compliance.dueDate)}</p>
                        <p
                          className={`text-xs ${
                            compliance.daysRemaining !== null && compliance.daysRemaining < 0
                              ? 'font-semibold text-red-600'
                              : compliance.daysRemaining !== null && compliance.daysRemaining <= 90
                                ? 'font-semibold text-amber-600'
                                : 'text-slate-400'
                          }`}
                        >
                          {dueText(compliance.daysRemaining)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-400">{STATUS_LABELS[psv.status]}</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <ComplianceBadge state={compliance.state} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
