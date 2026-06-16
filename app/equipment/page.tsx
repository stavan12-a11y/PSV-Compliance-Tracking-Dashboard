import { Topbar } from "@/components/Topbar";
import { EquipmentManager } from "@/components/EquipmentManager";
import { getDb } from "@/lib/store";
import { equipmentRollups } from "@/lib/logic";

export const dynamic = "force-dynamic";

export default function EquipmentPage() {
  const rollups = equipmentRollups(getDb());
  return (
    <>
      <Topbar title="Equipment" crumbs={[{ label: "Equipment" }]} />
      <div className="content">
        <EquipmentManager equipment={rollups} />
      </div>
    </>
  );
}
