"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TrapTypeConfig } from "@/lib/types";
import { Toast } from "@/components/Toast";

export function SettingsManager({ trapTypes }: { trapTypes: TrapTypeConfig[] }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(trapTypes.map((t) => [t.type, String(t.pm_interval_days)])),
  );
  const [savingType, setSavingType] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);

  async function save(type: string) {
    const interval = Number(values[type]);
    if (!Number.isFinite(interval) || interval < 1) {
      setToast({ msg: "Interval must be a positive number", error: true });
      return;
    }
    setSavingType(type);
    const res = await fetch("/api/trap-types", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, pm_interval_days: interval }),
    });
    setSavingType(null);
    if (res.ok) {
      setToast({ msg: `${type} interval updated — next-PM recomputed` });
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setToast({ msg: d.error ?? "Failed to update", error: true });
    }
  }

  async function reset() {
    if (
      !confirm(
        "Reset all data to the seeded demo dataset? This deletes all equipment, traps and PM history.",
      )
    )
      return;
    setResetting(true);
    const res = await fetch("/api/reset", { method: "POST" });
    setResetting(false);
    if (res.ok) {
      setToast({ msg: "Demo data reset" });
      router.refresh();
    }
  }

  return (
    <>
      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-head">
          <h2>PM Intervals by Trap Type</h2>
          <span className="hint">days between scheduled inspections</span>
        </div>
        <div className="panel-body flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>Trap Type</th>
                <th style={{ width: 200 }}>Interval (days)</th>
                <th style={{ width: 1 }}></th>
              </tr>
            </thead>
            <tbody>
              {trapTypes.map((t) => (
                <tr key={t.type}>
                  <td style={{ fontWeight: 600 }}>{t.type}</td>
                  <td>
                    <input
                      type="number"
                      min={1}
                      max={3650}
                      className="mono"
                      value={values[t.type] ?? ""}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [t.type]: e.target.value }))
                      }
                    />
                  </td>
                  <td>
                    <button
                      className="primary sm"
                      onClick={() => save(t.type)}
                      disabled={
                        savingType === t.type ||
                        values[t.type] === String(t.pm_interval_days)
                      }
                    >
                      {savingType === t.type ? "Saving…" : "Save"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Demo Data</h2>
        </div>
        <div className="panel-body">
          <p className="muted" style={{ marginTop: 0 }}>
            Restore the application to its seeded demonstration dataset. Useful for
            resetting after experimentation. This cannot be undone.
          </p>
          <button className="danger" onClick={reset} disabled={resetting}>
            {resetting ? "Resetting…" : "Reset Demo Data"}
          </button>
        </div>
      </div>
      {toast ? (
        <Toast message={toast.msg} error={toast.error} onDone={() => setToast(null)} />
      ) : null}
    </>
  );
}
