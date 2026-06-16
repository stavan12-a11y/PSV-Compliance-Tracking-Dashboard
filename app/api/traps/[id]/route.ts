import { NextResponse } from "next/server";
import { getDb, save } from "@/lib/store";
import { buildTrapView, recordsForTrap } from "@/lib/logic";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const db = getDb();
  const trap = db.traps.find((t) => t.id === id);
  if (!trap) {
    return NextResponse.json({ error: "Trap not found" }, { status: 404 });
  }
  const equipment = db.equipment.find((e) => e.id === trap.equipment_id)!;
  return NextResponse.json({
    trap: buildTrapView(db, trap, equipment),
    records: recordsForTrap(db, id),
  });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const db = getDb();
  const idx = db.traps.findIndex((t) => t.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Trap not found" }, { status: 404 });
  }
  db.traps.splice(idx, 1);
  db.pm_records = db.pm_records.filter((r) => r.trap_id !== id);
  save();
  return NextResponse.json({ ok: true });
}
