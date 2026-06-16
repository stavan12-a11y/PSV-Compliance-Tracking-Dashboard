import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/Topbar";
import { PriorityBadge, StatusBadge, Badge } from "@/components/Badges";
import { RunningToggle } from "@/components/RunningToggle";
import { getDb } from "@/lib/store";
import { allTrapViews, sortByPriority } from "@/lib/logic";
import { dueLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();
  const equipment = db.equipment.find((e) => e.id === id);
  if (!equipment) notFound();

  const traps = sortByPriority(
    allTrapViews(db).filter((v) => v.equipment_id === id),
  );
  const issues = traps.filter((t) => t.priority === "Issue").length;
  const overdue = traps.filter((t) => t.priority === "Overdue").length;

  return (
    <>
      <Topbar
        title={equipment.name}
        crumbs={[
          { label: "Equipment", href: "/equipment" },
          { label: equipment.name },
        ]}
        actions={
          <>
            {equipment.is_running ? (
              <Badge color="green">Running</Badge>
            ) : (
              <Badge color="gray">Stopped</Badge>
            )}
            <RunningToggle
              id={equipment.id}
              isRunning={equipment.is_running}
              name={equipment.name}
            />
          </>
        }
      />
      <div className="content">
        {!equipment.is_running ? (
          <div className="banner red" style={{ marginBottom: 16 }}>
            <span className="b-icon">!</span>
            <span>
              <strong>{equipment.name} is stopped.</strong> Preventive maintenance
              cannot be recorded for its traps until the equipment is running.
            </span>
          </div>
        ) : null}

        <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 16 }}>
          <div className="panel" style={{ padding: "12px 16px" }}>
            <div className="label" style={{ fontSize: 11, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Area
            </div>
            <div style={{ fontWeight: 600, marginTop: 4 }}>{equipment.area}</div>
          </div>
          <div className="panel" style={{ padding: "12px 16px" }}>
            <div className="label" style={{ fontSize: 11, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Traps
            </div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 600, marginTop: 2 }}>
              {traps.length}
            </div>
          </div>
          <div className="panel" style={{ padding: "12px 16px" }}>
            <div className="label" style={{ fontSize: 11, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Issues
            </div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 600, marginTop: 2, color: issues ? "var(--red)" : undefined }}>
              {issues}
            </div>
          </div>
          <div className="panel" style={{ padding: "12px 16px" }}>
            <div className="label" style={{ fontSize: 11, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Overdue
            </div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 600, marginTop: 2, color: overdue ? "var(--amber)" : undefined }}>
              {overdue}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Trap Inventory</h2>
            <span className="hint">priority sorted</span>
          </div>
          <div className="panel-body flush">
            {traps.length === 0 ? (
              <div className="empty">
                No traps on this equipment yet.{" "}
                <Link href="/traps">Add a trap</Link>.
              </div>
            ) : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Tag</th>
                    <th>Priority</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th className="num">Last PM</th>
                    <th className="num">Next PM</th>
                    <th className="num">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {traps.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <Link href={`/traps/${v.id}`} className="tag">
                          {v.tag}
                        </Link>
                      </td>
                      <td>
                        <PriorityBadge priority={v.priority} />
                      </td>
                      <td>{v.type}</td>
                      <td>{v.location}</td>
                      <td>
                        <StatusBadge status={v.status} issueType={v.issue_type} />
                      </td>
                      <td className="num mono">{v.last_pm_date ?? "—"}</td>
                      <td className="num mono">{v.next_pm_date ?? "—"}</td>
                      <td className="num">{dueLabel(v.days_until_due, v.priority)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
