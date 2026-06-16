"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TrapDeleteButton({
  trapId,
  trapTag,
}: {
  trapId: string;
  trapTag: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm(`Delete ${trapTag}? This permanently removes its PM history.`))
      return;
    setBusy(true);
    const res = await fetch(`/api/traps/${trapId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/traps");
      router.refresh();
    } else {
      setBusy(false);
    }
  }

  return (
    <button className="danger sm" onClick={remove} disabled={busy}>
      {busy ? "…" : "Delete trap"}
    </button>
  );
}
