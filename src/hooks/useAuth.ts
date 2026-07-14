import { useState, useEffect } from 'react';
import { isSupabaseConfigured, supabase } from '@/services/supabase';

export type UserRole = 'admin' | 'sales_manager' | 'technician' | 'inventory_manager' | 'receptionist';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  lastLogin: string;
  _isMock?: boolean;
}

type AuthResult = { success: boolean; error?: string };

// ── Mock users (used when Supabase is not configured) ────────
export const mockUsers: (AuthUser & { password: string })[] = [
  { id: 'U001', name: 'Kwame Asante',   email: 'admin@wireless.com',  password: 'admin123', role: 'admin',             avatar: 'KA', lastLogin: '' },
  { id: 'U002', name: 'Kofi Mensah',    email: 'kofi@wireless.com',   password: 'kofi123',  role: 'sales_manager',     avatar: 'KM', lastLogin: '' },
  { id: 'U004', name: 'Ama Owusu',      email: 'ama@wireless.com',    password: 'ama123',   role: 'technician',        avatar: 'AO', lastLogin: '' },
  { id: 'U005', name: 'Yaw Darko',      email: 'yaw@wireless.com',    password: 'yaw123',   role: 'inventory_manager', avatar: 'YD', lastLogin: '' },
  { id: 'U006', name: 'Efua Boateng',   email: 'efua@wireless.com',   password: 'efua123',  role: 'receptionist',      avatar: 'EB', lastLogin: '' },
];

const STORAGE_KEY = 'wireless_auth_user';

function readStoredUser(): AuthUser | null {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'); } catch { return null; }
}
function writeStoredUser(user: AuthUser | null) {
  try { user ? localStorage.setItem(STORAGE_KEY, JSON.stringify(user)) : localStorage.removeItem(STORAGE_KEY); }
  catch { /* ignore */ }
}

// ── Shared state ─────────────────────────────────────────────
interface State { user: AuthUser | null; loading: boolean }
type Listener = () => void;
const listeners = new Set<Listener>();
let state: State = { user: readStoredUser(), loading: false };

function setState(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach(l => l());
}

// ── Supabase session bootstrap ───────────────────────────────
if (isSupabaseConfigured) {
  // Restore session on load
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      loadProfileFromSession(session.user.id, session.user.email ?? '').then(user => {
        if (user) { writeStoredUser(user); setState({ user, loading: false }); }
        else { setState({ loading: false }); }
      });
    } else {
      setState({ loading: false });
    }
  });

  // Listen for auth state changes
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      loadProfileFromSession(session.user.id, session.user.email ?? '').then(user => {
        if (user) { writeStoredUser(user); setState({ user }); }
      });
    } else {
      // Don't clear mock-fallback users — they have no Supabase session
      if (!state.user?._isMock) {
        writeStoredUser(null);
        setState({ user: null });
      }
    }
  });
}

async function loadProfileFromSession(userId: string, email: string): Promise<AuthUser | null> {
  // If this email matches a known demo account, use its defined role/name
  const demo = mockUsers.find(u => u.email === email);

  try {
    const { data } = await supabase
      .schema('wireless')
      .from('profiles')
      .select('id, name, role, avatar, last_login')
      .eq('id', userId)
      .single();

    const name   = demo?.name   ?? (data?.name   ?? email.split('@')[0]);
    const role   = demo?.role   ?? (data?.role   as UserRole ?? 'receptionist');
    const avatar = demo?.avatar ?? (data?.avatar ?? name[0].toUpperCase());

    if (!data) {
      // Profile doesn't exist — create it with correct role
      await supabase.schema('wireless').from('profiles').upsert({
        id: userId, email, name, role, avatar, last_login: new Date().toISOString(),
      });
      return { id: userId, email, name, role, avatar, lastLogin: '' };
    }

    // Update last_login and correct role/name if this is a demo account
    const updates: Record<string, string> = { last_login: new Date().toISOString() };
    if (demo) {
      if (data.role !== demo.role)   updates.role   = demo.role;
      if (data.name !== demo.name)   updates.name   = demo.name;
      if (data.avatar !== demo.avatar) updates.avatar = demo.avatar;
    }
    await supabase.schema('wireless').from('profiles').update(updates).eq('id', userId);

    return { id: userId, email, name, role, avatar, lastLogin: data.last_login ?? '' };
  } catch (e) {
    console.warn('[useAuth] failed to load profile', e);
    return null;
  }
}

// ── Hook ─────────────────────────────────────────────────────
export function useAuth() {
  const [snap, setSnap] = useState(state);

  useEffect(() => {
    const handler = () => setSnap({ ...state });
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    setState({ loading: true });

    const demoMatch = mockUsers.find(u => u.email === email && u.password === password);

    // Admin tries Supabase first (needs real session for RLS), others skip straight to mock
    if (isSupabaseConfigured && demoMatch?.role === 'admin') {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data.session) {
          // Load profile; fall back to demo data if DB query fails
          const profile = await loadProfileFromSession(data.session.user.id, data.session.user.email ?? '');
          const { password: _pw, ...fallback } = demoMatch;
          const user = profile ?? { ...fallback, id: data.session.user.id };
          writeStoredUser(user);
          setState({ user, loading: false });
          return { success: true };
        }
        // Supabase auth failed — fall through to mock below
      } catch { /* fall through to mock */ }
    }

    // Non-demo users with Supabase configured must go through Supabase only
    if (isSupabaseConfigured && !demoMatch) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data.session) {
          const user = await loadProfileFromSession(data.session.user.id, data.session.user.email ?? '');
          if (user) { writeStoredUser(user); setState({ user, loading: false }); return { success: true }; }
        }
        setState({ loading: false });
        return { success: false, error: 'Invalid email or password' };
      } catch {
        setState({ loading: false });
        return { success: false, error: 'Connection error — please try again' };
      }
    }

    // Mock auth — all demo accounts reach here (non-admin always, admin if Supabase failed)
    if (!demoMatch) { setState({ loading: false }); return { success: false, error: 'Invalid email or password' }; }
    const { password: _pw, ...userFields } = demoMatch;
    const user: AuthUser = { ...userFields, _isMock: true };
    writeStoredUser(user);
    setState({ user, loading: false });
    return { success: true };
  };

  const logout = async () => {
    if (isSupabaseConfigured && !snap.user?._isMock) await supabase.auth.signOut();
    writeStoredUser(null);
    setState({ user: null });
  };

  const resetPassword = async (email: string): Promise<AuthResult> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return error ? { success: false, error: error.message } : { success: true };
    }
    const exists = mockUsers.some(u => u.email === email);
    return exists ? { success: true } : { success: false, error: 'No account found' };
  };

  return {
    user: snap.user,
    login,
    logout,
    resetPassword,
    isAdmin: snap.user?.role === 'admin',
    isAuthenticated: !!snap.user,
    isLoading: snap.loading,
    isSupabaseAuth: isSupabaseConfigured,
  };
}
