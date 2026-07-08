import { AlertTriangle, CheckCircle2, Gauge, Percent, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { KPISummary } from '../types';
import type { KPIFilterKey } from '../utils/kpiFilter';

interface KPICardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent: string;
  iconBg: string;
  hint?: string;
  onSelect?: () => void;
}

function KPICard({ label, value, icon: Icon, accent, iconBg, hint, onSelect }: KPICardProps) {
  const clickable = Boolean(onSelect);

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!clickable}
      className={`card flex w-full items-center gap-4 p-4 text-left transition-all ${
        clickable ? 'cursor-pointer hover:shadow-card-hover' : ''
      }`}
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className={`h-5 w-5 ${accent}`} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-none text-slate-900">{value}</p>
        <p className="mt-1 truncate text-xs font-medium text-slate-500">{label}</p>
        {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
      </div>
    </button>
  );
}

interface KPIGridProps {
  summary: KPISummary;
  onFilterSelect?: (filter: KPIFilterKey) => void;
}

export function KPIGrid({ summary, onFilterSelect }: KPIGridProps) {
  const select = (filter: KPIFilterKey) => onFilterSelect?.(filter);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      <KPICard
        label="Total PSVs"
        value={summary.total}
        icon={Gauge}
        accent="text-slate-700"
        iconBg="bg-slate-100"
        onSelect={onFilterSelect ? () => select('total') : undefined}
      />
      <KPICard
        label="Compliant %"
        value={`${summary.complianceRate}%`}
        icon={Percent}
        accent="text-emerald-600"
        iconBg="bg-emerald-50"
        hint={`${summary.compliant} of ${summary.installed} installed`}
        onSelect={onFilterSelect ? () => select('compliant') : undefined}
      />
      <KPICard
        label="Installed"
        value={summary.installed}
        icon={CheckCircle2}
        accent="text-emerald-600"
        iconBg="bg-emerald-50"
        onSelect={onFilterSelect ? () => select('installed') : undefined}
      />
      <KPICard
        label="Out for Service"
        value={summary.outForService}
        icon={Wrench}
        accent="text-amber-600"
        iconBg="bg-amber-50"
        onSelect={onFilterSelect ? () => select('out_for_service') : undefined}
      />
      <KPICard
        label="Overdue"
        value={summary.overdue}
        icon={AlertTriangle}
        accent="text-red-600"
        iconBg="bg-red-50"
        onSelect={onFilterSelect ? () => select('overdue') : undefined}
      />
    </div>
  );
}
