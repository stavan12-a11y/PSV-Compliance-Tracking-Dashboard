import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json } from '@psv/server/http';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  return json(res, 200, { ok: true, route: 'ping' });
}
