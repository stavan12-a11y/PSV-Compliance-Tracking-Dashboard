import { NextResponse } from "next/server";
import { getDb } from "@/lib/store";
import {
  allTrapViews,
  computeKPIs,
  equipmentRollups,
  sortByPriority,
} from "@/lib/logic";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const views = allTrapViews(db);
  const queue = sortByPriority(views)
    .filter((v) => v.priority !== "Healthy")
    .slice(0, 10);
  return NextResponse.json({
    kpis: computeKPIs(views),
    queue,
    equipment: equipmentRollups(db),
  });
}
