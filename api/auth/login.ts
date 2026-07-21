import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createSessionToken, verifyTeamLogin } from '../../server/auth';
import { json } from '../../server/http';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const identifier = String(body?.identifier ?? '');
    const password = String(body?.password ?? '');

    if (!verifyTeamLogin(identifier, password)) {
      return json(res, 401, { error: 'Incorrect username or password.' });
    }

    const token = createSessionToken();
    return json(res, 200, { ok: true, token });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Login failed';
    return json(res, 500, { error: message });
  }
}
