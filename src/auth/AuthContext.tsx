import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  cloudCheckSession,
  cloudLogin,
  cloudLogout,
  isCloudApiMode,
} from '../lib/cloudApi';
import { isCloudMode } from '../lib/cloudMode';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

// ---------------------------------------------------------------------------
// Login modes:
// • Cloud API (recommended): VITE_CLOUD_MODE=true → Vercel API + Neon database
// • Supabase (legacy): VITE_SUPABASE_* env vars
// • Local: per-browser localStorage + static password
// ---------------------------------------------------------------------------

const LOCAL_USERNAME = import.meta.env.VITE_APP_USERNAME ?? 'admin';
const LOCAL_PASSWORD = import.meta.env.VITE_APP_PASSWORD ?? 'tamu-psv-2026';

export const USING_DEFAULT_CREDENTIALS =
  !isCloudMode && !import.meta.env.VITE_APP_PASSWORD;

export const AUTH_MODE: 'cloud' | 'local' = isCloudMode ? 'cloud' : 'local';

const LOCAL_STORAGE_KEY = 'psv-auth-v1';

interface AuthContextValue {
  authed: boolean;
  ready: boolean;
  mode: 'cloud' | 'local';
  /** Which cloud backend is active (api vs legacy supabase). */
  cloudBackend: 'api' | 'supabase' | null;
  login: (identifier: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState<boolean>(() => {
    if (isCloudMode) return false;
    try {
      return localStorage.getItem(LOCAL_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [ready, setReady] = useState<boolean>(!isCloudMode);

  const cloudBackend = isCloudApiMode ? 'api' : isSupabaseConfigured ? 'supabase' : null;

  // Cloud API: restore session token
  useEffect(() => {
    if (!isCloudApiMode) return;
    let active = true;
    cloudCheckSession().then((ok) => {
      if (!active) return;
      setAuthed(ok);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  // Legacy Supabase session
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setAuthed(Boolean(data.session));
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(Boolean(session));
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    if (isCloudApiMode) {
      const res = await cloudLogin(identifier, password);
      if (res.ok) setAuthed(true);
      return res;
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithPassword({
        email: identifier.trim(),
        password,
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    }

    const ok = identifier.trim() === LOCAL_USERNAME && password === LOCAL_PASSWORD;
    if (ok) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, '1');
      } catch {
        // ignore
      }
      setAuthed(true);
      return { ok: true };
    }
    return { ok: false, error: 'Incorrect username or password.' };
  }, []);

  const logout = useCallback(async () => {
    if (isCloudApiMode) {
      await cloudLogout();
      setAuthed(false);
      return;
    }
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
      setAuthed(false);
      return;
    }
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
      // ignore
    }
    setAuthed(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ authed, ready, mode: AUTH_MODE, cloudBackend, login, logout }),
    [authed, ready, cloudBackend, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
