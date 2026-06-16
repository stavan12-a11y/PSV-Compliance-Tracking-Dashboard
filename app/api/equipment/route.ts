import { NextResponse } from "next/server";
import { getDb, save, newId } from "@/lib/store";
import { equipmentRollups } from "@/lib/logic";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ equipment: equipmentRollups(getDb()) });
}

export async function POST(req: Request) {
  const db = getDb();
  let body: { name?: string; area?: string; is_running?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const area = (body.area ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const equipment = {
    id: newId("eq"),
    name,
    area: area || "Unassigned",
    is_running: body.is_running !== false,
  };
  db.equipment.push(equipment);
  save();
  return NextResponse.json({ equipment }, { status: 201 });
}
