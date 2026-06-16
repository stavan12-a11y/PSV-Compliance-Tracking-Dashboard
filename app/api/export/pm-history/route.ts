import { getDb } from "@/lib/store";
import { recordsForTrap, todayISO } from "@/lib/logic";
import { toCSV } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const trapById = new Map(db.traps.map((t) => [t.id, t]));
  const eqById = new Map(db.equipment.map((e) => [e.id, e]));

  const headers = [
    "PM Date",
    "Trap Tag",
    "Trap Type",
    "Location",
    "Equipment",
    "Area",
    "Status",
    "Issue Type",
    "Technician",
    "Notes",
  ];

  const rows: unknown[][] = [];
  // Newest first per trap, grouped by trap tag for a readable history export.
  const traps = [...db.traps].sort((a, b) => a.tag.localeCompare(b.tag));
  for (const trap of traps) {
    const eq = eqById.get(trap.equipment_id);
    for (const r of recordsForTrap(db, trap.id)) {
      rows.push([
        r.date,
        trap.tag,
        trap.type,
        trap.location,
        eq?.name ?? "",
        eq?.area ?? "",
        r.status,
        r.issue_type ?? "",
        r.technician,
        r.notes,
      ]);
    }
  }
  void trapById;

  const csv = toCSV(headers, rows);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pm-history-${todayISO()}.csv"`,
    },
  });
}
