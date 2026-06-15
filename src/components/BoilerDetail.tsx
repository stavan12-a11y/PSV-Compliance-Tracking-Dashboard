import { useEffect, useState } from "react";
import type { Boiler } from "../types";
import { useFleet } from "../store";
import {
  getBoilerStatus,
  getLastInspectedDate,
  getScheduleInfo,
} from "../lib/derive";
import { boilerToCsv, downloadCsv, slugify } from "../lib/csv";
import { formatDate } from "../lib/helpers";
import { EditableField, StatusBadge, Warning } from "./ui";
import { WorkflowPanel } from "./WorkflowPanel";
import { HistoryTab } from "./HistoryTab";
import {
  AlertIcon,
  ArrowLeftIcon,
  ClockIcon,
  DownloadIcon,
  GaugeIcon,
  LayersIcon,
  MapPinIcon,
  TrashIcon,
} from "./icons";

type Tab = "overview" | "history";

export function BoilerDetail({
  boiler,
  onClose,
}: {
  boiler: Boiler;
  onClose: () => void;
}) {
  const { updateBoilerField, removeBoiler } = useFleet();
  const [tab, setTab] = useState<Tab>("overview");
  const status = getBoilerStatus(boiler);
  const schedule = getScheduleInfo(boiler);
  const lastInspected = getLastInspectedDate(boiler);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function exportBoiler() {
    downloadCsv(`${slugify(boiler.name)}-report.csv`, boilerToCsv(boiler));
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50">
      {/* Full-width header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Back to fleet</span>
              </button>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold text-slate-900">
                  {boiler.name}
                </h2>
                <div className="mt-1 flex items-center gap-2">
                  <StatusBadge status={status} />
                  <span className="hidden text-xs text-slate-400 sm:inline">
                    {boiler.type} · {boiler.location}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={exportBoiler}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <DownloadIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>

          {(schedule.isOverdue || schedule.isDueSoon) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {schedule.isOverdue && (
                <Warning tone="danger">
                  <AlertIcon className="h-3 w-3" />
                  Inspection overdue by {schedule.daysOverdue} days
                </Warning>
              )}
              {schedule.isDueSoon && (
                <Warning tone="warn">
                  <ClockIcon className="h-3 w-3" />
                  Inspection due in {schedule.daysUntilDue} days
                </Warning>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="mt-4 flex gap-1">
            {(["overview", "history"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold capitalize transition ${
                  tab === t
                    ? "bg-orange-100 text-orange-700"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {t}
                {t === "history" && boiler.history.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 text-[10px] text-slate-600">
                    {boiler.history.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
          {tab === "overview" ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Technical specifications
                </h3>
                <div className="grid gap-1 sm:grid-cols-2">
                  <EditableField
                    label="Name"
                    value={boiler.name}
                    onCommit={(v) => updateBoilerField(boiler.id, "name", v)}
                  />
                  <EditableField
                    label="Type"
                    value={boiler.type}
                    icon={<LayersIcon className="h-3 w-3" />}
                    onCommit={(v) => updateBoilerField(boiler.id, "type", v)}
                  />
                  <EditableField
                    label="Capacity"
                    value={boiler.capacity}
                    icon={<GaugeIcon className="h-3 w-3" />}
                    onCommit={(v) => updateBoilerField(boiler.id, "capacity", v)}
                  />
                  <EditableField
                    label="Pressure rating"
                    value={boiler.pressureRating}
                    onCommit={(v) =>
                      updateBoilerField(boiler.id, "pressureRating", v)
                    }
                  />
                  <EditableField
                    label="Manufacturer"
                    value={boiler.manufacturer}
                    onCommit={(v) =>
                      updateBoilerField(boiler.id, "manufacturer", v)
                    }
                  />
                  <EditableField
                    label="Install date"
                    type="date"
                    value={boiler.installDate}
                    onCommit={(v) =>
                      updateBoilerField(boiler.id, "installDate", v)
                    }
                  />
                  <EditableField
                    label="Location"
                    value={boiler.location}
                    icon={<MapPinIcon className="h-3 w-3" />}
                    onCommit={(v) => updateBoilerField(boiler.id, "location", v)}
                  />
                  <EditableField
                    label="Inspection interval"
                    type="number"
                    suffix="days"
                    value={String(boiler.inspectionIntervalDays)}
                    onCommit={(v) => {
                      const n = Number(v);
                      if (Number.isFinite(n) && n > 0) {
                        updateBoilerField(
                          boiler.id,
                          "inspectionIntervalDays",
                          Math.round(n)
                        );
                      }
                    }}
                  />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 px-3 text-xs text-slate-500">
                  <ClockIcon className="h-3.5 w-3.5 text-slate-400" />
                  Last inspected:{" "}
                  <span className="font-medium text-slate-700">
                    {lastInspected ? formatDate(lastInspected) : "Never"}
                  </span>
                  <span className="text-slate-300">·</span>
                  Next due:{" "}
                  <span className="font-medium text-slate-700">
                    {formatDate(schedule.nextDueDate.toISOString())}
                  </span>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Remove "${boiler.name}" and all its inspection data? This cannot be undone.`
                        )
                      ) {
                        removeBoiler(boiler.id);
                        onClose();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    Remove boiler
                  </button>
                </div>
              </section>

              <section>
                <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                  {boiler.activeInspection ? "Active inspection" : "Inspection"}
                </h3>
                <WorkflowPanel boiler={boiler} />
              </section>
            </div>
          ) : (
            <div className="max-w-3xl">
              <HistoryTab boiler={boiler} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
