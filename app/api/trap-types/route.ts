import { NextResponse } from "next/server";
import { getDb, save } from "@/lib/store";
import { TRAP_TYPES } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ trap_types: getDb().trap_types });
}

export async function PATCH(req: Request) {
  const db = getDb();
  let body: { type?: string; pm_interval_days?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const type = body.type ?? "";
  if (!TRAP_TYPES.includes(type as (typeof TRAP_TYPES)[number])) {
    return NextResponse.json({ error: "Invalid trap type" }, { status: 400 });
  }
  const interval = Number(body.pm_interval_days);
  if (!Number.isFinite(interval) || interval < 1 || interval > 3650) {
    return NextResponse.json(
      { error: "PM interval must be between 1 and 3650 days" },
      { status: 400 },
    );
  }

  const cfg = db.trap_types.find((t) => t.type === type);
  if (cfg) {
    cfg.pm_interval_days = Math.round(interval);
  } else {
    db.trap_types.push({ type: type as (typeof TRAP_TYPES)[number], pm_interval_days: Math.round(interval) });
  }
  save();
  // Interval change immediately recomputes next-PM for every trap of this type
  // because next-PM is derived on read; nothing else to persist.
  return NextResponse.json({ trap_types: db.trap_types });
}
