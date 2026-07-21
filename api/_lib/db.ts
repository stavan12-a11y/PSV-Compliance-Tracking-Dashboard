import { neon } from '@neondatabase/serverless';

export const STATE_ROW_ID = 'singleton';

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not configured.');
  }
  return neon(url);
}

export async function ensureSchema() {
  const sql = getSql();
  await sql`
    create table if not exists app_state (
      id text primary key,
      data jsonb not null default '{}'::jsonb,
      updated_at timestamptz not null default now()
    )
  `;
}
