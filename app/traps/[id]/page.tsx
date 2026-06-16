import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/Topbar";
import { PriorityBadge, StatusBadge, Badge } from "@/components/Badges";
import { PMEntry } from "@/components/PMEntry";
import { TrapDeleteButton } from "@/components/TrapDeleteButton";
import { getDb } from "@/lib/store";
import { buildTrapView, recordsForTrap } from "@/lib/logic";
import { dueLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TrapDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();
  const trap = db.traps.find((t) => t.id === id);
  if (!trap) notFound();
  const equipment = db.equipment.find((e) => e.id === trap.equipment_id)!;
  const view = buildTrapView(db, trap, equipment);
  const records = recordsForTrap(db, id);

  return (
    <>
      <Topbar
        title={view.tag}
        crumbs={[
          { label: "Traps", href: "/traps" },
          { label: view.tag },
        ]}
        actions={
          <>
            <PriorityBadge priority={view.priority} />
            <PMEntry
              trapId={view.id}
              trapTag={view.tag}
              equipmentName={view.equipment_name}
              equipmentRunning={view.equipment_running}
            />
            <TrapDeleteButton trapId={view.id} trapTag={view.tag} />
          </>
        }
      />
      <div className="content">
        {!view.equipment_running ? (
          <div className="banner red" style={{ marginBottom: 16 }}>
            <span className="b-icon">!</span>
            <span>
              <strong>{view.equipment_name} is stopped.</strong> PM entry is
              disabled for this trap until the parent equipment is running.
            </span>
          </div>
        ) : null}

        <div className="dash-grid">
          <div className="panel">
            <div className="panel-head">
              <h2>Metadata</h2>
              <StatusBadge status={view.status} issueType={view.issue_type} />
            </div>
            <div className="panel-body">
              <dl className="dl">
                <dt>Tag</dt>
                <dd className="mono" style={{ fontWeight: 600 }}>
                  {view.tag}
                </dd>
                <dt>Type</dt>
                <dd>{view.type}</dd>
                <dt>Location</dt>
                <dd>{view.location}</dd>
                <dt>Equipment</dt>
                <dd>
                  <Link href={`/equipment/${view.equipment_id}`}>
                    {view.equipment_name}
                  </Link>{" "}
                  {view.equipment_running ? (
                    <Badge color="green">Running</Badge>
                  ) : (
                    <Badge color="gray">Stopped</Badge>
                  )}
                </dd>
                <dt>Area</dt>
                <dd>{view.equipment_area}</dd>
                <dt>Priority</dt>
                <dd>
                  <PriorityBadge priority={view.priority} />
                </dd>
                <dt>PM Interval</dt>
                <dd className="mono">{view.pm_interval_days} days</dd>
                <dt>Last PM</dt>
                <dd className="mono">{view.last_pm_date ?? "—"}</dd>
                <dt>Next PM</dt>
                <dd className="mono">
                  {view.next_pm_date ?? "—"}
                  {view.next_pm_date ? (
                    <span className="muted">
                      {" "}
                      · {dueLabel(view.days_until_due, view.priority)}
                    </span>
                  ) : null}
                </dd>
              </dl>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h2>Inspection History</h2>
              <span className="hint">{records.length} records</span>
            </div>
            <div className="panel-body">
              {records.length === 0 ? (
                <div className="empty">
                  No inspections recorded yet. Use <strong>Record PM</strong> to log
                  the first inspection.
                </div>
              ) : (
                <ul className="timeline">
                  {records.map((r) => (
                    <li
                      key={r.id}
                      className={r.status === "Issue" ? "issue" : "working"}
                    >
                      <div className="row" style={{ justifyContent: "space-between" }}>
                        <span className="tl-date">{r.date}</span>
                        <StatusBadge
                          status={r.status}
                          issueType={r.issue_type}
                        />
                      </div>
                      <div className="tl-meta">
                        Technician: {r.technician}
                      </div>
                      {r.notes ? <div className="tl-notes">{r.notes}</div> : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
