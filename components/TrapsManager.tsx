"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TrapView, Equipment, TrapTypeName, Priority } from "@/lib/types";
import { TRAP_TYPES } from "@/lib/types";
import { PriorityBadge, StatusBadge } from "@/components/Badges";
import { Toast } from "@/components/Toast";
import { dueLabel } from "@/lib/format";

type Filter = "All" | "Issues" | "Overdue" | "Upcoming" | "Healthy";

const FILTERS: { key: Filter; match: (p: Priority) => boolean }[] = [
  { key: "All", match: () => true },
  { key: "Issues", match: (p) => p === "Issue" },
  { key: "Overdue", match: (p) => p === "Overdue" },
  { key: "Upcoming", match: (p) => p === "Upcoming" },
  { key: "Healthy", match: (p) => p === "Healthy" },
];

export function TrapsManager({
  traps,
  equipment,
}: {
  traps: TrapView[];
  equipment: Equipment[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("All");
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);

  // Add-trap form state
  const [tag, setTag] = useState("");
  const [type, setType] = useState<TrapTypeName>(TRAP_TYPES[0]);
  const [location, setLocation] = useState("");
  const [equipmentId, setEquipmentId] = useState(equipment[0]?.id ?? "");
  const [busy, setBusy] = useState(false);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      All: traps.length,
      Issues: 0,
      Overdue: 0,
      Upcoming: 0,
      Healthy: 0,
    };
    for (const t of traps) {
      if (t.priority === "Issue") c.Issues++;
      else if (t.priority === "Overdue") c.Overdue++;
      else if (t.priority === "Upcoming") c.Upcoming++;
      else if (t.priority === "Healthy") c.Healthy++;
    }
    return c;
  }, [traps]);

  const filtered = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter)!;
    const needle = q.trim().toLowerCase();
    return traps.filter((t) => {
      if (!f.match(t.priority)) return false;
      if (!needle) return true;
      return (
        t.tag.toLowerCase().includes(needle) ||
        t.location.toLowerCase().includes(needle) ||
        t.type.toLowerCase().includes(needle) ||
        t.equipment_name.toLowerCase().includes(needle)
      );
    });
  }, [traps, filter, q]);

  async function addTrap(e: React.FormEvent) {
    e.preventDefault();
    if (!tag.trim() || !equipmentId) return;
    setBusy(true);
    const res = await fetch("/api/traps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag, type, location, equipment_id: equipmentId }),
    });
    setBusy(false);
    if (res.ok) {
      setTag("");
      setLocation("");
      setShowAdd(false);
      setToast({ msg: `Trap ${tag} added` });
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setToast({ msg: d.error ?? "Failed to add trap", error: true });
    }
  }

  async function remove(t: TrapView) {
    if (!confirm(`Delete ${t.tag}? This removes its PM history.`)) return;
    const res = await fetch(`/api/traps/${t.id}`, { method: "DELETE" });
    if (res.ok) {
      setToast({ msg: `${t.tag} deleted` });
      router.refresh();
    }
  }

  return (
    <>
      <div className="toolbar">
        <div className="chips">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`chip ${filter === f.key ? "active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.key} <span className="n">{counts[f.key]}</span>
            </button>
          ))}
        </div>
        <div className="spacer" />
        <input
          className="search"
          type="text"
          placeholder="Search tag, location, type…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="primary" onClick={() => setShowAdd((s) => !s)}>
          {showAdd ? "Close" : "Add Trap"}
        </button>
      </div>

      {showAdd ? (
        <form className="panel" onSubmit={addTrap} style={{ marginBottom: 16 }}>
          <div className="panel-head">
            <h2>Add Trap</h2>
          </div>
          <div className="panel-body">
            <div className="row wrap" style={{ alignItems: "flex-end" }}>
              <label className="field" style={{ marginBottom: 0, flex: "1 1 140px" }}>
                <span className="lbl">Tag</span>
                <input
                  type="text"
                  value={tag}
                  placeholder="ST-0017"
                  onChange={(e) => setTag(e.target.value)}
                />
              </label>
              <label className="field" style={{ marginBottom: 0, flex: "1 1 180px" }}>
                <span className="lbl">Type</span>
                <select value={type} onChange={(e) => setType(e.target.value as TrapTypeName)}>
                  {TRAP_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field" style={{ marginBottom: 0, flex: "1 1 200px" }}>
                <span className="lbl">Equipment</span>
                <select
                  value={equipmentId}
                  onChange={(e) => setEquipmentId(e.target.value)}
                >
                  {equipment.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field" style={{ marginBottom: 0, flex: "2 1 240px" }}>
                <span className="lbl">Location</span>
                <input
                  type="text"
                  value={location}
                  placeholder="e.g. Boiler 1 — Drip leg"
                  onChange={(e) => setLocation(e.target.value)}
                />
              </label>
              <button className="primary" disabled={busy || !tag.trim() || !equipmentId}>
                {busy ? "Adding…" : "Save Trap"}
              </button>
            </div>
            {equipment.length === 0 ? (
              <p className="muted" style={{ marginTop: 10 }}>
                Add equipment first before creating traps.
              </p>
            ) : null}
          </div>
        </form>
      ) : null}

      <div className="panel">
        <div className="panel-head">
          <h2>Traps</h2>
          <span className="hint">
            {filtered.length} of {traps.length}
          </span>
        </div>
        <div className="panel-body flush">
          {filtered.length === 0 ? (
            <div className="empty">No traps match the current filter.</div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Tag</th>
                  <th>Priority</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Equipment</th>
                  <th>Status</th>
                  <th className="num">Next PM</th>
                  <th className="num">Due</th>
                  <th style={{ width: 1 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <Link href={`/traps/${t.id}`} className="tag">
                        {t.tag}
                      </Link>
                    </td>
                    <td>
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td>{t.type}</td>
                    <td>{t.location}</td>
                    <td>
                      <Link href={`/equipment/${t.equipment_id}`}>
                        {t.equipment_name}
                      </Link>
                    </td>
                    <td>
                      <StatusBadge status={t.status} issueType={t.issue_type} />
                    </td>
                    <td className="num mono">{t.next_pm_date ?? "—"}</td>
                    <td className="num">{dueLabel(t.days_until_due, t.priority)}</td>
                    <td>
                      <button className="danger sm" onClick={() => remove(t)}>
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
        <Toast message={toast.msg} error={toast.error} onDone={() => setToast(null)} />
      ) : null}
    </>
  );
}
