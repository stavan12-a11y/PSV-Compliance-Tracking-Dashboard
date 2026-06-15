import { useState } from "react";
import type { Boiler, Inspection } from "../types";
import { inspectionDurationMs } from "../lib/derive";
import { formatDate, formatDateTime, formatDuration } from "../lib/helpers";
import {
  AlertIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  WrenchIcon,
} from "./icons";

function ResultPill({ result }: { result: Inspection["result"] }) {
  if (result === "pass") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
        <CheckIcon className="h-3 w-3" /> Passed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
      <AlertIcon className="h-3 w-3" /> Failed
    </span>
  );
}

function HistoryEntry({ inspection }: { inspection: Inspection }) {
  const [open, setOpen] = useState(false);
  const durationMs = inspectionDurationMs(inspection);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
      >
        <div className="flex items-center gap-3">
          {open ? (
            <ChevronDownIcon className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRightIcon className="h-4 w-4 text-slate-400" />
          )}
          <div>
            <div className="text-sm font-semibold text-slate-800">
              {formatDate(inspection.date)}
            </div>
            <div className="text-[11px] text-slate-400">
              {durationMs !== null && inspection.completedAt
                ? `Took ${formatDuration(
                    inspection.startedAt,
                    inspection.completedAt
                  )}`
                : "Duration n/a"}
            </div>
          </div>
        </div>
        <ResultPill result={inspection.result} />
      </button>

      {open && (
        <div className="animate-fade-in border-t border-slate-100 px-4 py-3">
          {inspection.notes && (
            <p className="mb-3 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {inspection.notes}
            </p>
          )}

          {inspection.steps.length > 0 && (
            <div className="mb-3">
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Workflow timeline
              </div>
              <ol className="space-y-1.5">
                {inspection.steps.map((step) => (
                  <li
                    key={step.key}
                    className="flex items-start gap-2.5 text-xs"
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        step.completed
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {step.completed ? (
                        <CheckIcon className="h-3 w-3" />
                      ) : (
                        <ClockIcon className="h-3 w-3" />
                      )}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-700">
                          {step.label}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatDateTime(step.completedAt)}
                        </span>
                      </div>
                      {step.notes && (
                        <p className="mt-0.5 text-slate-500">{step.notes}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {inspection.repairs.length > 0 && (
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <WrenchIcon className="h-3.5 w-3.5" /> Repairs
              </div>
              <ul className="space-y-1.5">
                {inspection.repairs.map((rep) => (
                  <li
                    key={rep.id}
                    className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600"
                  >
                    <span className="text-[11px] text-slate-400">
                      {formatDateTime(rep.loggedAt)}
                    </span>
                    <p className="mt-0.5">{rep.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function HistoryTab({ boiler }: { boiler: Boiler }) {
  if (boiler.history.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
        <ClockIcon className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-2 text-sm font-medium text-slate-500">
          No archived inspections yet
        </p>
        <p className="text-xs text-slate-400">
          Completed inspection rounds will appear here once archived.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {boiler.history.map((insp) => (
        <HistoryEntry key={insp.id} inspection={insp} />
      ))}
    </div>
  );
}
