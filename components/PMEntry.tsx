"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TrapStatus, IssueType } from "@/lib/types";
import { ISSUE_TYPES } from "@/lib/types";
import { Toast } from "@/components/Toast";

function today(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function PMEntry({
  trapId,
  trapTag,
  equipmentName,
  equipmentRunning,
}: {
  trapId: string;
  trapTag: string;
  equipmentName: string;
  equipmentRunning: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(today());
  const [status, setStatus] = useState<TrapStatus>("Working");
  const [issueType, setIssueType] = useState<IssueType>(ISSUE_TYPES[0]);
  const [technician, setTechnician] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function reset() {
    setDate(today());
    setStatus("Working");
    setIssueType(ISSUE_TYPES[0]);
    setTechnician("");
    setNotes("");
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/traps/${trapId}/pm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        status,
        issue_type: status === "Issue" ? issueType : null,
        technician,
        notes,
      }),
    });
    setBusy(false);
    if (res.ok) {
      setOpen(false);
      reset();
      setToast(`PM recorded for ${trapTag}`);
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Failed to record PM");
    }
  }

  return (
    <>
      <button
        className="primary"
        onClick={() => {
          reset();
          setOpen(true);
        }}
        disabled={!equipmentRunning}
        title={
          equipmentRunning
            ? "Record a PM inspection"
            : `${equipmentName} is stopped — cannot record PM`
        }
      >
        Record PM
      </button>

      {open ? (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={submit}>
              <div className="modal-head">
                <h2>Record PM · {trapTag}</h2>
                <button
                  type="button"
                  className="ghost sm"
                  onClick={() => setOpen(false)}
                >
                  Close
                </button>
              </div>
              <div className="modal-body">
                {!equipmentRunning ? (
                  <div className="banner red" style={{ marginBottom: 16 }}>
                    <span className="b-icon">!</span>
                    <span>
                      {equipmentName} is stopped. PM entry is disabled.
                    </span>
                  </div>
                ) : null}

                {error ? (
                  <div className="banner red" style={{ marginBottom: 16 }}>
                    <span className="b-icon">!</span>
                    <span>{error}</span>
                  </div>
                ) : null}

                <label className="field">
                  <span className="lbl">Inspection Date</span>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </label>

                <label className="field">
                  <span className="lbl">Status</span>
                  <div className="toggle">
                    <button
                      type="button"
                      className={status === "Working" ? "on-working" : ""}
                      onClick={() => setStatus("Working")}
                    >
                      Working
                    </button>
                    <button
                      type="button"
                      className={status === "Issue" ? "on-issue" : ""}
                      onClick={() => setStatus("Issue")}
                    >
                      Issue
                    </button>
                  </div>
                </label>

                {status === "Issue" ? (
                  <label className="field">
                    <span className="lbl">Issue Type (required)</span>
                    <select
                      value={issueType}
                      onChange={(e) => setIssueType(e.target.value as IssueType)}
                    >
                      {ISSUE_TYPES.map((it) => (
                        <option key={it} value={it}>
                          {it}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                <label className="field">
                  <span className="lbl">Technician</span>
                  <input
                    type="text"
                    value={technician}
                    placeholder="e.g. R. Alvarez"
                    onChange={(e) => setTechnician(e.target.value)}
                  />
                </label>

                <label className="field" style={{ marginBottom: 0 }}>
                  <span className="lbl">Notes</span>
                  <textarea
                    value={notes}
                    placeholder="Observations, actions taken…"
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </label>
              </div>
              <div className="modal-foot">
                <button type="button" className="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button className="primary" disabled={busy || !equipmentRunning}>
                  {busy ? "Saving…" : "Submit PM"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
      {toast ? <Toast message={toast} onDone={() => setToast(null)} /> : null}
    </>
  );
}
