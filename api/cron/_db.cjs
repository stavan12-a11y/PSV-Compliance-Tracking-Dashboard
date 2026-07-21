const { neon, neonConfig } = require('@neondatabase/serverless');

neonConfig.fetchConnectionCache = true;

const STATE_ROW_ID = 'singleton';

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not configured.');
  return neon(url);
}

async function loadAppData() {
  const sql = getSql();
  const rows = await sql`
    select data, updated_at
    from app_state
    where id = ${STATE_ROW_ID}
    limit 1
  `;
  const row = rows[0];
  if (!row?.data) return { data: null, updatedAt: row?.updated_at ?? null };
  return { data: row.data, updatedAt: row.updated_at ?? null };
}

module.exports = { loadAppData };
