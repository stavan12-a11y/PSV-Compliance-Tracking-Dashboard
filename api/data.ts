import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isAuthorized } from '@psv/server/auth';
import { ensureSchema, getSql, STATE_ROW_ID } from '@psv/server/db';
import { json } from '@psv/server/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isAuthorized(req)) {
    return json(res, 401, { error: 'Unauthorized' });
  }

  try {
    await ensureSchema();
    const sql = getSql();

    if (req.method === 'GET') {
      const rows = await sql`
        select data, updated_at
        from app_state
        where id = ${STATE_ROW_ID}
        limit 1
      `;
      const row = rows[0] as { data?: unknown; updated_at?: string } | undefined;
      return json(res, 200, {
        data: row?.data ?? null,
        updatedAt: row?.updated_at ?? null,
      });
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const data = body?.data;
      if (!data || typeof data !== 'object') {
        return json(res, 400, { error: 'Missing data payload' });
      }

      const updatedAt = new Date().toISOString();
      await sql`
        insert into app_state (id, data, updated_at)
        values (${STATE_ROW_ID}, ${data}, ${updatedAt})
        on conflict (id) do update
        set data = excluded.data,
            updated_at = excluded.updated_at
      `;
      return json(res, 200, { ok: true, updatedAt });
    }

    res.setHeader('Allow', 'GET, PUT');
    return json(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Database error';
    console.error('api/data error:', message);
    return json(res, 500, { error: message });
  }
}
