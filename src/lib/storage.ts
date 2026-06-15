import type { Boiler } from "../types";
import { createDemoBoilers } from "./demo";

const STORAGE_KEY = "boiler-inspection-management:v2";

export function loadBoilers(): Boiler[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDemoBoilers();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return createDemoBoilers();
    return parsed as Boiler[];
  } catch {
    return createDemoBoilers();
  }
}

export function saveBoilers(boilers: Boiler[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(boilers));
  } catch {
    // Ignore quota / serialization errors — persistence is best-effort.
  }
}

export function clearStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
