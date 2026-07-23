import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarClock, RefreshCw, Wrench } from 'lucide-react';
import type { PSV } from '../types';
import { getCompliance, lastReplacementDate } from '../utils/compliance';
import { formatDate, relativeDays } from '../utils/dates';
import { psvDisplayName, psvPrimaryLabel } from '../utils/psvDisplay';
import { ComplianceBadge } from './Badges';
import { ReplacementFormModal } from './forms/ReplacementFormModal';

function dueColor(days: number | null): string {
  if (days === null) return 'text-slate-400';
  if (days < 0) return 'font-semibold text-red-600';
  if (days <= 90) return 'font-semibold text-amber-600';
  return 'text-slate-600';
}

/** Full-width horizontal card for commercial boiler safeties. */
export function CommercialBoilerFaceplate({ psv }: { psv: PSV }) {
  const navigate = useNavigate();
  const [showReplace, setShowReplace] = useState(false);
  const compliance = getCompliance(psv);
  const certDate = lastReplacementDate(psv) ?? compliance.lastInstallDate;
  const certLabel = lastReplacementDate(psv) ? 'Replaced' : 'Installed';

  return (
    <>
      <div className="card overflow-hidden ring-2 ring-orange-500/40">
        <div className="flex flex-col lg:flex-row lg:items-stretch">
          <button
            type="button"
            onClick={() => navigate(`/psv/${psv.id}`)}
            className="group flex flex-1 items-start gap-4 border-b border-slate-100 p-4 text-left transition-colors hover:bg-orange-50/30 lg:border-b-0 lg:border-r lg:p-5"
          >
            <div className="hidden h-auto w-1 shrink-0 self-stretch rounded-full bg-orange-600 sm:block" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-900">
                  Use &amp; Replace
                </span>
                <ComplianceBadge state={compliance.state} />
              </div>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {psvPrimaryLabel(psv)}
              </p>
              <h4 className="text-lg font-bold text-slate-900">{psvDisplayName(psv)}</h4>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                {certDate && (
                  <span className="inline-flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5 text-slate-400" />
                    {certLabel} {formatDate(certDate)}
                  </span>
                )}
                {compliance.dueDate && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                    Due {formatDate(compliance.dueDate)}
                    <span className={dueColor(compliance.daysRemaining)}>
                      ({relativeDays(compliance.daysRemaining)})
                    </span>
                  </span>
                )}
              </div>
            </div>
            <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-orange-700" />
          </button>

          <div className="flex items-center p-4 lg:w-52 lg:shrink-0 lg:justify-center lg:bg-slate-50/80">
            <button type="button" className="btn-secondary w-full" onClick={() => setShowReplace(true)}>
              <RefreshCw className="h-4 w-4" />
              Record Replacement
            </button>
          </div>
        </div>
      </div>

      <ReplacementFormModal open={showReplace} psvId={psv.id} onClose={() => setShowReplace(false)} />
    </>
  );
}
