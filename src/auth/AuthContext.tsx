import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

// ---------------------------------------------------------------------------
// A single shared username/password gate. Credentials come from build-time env
// vars (VITE_APP_USERNAME / VITE_APP_PASSWORD) with sensible defaults so the app
// still works before they are configured.
//
// NOTE: This is a lightweight access gate for an internal tool — it keeps casual
// / outside visitors out. Because this is a frontend-only app, the credentials
// live in the built JavaScript and it is NOT a substitute for real server-side
// authentication. For stronger protection, put the site behind Cloudflare Access
// or a backend login.
// ---------------------------------------------------------------------------

const USERNAME = import.meta.env.VITE_APP_USERNAME ?? 'admin';
const PASSWORD = import.meta.env.VITE_APP_PASSWORD ?? 'tamu-psv-2026';

/** True when the deployer has not set their own password yet. */
export const USING_DEFAULT_CREDENTIALS = !import.meta.env.VITE_APP_PASSWORD;

const STORAGE_KEY = 'psv-auth-v1';

interface AuthContextValue {
  authed: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  const login = useCallback((username: string, password: string) => {
    const ok = username.trim() === USERNAME && password === PASSWORD;
    if (ok) {
      try {
        localStorage.setItem(STORAGE_KEY, '1');
      } catch {
        // storage unavailable; session-only login still works
      }
      setAuthed(true);
    }
    return ok;
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setAuthed(false);
  }, []);

  const value = useMemo(() => ({ authed, login, logout }), [authed, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
