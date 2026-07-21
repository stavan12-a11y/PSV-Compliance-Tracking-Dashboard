import type { VercelRequest, VercelResponse } from '@vercel/node';
import { bearerToken, verifySessionToken } from '@psv/server/auth';
import { json } from '@psv/server/http';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { error: 'Method not allowed' });
  }

  const ok = verifySessionToken(bearerToken(req));
  return json(res, ok ? 200 : 401, { ok });
}
