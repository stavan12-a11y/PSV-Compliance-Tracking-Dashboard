import type { Boiler } from "../types";
import {
  getBoilerStatus,
  getLastInspectedDate,
  getScheduleInfo,
  STATUS_META,
} from "../lib/derive";
import { formatDate } from "../lib/helpers";
import { StatusDot, Warning } from "./ui";
import {
  AlertIcon,
  ClockIcon,
  DownloadIcon,
  GaugeIcon,
  MapPinIcon,
} from "./icons";

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

  const active = boiler.activeInspection;
  const stepProgress =
    active && active.result === "pass"
      ? `${active.steps.filter((s) => s.completed).length}/${active.steps.length}`
      : null;

  return (
    <div
      className="group relative flex cursor-pointer flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
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
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <StatusDot status={status} size="lg" pulse />
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-slate-900">
              {boiler.name}
            </h3>
            <p className="truncate text-xs text-slate-500">{boiler.type}</p>
          </div>
        </div>
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

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className={`text-xs font-medium ${meta.text}`}>{meta.label}</span>
        {stepProgress ? (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
            Step {stepProgress}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <ClockIcon className="h-3 w-3" />
            {lastInspected ? formatDate(lastInspected) : "Never inspected"}
          </span>
        )}
      </div>

      {(schedule.isOverdue || schedule.isDueSoon) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {schedule.isOverdue && (
            <Warning tone="danger">
              <AlertIcon className="h-3 w-3" />
              Overdue {schedule.daysOverdue}d
            </Warning>
          )}
          {schedule.isDueSoon && (
            <Warning tone="warn">
              <ClockIcon className="h-3 w-3" />
              Due in {schedule.daysUntilDue}d
            </Warning>
          )}
        </div>
      )}
    </div>
  );
}
