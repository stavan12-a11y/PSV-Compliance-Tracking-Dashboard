"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RunningToggle({
  id,
  isRunning,
  name,
}: {
  id: string;
  isRunning: boolean;
  name: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    await fetch(`/api/equipment/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_running: !isRunning }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      className={isRunning ? "danger sm" : "primary sm"}
      onClick={toggle}
      disabled={busy}
      title={`Toggle running state for ${name}`}
    >
      {busy ? "…" : isRunning ? "Stop equipment" : "Start equipment"}
    </button>
  );
}
