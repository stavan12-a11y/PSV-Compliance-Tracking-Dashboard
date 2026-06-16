import fs from "node:fs";
import path from "node:path";
import type { Database } from "./types";
import { buildSeedDatabase } from "./seed";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DATA_DIR, "db.json");

/**
 * Cache the in-memory DB on globalThis so it survives Next.js hot-reloads and
 * is shared across route handlers within a single server process.
 */
const globalForDb = globalThis as unknown as { __steamTrapDb?: Database };

function ensureLoaded(): Database {
  if (globalForDb.__steamTrapDb) return globalForDb.__steamTrapDb;

  let db: Database;
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, "utf8");
      db = JSON.parse(raw) as Database;
    } else {
      db = buildSeedDatabase();
      persist(db);
    }
  } catch {
    // Corrupt or unreadable store — fall back to a fresh seed.
    db = buildSeedDatabase();
    persist(db);
  }

  globalForDb.__steamTrapDb = db;
  return db;
}

function persist(db: Database): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

/** Returns the live database object. Mutations must be followed by save(). */
export function getDb(): Database {
  return ensureLoaded();
}

/** Persists the current in-memory database to disk. */
export function save(): void {
  if (globalForDb.__steamTrapDb) persist(globalForDb.__steamTrapDb);
}

/** Wipes and re-seeds the database with fresh demo data. */
export function resetDb(): Database {
  const db = buildSeedDatabase();
  globalForDb.__steamTrapDb = db;
  persist(db);
  return db;
}

/** Simple unique id generator. */
export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
