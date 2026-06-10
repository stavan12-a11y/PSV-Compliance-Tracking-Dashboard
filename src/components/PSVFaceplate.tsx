import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarClock, Gauge } from 'lucide-react';
import type { PSV, PSVStatus } from '../types';
import { getCompliance, STATUS_LABELS } from '../utils/compliance';
import { formatDate, relativeDays } from '../utils/dates';
import { ComplianceBadge } from './Badges';
import { StatusChangeModal } from './forms/StatusChangeModal';

const TOGGLE_ORDER: PSVStatus[] = ['installed', 'out_for_service', 'inventory'];

const ACTIVE_TOGGLE: Record<PSVStatus, string> = {
  installed: 'bg-emerald-600 text-white',
  out_for_service: 'bg-amber-500 text-white',
  inventory: 'bg-sky-600 text-white',
};

export function PSVFaceplate({ psv }: { psv: PSV }) {
  const navigate = useNavigate();
  const [target, setTarget] = useState<PSVStatus | null>(null);
  const compliance = getCompliance(psv);
  const isInstalled = psv.status === 'installed';

  return (
    <>
      <div
        className={`card flex flex-col overflow-hidden transition-all hover:shadow-card-hover ${
          isInstalled ? 'ring-2 ring-emerald-500/60' : ''
        }`}
      >
        <div
          className={`flex items-center justify-between px-4 py-2 text-xs font-bold uppercase tracking-wide text-white ${
            isInstalled ? 'bg-emerald-600' : psv.status === 'out_for_service' ? 'bg-amber-500' : 'bg-slate-500'
          }`}
        >
          <span>{STATUS_LABELS[psv.status]}</span>
          {isInstalled && <span className="rounded bg-white/20 px-1.5 py-0.5">In Service</span>}
        </div>

        <button
          onClick={() => navigate(`/psv/${psv.id}`)}
          className="group flex-1 px-4 py-3 text-left"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Serial No.</p>
              <h4 className="text-lg font-bold text-slate-900">{psv.serialNumber}</h4>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-maroon-700" />
          </div>

          <div className="mt-2 space-y-1.5 text-sm text-slate-600">
            <p className="flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-slate-400" />
              {psv.datasheet.make} {psv.datasheet.model} · {psv.datasheet.setPressure}{' '}
              {psv.datasheet.pressureUnit}
            </p>
            {isInstalled ? (
              <p className="flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                Due {formatDate(compliance.dueDate)}
                <span
                  className={
                    (compliance.daysRemaining ?? 0) < 0
                      ? 'font-semibold text-red-600'
                      : (compliance.daysRemaining ?? 0) <= 90
                        ? 'font-semibold text-amber-600'
                        : 'text-slate-400'
                  }
                >
                  ({relativeDays(compliance.daysRemaining)})
                </span>
              </p>
            ) : (
              <p className="flex items-center gap-1.5 text-slate-400">
                <CalendarClock className="h-3.5 w-3.5" />
                Last installed {formatDate(compliance.lastInstallDate)}
              </p>
            )}
          </div>

          <div className="mt-2">
            {isInstalled ? (
              <ComplianceBadge state={compliance.state} />
            ) : (
              <ComplianceBadge state="not_installed" />
            )}
          </div>
        </button>

        <div className="border-t border-slate-100 p-3">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Set status
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {TOGGLE_ORDER.map((s) => {
              const active = psv.status === s;
              return (
                <button
                  key={s}
                  onClick={() => {
                    if (!active) setTarget(s);
                  }}
                  className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? ACTIVE_TOGGLE[s]
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title={active ? `Currently ${STATUS_LABELS[s]}` : `Set to ${STATUS_LABELS[s]}`}
                >
                  {STATUS_LABELS[s]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <StatusChangeModal
        open={target !== null}
        onClose={() => setTarget(null)}
        psvId={psv.id}
        serialNumber={psv.serialNumber}
        targetStatus={target ?? 'installed'}
      />
    </>
  );
}
