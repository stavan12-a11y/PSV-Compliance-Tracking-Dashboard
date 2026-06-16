import { Topbar } from "@/components/Topbar";
import { TrapsManager } from "@/components/TrapsManager";
import { getDb } from "@/lib/store";
import { allTrapViews, sortByPriority } from "@/lib/logic";

export const dynamic = "force-dynamic";

export default function TrapsPage() {
  const db = getDb();
  const traps = sortByPriority(allTrapViews(db));
  return (
    <>
      <Topbar title="Traps" crumbs={[{ label: "Traps" }]} />
      <div className="content">
        <TrapsManager traps={traps} equipment={db.equipment} />
      </div>
    </>
  );
}
