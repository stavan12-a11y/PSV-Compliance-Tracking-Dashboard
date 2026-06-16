import { getDb } from "@/lib/store";
import { allTrapViews, computeKPIs, sortByPriority, todayISO } from "@/lib/logic";
import { toCSV } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const views = sortByPriority(allTrapViews(db));
  const kpis = computeKPIs(views);

  const lines: string[] = [];

  // Section 1: KPI summary.
  lines.push(
    toCSV(
      ["KPI", "Value"],
      [
        ["Total Traps", kpis.total_traps],
        ["Active Issues", kpis.active_issues],
        ["Overdue PM", kpis.overdue_pm],
        ["Healthy", kpis.healthy],
        ["Generated", todayISO()],
      ],
    ),
  );
  lines.push("");

  // Section 2: current trap snapshot.
  const headers = [
    "Trap Tag",
    "Type",
    "Location",
    "Equipment",
    "Area",
    "Equipment Running",
    "Priority",
    "Status",
    "Issue Type",
    "Last PM Date",
    "Next PM Date",
    "Days Until Due",
    "PM Interval (days)",
  ];
  const rows = views.map((v) => [
    v.tag,
    v.type,
    v.location,
    v.equipment_name,
    v.equipment_area,
    v.equipment_running ? "Yes" : "No",
    v.priority,
    v.status ?? "Never inspected",
    v.issue_type ?? "",
    v.last_pm_date ?? "",
    v.next_pm_date ?? "",
    v.days_until_due ?? "",
    v.pm_interval_days,
  ]);
  lines.push(toCSV(headers, rows));

  const csv = lines.join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="trap-snapshot-${todayISO()}.csv"`,
    },
  });
}
