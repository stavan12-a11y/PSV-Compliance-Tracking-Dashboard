"use client";

import { useEffect } from "react";

export function Toast({
  message,
  error,
  onDone,
}: {
  message: string;
  error?: boolean;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [message, onDone]);

  return <div className={`toast ${error ? "error" : ""}`}>{message}</div>;
}
