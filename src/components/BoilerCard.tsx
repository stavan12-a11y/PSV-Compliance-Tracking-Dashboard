import type { Boiler } from "../types";
import { WORKFLOW_STEPS } from "../types";
import {
  getBoilerStatus,
  getLastInspectedDate,
  getScheduleInfo,
  STATUS_META,
} from "../lib/derive";
import { formatDate } from "../lib/helpers";
import { Warning } from "./ui";
import {
  AlertIcon,
  CheckIcon,
  ClockIcon,
  DownloadIcon,
  GaugeIcon,
  MapPinIcon,
  WrenchIcon,
} from "./icons";

type SegState = "done" | "current" | "pending";

const SEG_CLASS: Record<SegState, string> = {
  done: "bg-emerald-400",
  current: "bg-amber-400 animate-pulse",
  pending: "bg-slate-200",
};

/** A colour-coded 5-segment bar that makes the current workflow stage obvious. */
function StageStepper({ boiler }: { boiler: Boiler }) {
  const status = getBoilerStatus(boiler);
  const active = boiler.activeInspection;

  if (status === "failed") {
    const repairs = active?.repairs.length ?? 0;
    return (
      <div>
        <div className="flex gap-1">
          {WORKFLOW_STEPS.map((s) => (
            <span
              key={s.key}
              title={s.label}
              className="h-1.5 flex-1 rounded-full bg-rose-300"
            />
          ))}
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
          <WrenchIcon className="h-3.5 w-3.5" />
          Repairs in progress · {repairs} logged
        </div>
      </div>
    );
  }

  let segStates: SegState[];
  let label: string;
  let labelClass = "text-slate-500";
  let icon = <ClockIcon className="h-3.5 w-3.5" />;

  if (status === "active" && active) {
    const nextIndex = active.steps.findIndex((s) => !s.completed);
    segStates = active.steps.map((s, i) =>
      s.completed ? "done" : i === nextIndex ? "current" : "pending"
    );
    const current = nextIndex >= 0 ? active.steps[nextIndex] : null;
    label = current
      ? `${current.label} · stage ${nextIndex + 1} of ${active.steps.length}`
      : "All stages complete";
    labelClass = "text-amber-700";
    icon = <GaugeIcon className="h-3.5 w-3.5" />;
  } else if (status === "passed") {
    segStates = WORKFLOW_STEPS.map(() => "done");
    label = "All stages complete";
    labelClass = "text-emerald-700";
    icon = <CheckIcon className="h-3.5 w-3.5" />;
  } else {
    segStates = WORKFLOW_STEPS.map(() => "pending");
    label =
      boiler.history.length > 0 ? "Awaiting re-inspection" : "No inspection started";
  }

  return (
    <div>
      <div className="flex gap-1">
        {WORKFLOW_STEPS.map((s, i) => (
          <span
            key={s.key}
            title={`${s.label} — ${segStates[i]}`}
            className={`h-1.5 flex-1 rounded-full ${SEG_CLASS[segStates[i]]}`}
          />
        ))}
      </div>
      <div
        className={`mt-2 flex items-center gap-1.5 text-xs font-semibold ${labelClass}`}
      >
        {icon}
        <span className="truncate">{label}</span>
      </div>
    </div>
  );
}

export function BoilerCard({
  boiler,
  onOpen,
  onExport,
}: {
  boiler: Boiler;
  onOpen: () => void;
  onExport: () => void;
}) {
  const status = getBoilerStatus(boiler);
  const meta = STATUS_META[status];
  const schedule = getScheduleInfo(boiler);
  const lastInspected = getLastInspectedDate(boiler);

  return (
    <div
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      {/* Status accent strip */}
      <span className={`block h-1.5 w-full ${meta.dot}`} />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-slate-900">
              {boiler.name}
            </h3>
            <p className="truncate text-xs text-slate-500">
              {boiler.type} · {boiler.manufacturer}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-semibold ${meta.badgeBg} ${meta.text}`}
            >
              <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
              <span className="hidden sm:inline">{meta.label}</span>
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onExport();
              }}
              className="rounded-lg p-1.5 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100"
              title="Export this boiler to CSV"
            >
              <DownloadIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <GaugeIcon className="h-3.5 w-3.5 text-slate-400" />
            <span className="truncate">{boiler.capacity}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="text-slate-400">⌀</span>
            <span className="truncate">{boiler.pressureRating}</span>
          </div>
          <div className="col-span-2 flex items-center gap-1.5 text-slate-600">
            <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{boiler.location}</span>
          </div>
        </div>

        {/* Stage progress */}
        <div className="mt-4 border-t border-slate-100 pt-3">
          <StageStepper boiler={boiler} />
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <ClockIcon className="h-3 w-3" />
            {lastInspected
              ? `Last: ${formatDate(lastInspected)}`
              : "Never inspected"}
          </span>
          <div className="flex flex-wrap justify-end gap-1.5">
            {schedule.isOverdue && (
              <Warning tone="danger">
                <AlertIcon className="h-3 w-3" />
                Overdue {schedule.daysOverdue}d
              </Warning>
            )}
            {schedule.isDueSoon && (
              <Warning tone="warn">
                <ClockIcon className="h-3 w-3" />
                Due {schedule.daysUntilDue}d
              </Warning>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
