import { useEffect, useRef, useState, type ReactNode } from "react";
import type { BoilerStatus } from "../types";
import { STATUS_META } from "../lib/derive";
import { PencilIcon } from "./icons";

export function StatusDot({
  status,
  pulse = false,
  size = "md",
}: {
  status: BoilerStatus;
  pulse?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const dims = size === "sm" ? "h-2.5 w-2.5" : size === "lg" ? "h-4 w-4" : "h-3 w-3";
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-block rounded-full ${dims} ${meta.dot} ${
        pulse && status === "active" ? "animate-pulse-ring" : ""
      }`}
      title={meta.label}
      aria-label={meta.label}
    />
  );
}

export function StatusBadge({ status }: { status: BoilerStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.badgeBg} ${meta.text}`}
    >
      <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

export function Warning({
  tone,
  children,
}: {
  tone: "danger" | "warn";
  children: ReactNode;
}) {
  const styles =
    tone === "danger"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : "bg-amber-50 text-amber-700 border-amber-200";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${styles}`}
    >
      {children}
    </span>
  );
}

interface EditableFieldProps {
  label: string;
  value: string;
  onCommit: (value: string) => void;
  type?: "text" | "date" | "number";
  multiline?: boolean;
  icon?: ReactNode;
  suffix?: string;
}

export function EditableField({
  label,
  value,
  onCommit,
  type = "text",
  multiline = false,
  icon,
  suffix,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [editing]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed !== value.trim()) onCommit(trimmed);
    setEditing(false);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  return (
    <div className="group rounded-lg border border-transparent px-3 py-2 transition hover:border-slate-200 hover:bg-slate-50">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {icon}
        {label}
      </div>
      {editing ? (
        multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            rows={3}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancel();
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) commit();
            }}
            className="w-full resize-none rounded-md border border-orange-300 bg-white px-2 py-1.5 text-sm text-slate-800 shadow-sm outline-none ring-2 ring-orange-100"
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancel();
              if (e.key === "Enter") commit();
            }}
            className="w-full rounded-md border border-orange-300 bg-white px-2 py-1.5 text-sm text-slate-800 shadow-sm outline-none ring-2 ring-orange-100"
          />
        )
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex w-full items-start justify-between gap-2 text-left"
        >
          <span className="text-sm font-medium text-slate-800">
            {value ? (
              <>
                {value}
                {suffix ? <span className="text-slate-400"> {suffix}</span> : null}
              </>
            ) : (
              <span className="italic text-slate-400">Not set</span>
            )}
          </span>
          <PencilIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300 opacity-0 transition group-hover:opacity-100" />
        </button>
      )}
    </div>
  );
}
