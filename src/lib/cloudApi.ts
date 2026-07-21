import type { AppData } from '../types';

const TOKEN_KEY = 'psv-cloud-token-v1';

/**
 * Cloud mode via Vercel API + Neon (recommended).
 * Set VITE_CLOUD_MODE=true on Vercel after DATABASE_URL and TEAM_PASSWORD are configured.
 */
export const isCloudApiMode = import.meta.env.VITE_CLOUD_MODE === 'true';

export function getStoredToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getStoredToken();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(path, { ...init, headers });
  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { error: text };
    }
  }
  return { res, body: body as Record<string, unknown> };
}

export async function cloudLogin(
  identifier: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  const { res, body } = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });
  if (!res.ok) {
    return { ok: false, error: String(body.error ?? 'Sign in failed.') };
  }
  const token = body.token as string | undefined;
  if (!token) return { ok: false, error: 'No session token returned.' };
  setStoredToken(token);
  return { ok: true };
}

export async function cloudLogout() {
  setStoredToken(null);
}

export async function cloudCheckSession(): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;
  const { res } = await apiFetch('/api/auth/session');
  if (!res.ok) {
    setStoredToken(null);
    return false;
  }
  return true;
}

export async function cloudLoadState(): Promise<{
  data: AppData | null;
  updatedAt: string | null;
  error?: string;
}> {
  const { res, body } = await apiFetch('/api/state');
  if (!res.ok) {
    return { data: null, updatedAt: null, error: String(body.error ?? 'Failed to load data') };
  }
  return {
    data: (body.data as AppData | null) ?? null,
    updatedAt: (body.updatedAt as string | null) ?? null,
  };
}

export async function cloudSaveState(data: AppData): Promise<{ ok: boolean; error?: string }> {
  const { res, body } = await apiFetch('/api/state', {
    method: 'PUT',
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    return { ok: false, error: String(body.error ?? 'Failed to save data') };
  }
  return { ok: true };
}

/** How often to check the server for updates from other users (milliseconds). */
export const CLOUD_POLL_MS = 20_000;
