import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, Gauge, RefreshCw, Wrench } from 'lucide-react';
import type { PSV, PSVStatus } from '../types';
import { usePSV } from '../store/PSVContext';
import { getCompliance, lastReplacementDate, lastServiceDate, STATUS_LABELS } from '../utils/compliance';
import { formatDate, relativeDays, todayISO } from '../utils/dates';
import { psvDisplayName, psvPrimaryLabel } from '../utils/psvDisplay';
import { ComplianceBadge } from './Badges';
import { ReplacementFormModal } from './forms/ReplacementFormModal';

const TOGGLE_ORDER: PSVStatus[] = ['installed', 'out_for_service', 'inventory'];

const ACTIVE_TOGGLE: Record<PSVStatus, string> = {
  installed: 'bg-emerald-600 text-white',
  out_for_service: 'bg-amber-500 text-white',
  inventory: 'bg-sky-600 text-white',
};

function dueColor(days: number | null): string {
  if (days === null) return 'text-slate-400';
  if (days < 0) return 'font-semibold text-red-600';
  if (days <= 90) return 'font-semibold text-amber-600';
  return 'text-slate-500';
}

function activePsvLabel(psv: PSV): string {
  if (psv.useAndReplace) return 'Use & replace';
  if (psv.servicedOnSite) return 'On site';
  return STATUS_LABELS[psv.status];
}

