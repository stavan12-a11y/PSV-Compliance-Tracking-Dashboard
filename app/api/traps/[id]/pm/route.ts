import { NextResponse } from "next/server";
import { getDb, save, newId } from "@/lib/store";
import { buildTrapView, recordsForTrap, todayISO } from "@/lib/logic";
import { ISSUE_TYPES } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const db = getDb();
  const trap = db.traps.find((t) => t.id === id);
  if (!trap) {
    return NextResponse.json({ error: "Trap not found" }, { status: 404 });
  }
  const equipment = db.equipment.find((e) => e.id === trap.equipment_id);
  if (!equipment) {
    return NextResponse.json({ error: "Parent equipment not found" }, { status: 404 });
  }

  // Business rule: PM may only be recorded while parent equipment is running.
  if (!equipment.is_running) {
    return NextResponse.json(
      {
        error: `Cannot record PM: ${equipment.name} is currently stopped. Start the equipment before logging an inspection.`,
      },
      { status: 409 },
    );
  }

  let body: {
    date?: string;
    status?: string;
    issue_type?: string | null;
    technician?: string;
    notes?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const status = body.status;
  if (status !== "Working" && status !== "Issue") {
    return NextResponse.json(
      { error: "Status must be 'Working' or 'Issue'" },
      { status: 400 },
    );
  }

  let issue_type: string | null = null;
  if (status === "Issue") {
    issue_type = body.issue_type ?? null;
    if (!issue_type || !ISSUE_TYPES.includes(issue_type as (typeof ISSUE_TYPES)[number])) {
      return NextResponse.json(
        { error: "Issue type is required when status is 'Issue'" },
        { status: 400 },
      );
    }
  }

  const date = (body.date ?? "").trim() || todayISO();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Date must be YYYY-MM-DD" }, { status: 400 });
  }

  const record = {
    id: newId("pm"),
    trap_id: id,
    date,
    status: status as "Working" | "Issue",
    issue_type: issue_type as "Blowing" | "Blocked" | "Leak" | "Cycling" | null,
    technician: (body.technician ?? "").trim() || "Unknown",
    notes: (body.notes ?? "").trim(),
    created_at: new Date().toISOString(),
  };
  db.pm_records.push(record);
  save();

  return NextResponse.json(
    {
      record,
      trap: buildTrapView(db, trap, equipment),
      records: recordsForTrap(db, id),
    },
    { status: 201 },
  );
}
