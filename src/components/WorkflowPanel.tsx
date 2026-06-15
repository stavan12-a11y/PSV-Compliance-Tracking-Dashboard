import { useState } from "react";
import type { Boiler } from "../types";
import { useFleet } from "../store";
import { formatDateTime, formatDuration } from "../lib/helpers";
import { inspectionDurationMs } from "../lib/derive";
import {
  AlertIcon,
  CheckIcon,
  ClockIcon,
  PlusIcon,
  RefreshIcon,
  WrenchIcon,
} from "./icons";

function StartInspectionForm({ boiler }: { boiler: Boiler }) {
  const { startInspection } = useFleet();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<"pass" | "fail">("pass");

  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
      <h4 className="text-sm font-semibold text-slate-800">
        Start a new inspection
      </h4>
      <p className="mt-1 text-xs text-slate-500">
        Record the inspection date, notes, and the initial outcome.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Inspection date
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        </label>
        <div className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Outcome
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setResult("pass")}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                result === "pass"
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                  : "border-slate-300 bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              Passed
            </button>
            <button
              type="button"
              onClick={() => setResult("fail")}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                result === "fail"
                  ? "border-rose-400 bg-rose-50 text-rose-700"
                  : "border-slate-300 bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              Failed
            </button>
          </div>
        </div>
      </div>

      <label className="mt-4 block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
          Notes
        </span>
        <textarea
          value={notes}
          rows={3}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={
            result === "pass"
              ? "Observations, readings, anything worth recording…"
              : "Describe the defects / reasons for failure…"
          }
          className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
      </label>

      <button
        type="button"
        onClick={() => startInspection(boiler.id, { date, notes, result })}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
      >
        <PlusIcon className="h-4 w-4" />
        Begin inspection
      </button>
    </div>
  );
}

function WorkflowSteps({ boiler }: { boiler: Boiler }) {
  const { completeStep, startFreshRound } = useFleet();
  const inspection = boiler.activeInspection!;
  const steps = inspection.steps;
  const nextIndex = steps.findIndex((s) => !s.completed);
  const [stepNote, setStepNote] = useState("");
  const allDone = inspection.status === "completed";
  const durationMs = inspectionDurationMs(inspection);

  return (
    <div>
      <ol className="relative space-y-1">
        {steps.map((step, idx) => {
          const isCurrent = idx === nextIndex;
          const isDone = step.completed;
          const isLast = idx === steps.length - 1;
          return (
            <li key={step.key} className="relative flex gap-3 pb-2">
              {!isLast && (
                <span
                  className={`absolute left-[15px] top-8 h-[calc(100%-1rem)] w-0.5 ${
                    isDone ? "bg-emerald-300" : "bg-slate-200"
                  }`}
                />
              )}
              <div
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                  isDone
                    ? "border-emerald-400 bg-emerald-400 text-white"
                    : isCurrent
                    ? "border-orange-400 bg-orange-50 text-orange-600"
                    : "border-slate-200 bg-white text-slate-400"
                }`}
              >
                {isDone ? <CheckIcon className="h-4 w-4" /> : idx + 1}
              </div>

              <div className="flex-1 pt-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-sm font-semibold ${
                      isDone
                        ? "text-slate-800"
                        : isCurrent
                        ? "text-orange-700"
                        : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </span>
                  {isDone && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <ClockIcon className="h-3 w-3" />
                      {formatDateTime(step.completedAt)}
                    </span>
                  )}
                </div>

                {isDone && step.notes && (
                  <p className="mt-1 rounded-md bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
                    {step.notes}
                  </p>
                )}

                {isCurrent && (
                  <div className="mt-2 rounded-lg border border-orange-200 bg-orange-50/50 p-3">
                    <textarea
                      value={stepNote}
                      rows={2}
                      onChange={(e) => setStepNote(e.target.value)}
                      placeholder={`Notes for ${step.label.toLowerCase()} (optional)…`}
                      className="w-full resize-none rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        completeStep(boiler.id, step.key, stepNote.trim());
                        setStepNote("");
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600"
                    >
                      <CheckIcon className="h-3.5 w-3.5" />
                      Complete {step.label}
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {allDone && (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <CheckIcon className="h-4 w-4" />
            Inspection complete
          </div>
          <p className="mt-1 text-xs text-emerald-700">
            All five workflow steps finished
            {durationMs !== null && (
              <>
                {" "}
                in{" "}
                <strong>
                  {formatDuration(
                    inspection.startedAt,
                    inspection.completedAt as string
                  )}
                </strong>
              </>
            )}
            . Start a fresh round to archive this one to history.
          </p>
          <button
            type="button"
            onClick={() => startFreshRound(boiler.id)}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900"
          >
            <RefreshIcon className="h-4 w-4" />
            Start fresh round
          </button>
        </div>
      )}
    </div>
  );
}

function RepairFlow({ boiler }: { boiler: Boiler }) {
  const { addRepairLog, triggerReInspection } = useFleet();
  const inspection = boiler.activeInspection!;
  const [repair, setRepair] = useState("");

  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-rose-800">
        <AlertIcon className="h-4 w-4" />
        Inspection failed — repairs required
      </div>
      {inspection.notes && (
        <p className="mt-1.5 rounded-md bg-white/70 px-2.5 py-1.5 text-xs text-rose-700">
          {inspection.notes}
        </p>
      )}

      <div className="mt-3">
        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-rose-400">
          <WrenchIcon className="h-3.5 w-3.5" /> Repair log
        </span>
        {inspection.repairs.length > 0 ? (
          <ul className="space-y-1.5">
            {inspection.repairs.map((rep) => (
              <li
                key={rep.id}
                className="rounded-lg border border-rose-100 bg-white px-3 py-2 text-xs text-slate-700"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <ClockIcon className="h-3 w-3" />
                    {formatDateTime(rep.loggedAt)}
                  </span>
                </div>
                <p className="mt-0.5">{rep.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs italic text-slate-400">No repairs logged yet.</p>
        )}
      </div>

      <div className="mt-3 rounded-lg border border-rose-200 bg-white p-3">
        <textarea
          value={repair}
          rows={2}
          onChange={(e) => setRepair(e.target.value)}
          placeholder="Describe the repair carried out…"
          className="w-full resize-none rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />
        <button
          type="button"
          disabled={!repair.trim()}
          onClick={() => {
            addRepairLog(boiler.id, repair.trim());
            setRepair("");
          }}
          className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Log repair
        </button>
      </div>

      <button
        type="button"
        disabled={inspection.repairs.length === 0}
        onClick={() => triggerReInspection(boiler.id)}
        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
        title={
          inspection.repairs.length === 0
            ? "Log at least one repair before re-inspecting"
            : undefined
        }
      >
        <RefreshIcon className="h-4 w-4" />
        Trigger re-inspection
      </button>
    </div>
  );
}

export function WorkflowPanel({ boiler }: { boiler: Boiler }) {
  const active = boiler.activeInspection;

  if (!active) return <StartInspectionForm boiler={boiler} />;
  if (active.result === "fail") return <RepairFlow boiler={boiler} />;
  return <WorkflowSteps boiler={boiler} />;
}