export function PSVFaceplate({
  psv,
  compact = false,
}: {
  psv: PSV;
  /** SUP3: minimal card — status, install date, days remaining only. */
  compact?: boolean;
}) {
  const navigate = useNavigate();
  const { setStatus, addHistoryEvent } = usePSV();
  const [showReplace, setShowReplace] = useState(false);
  const compliance = getCompliance(psv);
  const onSite = Boolean(psv.servicedOnSite);
  const useAndReplace = Boolean(psv.useAndReplace);
  const isInstalled = psv.status === 'installed' || onSite || useAndReplace;

  const headerColor = useAndReplace
    ? 'bg-orange-700'
    : onSite
      ? 'bg-maroon-800'
      : isInstalled
        ? 'bg-emerald-600'
        : psv.status === 'out_for_service'
          ? 'bg-amber-500'
          : 'bg-slate-500';

  const headerLabel = useAndReplace
    ? 'Use & Replace'
    : onSite
      ? 'Serviced On Site'
      : STATUS_LABELS[psv.status];

  const certDate = useAndReplace
    ? lastReplacementDate(psv) ?? compliance.lastInstallDate
    : onSite
      ? lastServiceDate(psv) ?? compliance.lastInstallDate
      : compliance.lastInstallDate;

  if (compact) {
    return (
      <>
        <div className="card flex flex-col overflow-hidden">
          <button
            type="button"
            onClick={() => navigate(`/psv/${psv.id}`)}
            className="flex-1 px-4 py-3 text-left transition-colors hover:bg-slate-50"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {activePsvLabel(psv)}
            </p>
            {certDate && compliance.dueDate ? (
              <div className="mt-2 space-y-1 text-sm">
                <p className="text-slate-700">
                  Installed <span className="font-semibold text-slate-900">{formatDate(certDate)}</span>
                </p>
                <p className={`font-medium ${dueColor(compliance.daysRemaining)}`}>
                  {relativeDays(compliance.daysRemaining)}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-400">No install date on record</p>
            )}
          </button>

          <div className="border-t border-slate-100 p-2">
            {useAndReplace ? (
              <button className="btn-secondary w-full py-1.5 text-xs" onClick={() => setShowReplace(true)}>
                <RefreshCw className="h-3.5 w-3.5" />
                Record replacement
              </button>
            ) : onSite ? (
              <button
                className="btn-secondary w-full py-1.5 text-xs"
                onClick={() =>
                  addHistoryEvent(psv.id, {
                    type: 'service',
                    date: todayISO(),
                    description: 'Serviced on site',
                  })
                }
              >
                <Wrench className="h-3.5 w-3.5" />
                Record service
              </button>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {TOGGLE_ORDER.map((s) => {
                  const active = psv.status === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        if (!active) setStatus(psv.id, s, todayISO());
                      }}
                      className={`rounded-md px-1 py-1 text-[10px] font-semibold ${
                        active ? ACTIVE_TOGGLE[s] : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {STATUS_LABELS[s].replace('Out for Service', 'OOS').replace('In Inventory', 'Inv')}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <ReplacementFormModal open={showReplace} psvId={psv.id} onClose={() => setShowReplace(false)} />
      </>
    );
  }

  return (
    <>
      <div
        className={`card flex flex-col overflow-hidden transition-all hover:shadow-card-hover ${
          isInstalled ? 'ring-2 ring-emerald-500/60' : ''
        }`}
      >
        <div
          className={`flex items-center justify-between px-4 py-2 text-xs font-bold uppercase tracking-wide text-white ${headerColor}`}
        >
          <span>{headerLabel}</span>
          {isInstalled && <span className="rounded bg-white/20 px-1.5 py-0.5">In Service</span>}
        </div>

        <button
          type="button"
          onClick={() => navigate(`/psv/${psv.id}`)}
          className="group flex-1 px-4 py-3 text-left"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {psvPrimaryLabel(psv)}
            </p>
            <h4 className="text-lg font-bold text-slate-900">{psvDisplayName(psv)}</h4>
          </div>

          <div className="mt-2 space-y-1.5 text-sm text-slate-600">
            <p className="flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-slate-400" />
              {useAndReplace
                ? `Rating ${psv.datasheet.capacity} · ${psv.datasheet.inletSize} / ${psv.datasheet.outletSize}`
                : `${psv.datasheet.make} ${psv.datasheet.model} · ${psv.datasheet.setPressure} ${psv.datasheet.pressureUnit}`}
            </p>
            {compliance.dueDate && (
              <>
                <p className="flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5 text-slate-400" />
                  Installed {formatDate(certDate)}
                </p>
                <p className="flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                  Due {formatDate(compliance.dueDate)}
                  <span className={dueColor(compliance.daysRemaining)}>
                    ({relativeDays(compliance.daysRemaining)})
                  </span>
                </p>
              </>
            )}
            {onSite && (
              <p className="flex items-center gap-1.5 text-slate-500">
                <Wrench className="h-3.5 w-3.5 text-slate-400" />
                Last serviced {formatDate(lastServiceDate(psv))}
              </p>
            )}
            {useAndReplace && (
              <p className="text-xs text-orange-800/80">New valve purchased when due — not recertified</p>
            )}
          </div>

          <div className="mt-2">
            <ComplianceBadge state={compliance.state} />
          </div>
        </button>

        <div className="border-t border-slate-100 p-3">
          {useAndReplace ? (
            <button className="btn-secondary w-full" onClick={() => setShowReplace(true)}>
              <RefreshCw className="h-4 w-4" />
              Record Replacement
            </button>
          ) : onSite ? (
            <button
              className="btn-secondary w-full"
              onClick={() =>
                addHistoryEvent(psv.id, {
                  type: 'service',
                  date: todayISO(),
                  description: 'Serviced on site',
                })
              }
              title="Record an on-site service / recertification (uses today's date)"
            >
              <Wrench className="h-4 w-4" />
              Record Service (today)
            </button>
          ) : (
            <>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Set status
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {TOGGLE_ORDER.map((s) => {
                  const active = psv.status === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        if (!active) setStatus(psv.id, s, todayISO());
                      }}
                      className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors ${
                        active ? ACTIVE_TOGGLE[s] : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      title={active ? `Currently ${STATUS_LABELS[s]}` : `Set to ${STATUS_LABELS[s]} (today)`}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <ReplacementFormModal open={showReplace} psvId={psv.id} onClose={() => setShowReplace(false)} />
    </>
  );
}
