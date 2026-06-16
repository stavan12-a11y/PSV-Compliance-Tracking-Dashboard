import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { PriorityBadge, Badge } from "@/components/Badges";
import { getDb } from "@/lib/store";
import {
  allTrapViews,
  computeKPIs,
  equipmentRollups,
  sortByPriority,
} from "@/lib/logic";
import { dueLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const db = getDb();
  const views = allTrapViews(db);
  const kpis = computeKPIs(views);
  const queue = sortByPriority(views)
    .filter((v) => v.priority !== "Healthy")
    .slice(0, 10);
  const rollups = equipmentRollups(db);
  const runningCount = rollups.filter((r) => r.is_running).length;

  return (
    <>
      <Topbar
        title="Dashboard"
        actions={
          <Link href="/traps" className="btn sm">
            View all traps
          </Link>
        }
      />
      <div className="content">
        <div className="kpis">
          <div className="kpi total">
            <div className="label">Total Traps</div>
            <div className="value">{kpis.total_traps}</div>
            <div className="meta">{db.equipment.length} equipment assets</div>
          </div>
          <div className="kpi issue">
            <div className="label">Active Issues</div>
            <div className="value">{kpis.active_issues}</div>
            <div className="meta">need repair</div>
          </div>
          <div className="kpi overdue">
            <div className="label">Overdue PM</div>
            <div className="value">{kpis.overdue_pm}</div>
            <div className="meta">past due date</div>
          </div>
          <div className="kpi healthy">
            <div className="label">Healthy</div>
            <div className="value">{kpis.healthy}</div>
            <div className="meta">
              {kpis.total_traps > 0
                ? Math.round((kpis.healthy / kpis.total_traps) * 100)
                : 0}
              % of fleet
            </div>
          </div>
        </div>

        <div className="dash-grid" style={{ marginTop: 16 }}>
          <div className="panel">
            <div className="panel-head">
              <h2>Priority Action Queue</h2>
              <span className="hint">Top 10 · most urgent first</span>
            </div>
            <div className="panel-body flush">
              {queue.length === 0 ? (
                <div className="empty">
                  No outstanding actions — the whole fleet is healthy.
                </div>
              ) : (
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Tag</th>
                      <th>Priority</th>
                      <th>Location</th>
                      <th>Equipment</th>
                      <th className="num">Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queue.map((v) => (
                      <tr key={v.id}>
                        <td>
                          <Link href={`/traps/${v.id}`} className="tag">
                            {v.tag}
                          </Link>
                        </td>
                        <td>
                          <PriorityBadge priority={v.priority} />
                        </td>
                        <td>{v.location}</td>
                        <td>
                          <Link href={`/equipment/${v.equipment_id}`}>
                            {v.equipment_name}
                          </Link>
                        </td>
                        <td className="num">
                          {dueLabel(v.days_until_due, v.priority)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h2>Equipment Roll-up</h2>
              <span className="hint">
                {runningCount}/{rollups.length} running
              </span>
            </div>
            <div className="panel-body flush">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>State</th>
                    <th className="num">Traps</th>
                    <th className="num">Issues</th>
                    <th className="num">Overdue</th>
                  </tr>
                </thead>
                <tbody>
                  {rollups.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <Link href={`/equipment/${r.id}`}>{r.name}</Link>
                        <div className="muted" style={{ fontSize: 11 }}>
                          {r.area}
                        </div>
                      </td>
                      <td>
                        {r.is_running ? (
                          <Badge color="green">Running</Badge>
                        ) : (
                          <Badge color="gray">Stopped</Badge>
                        )}
                      </td>
                      <td className="num">{r.trap_count}</td>
                      <td className="num">
                        {r.issue_count > 0 ? (
                          <strong style={{ color: "var(--red)" }}>
                            {r.issue_count}
                          </strong>
                        ) : (
                          "0"
                        )}
                      </td>
                      <td className="num">
                        {r.overdue_count > 0 ? (
                          <strong style={{ color: "var(--amber)" }}>
                            {r.overdue_count}
                          </strong>
                        ) : (
                          "0"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
