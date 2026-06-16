import { Topbar } from "@/components/Topbar";
import { SettingsManager } from "@/components/SettingsManager";
import { getDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const db = getDb();
  return (
    <>
      <Topbar title="Settings" crumbs={[{ label: "Settings" }]} />
      <div className="content">
        <SettingsManager trapTypes={db.trap_types} />
      </div>
    </>
  );
}
