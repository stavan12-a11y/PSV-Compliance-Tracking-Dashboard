import { NextResponse } from "next/server";
import { getDb, save } from "@/lib/store";
import { allTrapViews, sortByPriority } from "@/lib/logic";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const db = getDb();
  const equipment = db.equipment.find((e) => e.id === id);
  if (!equipment) {
    return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
  }
  const traps = sortByPriority(
    allTrapViews(db).filter((v) => v.equipment_id === id),
  );
  return NextResponse.json({ equipment, traps });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const db = getDb();
  const equipment = db.equipment.find((e) => e.id === id);
  if (!equipment) {
    return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
  }

  let body: { name?: string; area?: string; is_running?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.is_running === "boolean") equipment.is_running = body.is_running;
  if (typeof body.name === "string" && body.name.trim())
    equipment.name = body.name.trim();
  if (typeof body.area === "string") equipment.area = body.area.trim() || "Unassigned";

  save();
  return NextResponse.json({ equipment });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const db = getDb();
  const idx = db.equipment.findIndex((e) => e.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
  }

  // Cascade: remove child traps and their PM records.
  const trapIds = db.traps.filter((t) => t.equipment_id === id).map((t) => t.id);
  db.traps = db.traps.filter((t) => t.equipment_id !== id);
  db.pm_records = db.pm_records.filter((r) => !trapIds.includes(r.trap_id));
  db.equipment.splice(idx, 1);
  save();
  return NextResponse.json({ ok: true });
}
