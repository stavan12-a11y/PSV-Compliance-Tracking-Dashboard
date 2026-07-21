import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isAuthorized } from '../_lib/auth.js';
import { json } from '../_lib/http.js';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  return json(res, 200, { ok: true, route: 'ping' });
}
