import { useState, useEffect } from 'react';
import { isSupabaseConfigured, supabase } from '@/services/supabase';

export type UserRole = 'admin' | 'sales_manager' | 'sales_rep' | 'technician' | 'inventory_manager';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  lastLogin: string;
}

type AuthResult = { success: boolean; error?: string };

// ── Mock users (used when Supabase is not configured) ────────
export const mockUsers: (AuthUser & { password: string })[] = [
  { id: 'U001', name: 'Kwame Asante',   email: 'admin@wireless.com',  password: 'admin123', role: 'admin',             avatar: 'KA', lastLogin: '' },
  { id: 'U002', name: 'Kofi Mensah',    email: 'kofi@wireless.com',   password: 'kofi123',  role: 'sales_manager',     avatar: 'KM', lastLogin: '' },
  { id: 'U003', name: 'Abena Frimpong', email: 'abena@wireless.com',  password: 'abena123', role: 'sales_rep',         avatar: 'AF', lastLogin: '' },
  { id: 'U004', name: 'Ama Owusu',      email: 'ama@wireless.com',    password: 'ama123',   role: 'technician',        avatar: 'AO', lastLogin: '' },
  { id: 'U005', name: 'Yaw Darko',      email: 'yaw@wireless.com',    password: 'yaw123',   role: 'inventory_manager', avatar: 'YD', lastLogin: '' },
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
      writeStoredUser(null);
      setState({ user: null });
    }
  });
}

async function loadProfileFromSession(userId: string, email: string): Promise<AuthUser | null> {
  try {
    const { data } = await supabase
      .schema('wireless')
      .from('profiles')
      .select('id, name, role, avatar, last_login')
      .eq('id', userId)
      .single();

    if (!data) {
      // Profile doesn't exist yet — create it
      const name = email.split('@')[0];
      const avatar = name[0].toUpperCase();
      await supabase.schema('wireless').from('profiles').upsert({
        id: userId, email, name, role: 'sales_rep', avatar, last_login: new Date().toISOString(),
      });
      return { id: userId, email, name, role: 'sales_rep', avatar, lastLogin: '' };
    }

    // Update last_login
    await supabase.schema('wireless').from('profiles').update({ last_login: new Date().toISOString() }).eq('id', userId);

    return {
      id: data.id,
      name: data.name,
      email,
      role: data.role as UserRole,
      avatar: data.avatar,
      lastLogin: data.last_login ?? '',
    };
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

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.session) {
        setState({ loading: false });
        return { success: false, error: error?.message ?? 'Login failed' };
      }
      // onAuthStateChange will set the user
      setState({ loading: false });
      return { success: true };
    }

    // Mock fallback
    const found = mockUsers.find(u => u.email === email && u.password === password);
    if (!found) { setState({ loading: false }); return { success: false, error: 'Invalid email or password' }; }
    const { password: _pw, ...user } = found;
    writeStoredUser(user);
    setState({ user, loading: false });
    return { success: true };
  };

  const logout = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
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
