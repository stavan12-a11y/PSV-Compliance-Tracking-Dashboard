import { NextResponse } from "next/server";
import { getDb, save, newId } from "@/lib/store";
import { allTrapViews, sortByPriority } from "@/lib/logic";
import { TRAP_TYPES } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ traps: sortByPriority(allTrapViews(getDb())) });
}

export async function POST(req: Request) {
  const db = getDb();
  let body: {
    tag?: string;
    type?: string;
    location?: string;
    equipment_id?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const tag = (body.tag ?? "").trim();
  const location = (body.location ?? "").trim();
  const type = body.type ?? "";
  const equipment_id = body.equipment_id ?? "";

  if (!tag) {
    return NextResponse.json({ error: "Tag is required" }, { status: 400 });
  }
  if (!TRAP_TYPES.includes(type as (typeof TRAP_TYPES)[number])) {
    return NextResponse.json({ error: "Invalid trap type" }, { status: 400 });
  }
  if (!db.equipment.find((e) => e.id === equipment_id)) {
    return NextResponse.json({ error: "Parent equipment not found" }, { status: 400 });
  }
  if (db.traps.some((t) => t.tag.toLowerCase() === tag.toLowerCase())) {
    return NextResponse.json({ error: `Tag ${tag} already exists` }, { status: 409 });
  }

  const trap = {
    id: newId("tr"),
    tag,
    type: type as (typeof TRAP_TYPES)[number],
    location: location || "Unspecified",
    equipment_id,
  };
  db.traps.push(trap);
  save();
  return NextResponse.json({ trap }, { status: 201 });
}
