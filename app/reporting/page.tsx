import { Topbar } from "@/components/Topbar";
import { getDb } from "@/lib/store";
import { allTrapViews, computeKPIs } from "@/lib/logic";

export const dynamic = "force-dynamic";

export default function ReportingPage() {
  const db = getDb();
  const kpis = computeKPIs(allTrapViews(db));

  return (
    <>
      <Topbar title="Reporting" crumbs={[{ label: "Reporting" }]} />
      <div className="content">
        <div className="grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          <div className="panel">
            <div className="panel-head">
              <h2>PM History Export</h2>
            </div>
            <div className="panel-body">
              <p className="muted" style={{ marginTop: 0 }}>
                Full inspection history across every trap — one row per PM record.
                Includes date, status, issue type, technician and notes.
              </p>
              <p className="stat-inline">
                {db.pm_records.length} records · {db.traps.length} traps
              </p>
              <a className="btn primary" href="/api/export/pm-history" download>
                Download PM History (CSV)
              </a>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h2>Trap Snapshot Export</h2>
            </div>
            <div className="panel-body">
              <p className="muted" style={{ marginTop: 0 }}>
                Current fleet KPIs plus a snapshot of every trap&apos;s computed
                state — priority, status, last/next PM and days until due.
              </p>
              <p className="stat-inline">
                {kpis.total_traps} traps · {kpis.active_issues} issues ·{" "}
                {kpis.overdue_pm} overdue
              </p>
              <a className="btn primary" href="/api/export/snapshot" download>
                Download KPIs + Snapshot (CSV)
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
