import type { ReactNode } from "react";
import type { Boiler } from "../types";
import { getFleetStats } from "../lib/derive";
import { formatAverageDuration } from "../lib/helpers";
import { AlertIcon, ClockIcon, GaugeIcon, LayersIcon } from "./icons";

function Card({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: ReactNode;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accent}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold leading-none text-slate-900">
          {value}
        </div>
        <div className="mt-1 text-xs font-medium text-slate-500">{label}</div>
        {hint ? <div className="text-[11px] text-slate-400">{hint}</div> : null}
      </div>
    </div>
  );
}

export function SummaryCards({ boilers }: { boilers: Boiler[] }) {
  const stats = getFleetStats(boilers);
  const avg = formatAverageDuration(stats.completedDurations);

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card
        label="Total boilers"
        value={stats.total}
        icon={<LayersIcon className="h-6 w-6 text-slate-600" />}
        accent="bg-slate-100"
      />
      <Card
        label="Active inspections"
        value={stats.active}
        icon={<GaugeIcon className="h-6 w-6 text-amber-600" />}
        accent="bg-amber-100"
      />
      <Card
        label="Failed / needs repair"
        value={stats.failed}
        icon={<AlertIcon className="h-6 w-6 text-rose-600" />}
        accent="bg-rose-100"
      />
      <Card
        label="Avg. inspection time"
        value={avg}
        hint={`${stats.completedDurations.length} completed`}
        icon={<ClockIcon className="h-6 w-6 text-sky-600" />}
        accent="bg-sky-100"
      />
    </div>
  );
}
