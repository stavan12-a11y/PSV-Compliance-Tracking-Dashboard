import { useMemo, useState } from "react";
import { FleetProvider, useFleet } from "./store";
import { boilerToCsv, downloadCsv, fleetToCsv, slugify } from "./lib/csv";
import { getBoilerStatus } from "./lib/derive";
import type { BoilerStatus } from "./types";
import { SummaryCards } from "./components/SummaryCards";
import { BoilerCard } from "./components/BoilerCard";
import { Sidebar } from "./components/Sidebar";
import { BoilerDetail } from "./components/BoilerDetail";
import { AddBoilerModal } from "./components/AddBoilerModal";
import { ActivityLog } from "./components/ActivityLog";
import { StatusDot } from "./components/ui";
import {
  DownloadIcon,
  FlameIcon,
  HistoryClockIcon,
  PlusIcon,
  RefreshIcon,
} from "./components/icons";

const FILTERS: { key: BoilerStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Underway" },
  { key: "failed", label: "Needs repair" },
  { key: "passed", label: "Complete" },
  { key: "none", label: "Not started" },
];

function Dashboard() {
  const { boilers, resetToDemo, activity } = useFleet();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [filter, setFilter] = useState<BoilerStatus | "all">("all");
  const [query, setQuery] = useState("");

  const selected = boilers.find((b) => b.id === selectedId) ?? null;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return boilers.filter((b) => {
      if (filter !== "all" && getBoilerStatus(b) !== filter) return false;
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        b.location.toLowerCase().includes(q) ||
        b.type.toLowerCase().includes(q) ||
        b.manufacturer.toLowerCase().includes(q)
      );
    });
  }, [boilers, filter, query]);

  function exportFleet() {
    downloadCsv("boiler-fleet-export.csv", fleetToCsv(boilers));
  }

  function handleReset() {
    if (
      window.confirm(
        "Reset everything back to demo data? Your current changes will be lost."
      )
    ) {
      resetToDemo();
      setSelectedId(null);
    }
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-sm">
              <FlameIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight text-slate-900 sm:text-lg">
                Boiler Inspection Management
              </h1>
              <p className="hidden text-xs text-slate-500 sm:block">
                Track your fleet and its safety inspections
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowActivity(true)}
              className="relative inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              title="View the change history"
            >
              <HistoryClockIcon className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
              {activity.length > 0 && (
                <span className="rounded-full bg-orange-100 px-1.5 text-[10px] font-bold text-orange-700">
                  {activity.length > 99 ? "99+" : activity.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={exportFleet}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              title="Export the whole fleet to CSV"
            >
              <DownloadIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Export fleet</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              title="Reset to demo data"
            >
              <RefreshIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
        <SummaryCards boilers={boilers} />

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Fleet */}
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      filter === f.key
                        ? "bg-slate-800 text-white"
                        : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {f.key !== "all" && (
                      <StatusDot status={f.key} size="sm" />
                    )}
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search boilers…"
                  className="w-40 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none transition focus:w-52 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
                <button
                  type="button"
                  onClick={() => setAdding(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-orange-600"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Add boiler</span>
                </button>
              </div>
            </div>

            {visible.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <FlameIcon className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm font-medium text-slate-500">
                  No boilers match your filters
                </p>
                <p className="text-xs text-slate-400">
                  Try a different filter or add a new boiler.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((boiler) => (
                  <BoilerCard
                    key={boiler.id}
                    boiler={boiler}
                    onOpen={() => setSelectedId(boiler.id)}
                    onExport={() =>
                      downloadCsv(
                        `${slugify(boiler.name)}-report.csv`,
                        boilerToCsv(boiler)
                      )
                    }
                  />
                ))}
              </div>
            )}
          </div>

          <Sidebar boilers={boilers} onSelect={setSelectedId} />
        </div>
      </main>

      {selected && (
        <BoilerDetail boiler={selected} onClose={() => setSelectedId(null)} />
      )}
      {adding && <AddBoilerModal onClose={() => setAdding(false)} />}
      {showActivity && <ActivityLog onClose={() => setShowActivity(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <FleetProvider>
      <Dashboard />
    </FleetProvider>
  );
}
