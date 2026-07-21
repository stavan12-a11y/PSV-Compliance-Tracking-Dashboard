import { createHmac, timingSafeEqual } from 'crypto';
import type { VercelRequest } from '@vercel/node';

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function base64url(input: string): string {
  return Buffer.from(input).toString('base64url');
}

function fromBase64url(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('AUTH_SECRET is not configured (needs at least 16 characters).');
  }
  return secret;
}

export function getTeamCredentials(): { username: string; password: string } {
  const username = process.env.TEAM_USERNAME ?? process.env.VITE_APP_USERNAME ?? 'admin';
  const password = process.env.TEAM_PASSWORD ?? process.env.VITE_APP_PASSWORD;
  if (!password) {
    throw new Error('TEAM_PASSWORD is not configured on the server.');
  }
  return { username, password };
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function verifyTeamLogin(identifier: string, password: string): boolean {
  const { username, password: expected } = getTeamCredentials();
  return safeEqual(identifier.trim(), username) && safeEqual(password, expected);
}

export function createSessionToken(): string {
  const payload = { v: 1, exp: Date.now() + TOKEN_TTL_MS };
  const body = base64url(JSON.stringify(payload));
  const sig = createHmac('sha256', getAuthSecret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const [body, sig] = token.split('.');
    if (!body || !sig) return false;
    const expected = createHmac('sha256', getAuthSecret()).update(body).digest('base64url');
    if (sig.length !== expected.length) return false;
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
    const payload = JSON.parse(fromBase64url(body)) as { exp?: number };
    return typeof payload.exp === 'number' && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export function bearerToken(req: VercelRequest): string | undefined {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return undefined;
  return header.slice('Bearer '.length).trim();
}

export function isAuthorized(req: VercelRequest): boolean {
  try {
    return verifySessionToken(bearerToken(req));
  } catch {
    return false;
  }
}
