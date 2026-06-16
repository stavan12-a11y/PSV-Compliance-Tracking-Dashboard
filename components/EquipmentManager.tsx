"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EquipmentRollup } from "@/lib/logic";
import { Badge } from "@/components/Badges";
import { Toast } from "@/components/Toast";

export function EquipmentManager({ equipment }: { equipment: EquipmentRollup[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const res = await fetch("/api/equipment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, area }),
    });
    setBusy(false);
    if (res.ok) {
      setName("");
      setArea("");
      setToast({ msg: "Equipment added" });
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setToast({ msg: d.error ?? "Failed to add equipment", error: true });
    }
  }

  async function toggle(eq: EquipmentRollup) {
    const res = await fetch(`/api/equipment/${eq.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_running: !eq.is_running }),
    });
    if (res.ok) {
      setToast({
        msg: `${eq.name} ${!eq.is_running ? "started" : "stopped"}`,
      });
      router.refresh();
    }
  }

  async function remove(eq: EquipmentRollup) {
    if (
      !confirm(
        `Delete ${eq.name}? This removes its ${eq.trap_count} trap(s) and all PM history.`,
      )
    )
      return;
    const res = await fetch(`/api/equipment/${eq.id}`, { method: "DELETE" });
    if (res.ok) {
      setToast({ msg: `${eq.name} deleted` });
      router.refresh();
    }
  }

  return (
    <>
      <form className="panel" onSubmit={create} style={{ marginBottom: 16 }}>
        <div className="panel-head">
          <h2>Add Equipment</h2>
        </div>
        <div className="panel-body">
          <div className="row wrap" style={{ alignItems: "flex-end" }}>
            <label className="field" style={{ marginBottom: 0, flex: "1 1 220px" }}>
              <span className="lbl">Name</span>
              <input
                type="text"
                value={name}
                placeholder="e.g. Boiler 3"
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="field" style={{ marginBottom: 0, flex: "1 1 220px" }}>
              <span className="lbl">Area</span>
              <input
                type="text"
                value={area}
                placeholder="e.g. Utilities"
                onChange={(e) => setArea(e.target.value)}
              />
            </label>
            <button className="primary" disabled={busy || !name.trim()}>
              {busy ? "Adding…" : "Add Equipment"}
            </button>
          </div>
        </div>
      </form>

      <div className="panel">
        <div className="panel-head">
          <h2>Equipment</h2>
          <span className="hint">{equipment.length} assets</span>
        </div>
        <div className="panel-body flush">
          {equipment.length === 0 ? (
            <div className="empty">No equipment yet. Add your first asset above.</div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Area</th>
                  <th>State</th>
                  <th className="num">Traps</th>
                  <th className="num">Issues</th>
                  <th className="num">Overdue</th>
                  <th style={{ width: 1 }}>Running</th>
                  <th style={{ width: 1 }}></th>
                </tr>
              </thead>
              <tbody>
                {equipment.map((eq) => (
                  <tr key={eq.id}>
                    <td>
                      <Link href={`/equipment/${eq.id}`} style={{ fontWeight: 600 }}>
                        {eq.name}
                      </Link>
                    </td>
                    <td className="muted">{eq.area}</td>
                    <td>
                      {eq.is_running ? (
                        <Badge color="green">Running</Badge>
                      ) : (
                        <Badge color="gray">Stopped</Badge>
                      )}
                    </td>
                    <td className="num">{eq.trap_count}</td>
                    <td className="num">
                      {eq.issue_count > 0 ? (
                        <strong style={{ color: "var(--red)" }}>{eq.issue_count}</strong>
                      ) : (
                        "0"
                      )}
                    </td>
                    <td className="num">
                      {eq.overdue_count > 0 ? (
                        <strong style={{ color: "var(--amber)" }}>
                          {eq.overdue_count}
                        </strong>
                      ) : (
                        "0"
                      )}
                    </td>
                    <td>
                      <button
                        className={`switch ${eq.is_running ? "on" : ""}`}
                        onClick={() => toggle(eq)}
                        style={{ border: "none", background: "none", padding: 0 }}
                        title={eq.is_running ? "Click to stop" : "Click to start"}
                      >
                        <span className="track">
                          <span className="knob" />
                        </span>
                      </button>
                    </td>
                    <td>
                      <button className="danger sm" onClick={() => remove(eq)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {toast ? (
        <Toast
          message={toast.msg}
          error={toast.error}
          onDone={() => setToast(null)}
        />
      ) : null}
    </>
  );
}
