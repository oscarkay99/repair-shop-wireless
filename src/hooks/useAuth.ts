import { useState, useEffect } from 'react';
import { isSupabaseConfigured, supabase } from '@/services/supabase';
import { logAuthEvent } from '@/services/wireless/auditLogs';

export type UserRole = 'admin' | 'sales_manager' | 'technician' | 'receptionist';

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
  { id: 'U005', name: 'Yaw Darko',      email: 'yaw@wireless.com',    password: 'yaw123',   role: 'sales_manager',     avatar: 'YD', lastLogin: '' },
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
interface State { user: AuthUser | null; loading: boolean; deniedMessage: string | null }
type Listener = () => void;
const listeners = new Set<Listener>();
let state: State = { user: readStoredUser(), loading: false, deniedMessage: null };

function setState(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach(l => l());
}

// Reactive, not a one-shot sessionStorage flag — the rejection happens
// asynchronously (after the profile check resolves), well after any
// mount-time effect on the sign-in page would have already looked and found
// nothing. Consumers of useAuth() see this update live instead.
async function handleUnrecognizedSession() {
  await supabase.auth.signOut();
  writeStoredUser(null);
  setState({ user: null, loading: false, deniedMessage: "This account isn't registered as a Wireless user. Contact your administrator." });
}

// ── Supabase session bootstrap ───────────────────────────────
if (isSupabaseConfigured) {
  // Restore session on load
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      loadProfileFromSession(session.user.id, session.user.email ?? '').then(user => {
        if (user) { writeStoredUser(user); setState({ user, loading: false }); }
        else { handleUnrecognizedSession(); }
      });
    } else {
      setState({ loading: false });
    }
  });

  // Listen for auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    // Captured before the async profile lookup resolves (and before setState
    // below updates it) — SIGNED_IN isn't only fired for a genuine new
    // sign-in, it can also refire when another open tab's session syncs in,
    // or on a silent token refresh. Only a real transition from signed-out
    // to signed-in in THIS tab counts as a login worth logging.
    const wasSignedOut = !state.user;
    if (session?.user) {
      loadProfileFromSession(session.user.id, session.user.email ?? '').then(user => {
        if (user) {
          writeStoredUser(user);
          setState({ user });
          if (event === 'SIGNED_IN' && wasSignedOut) logAuthEvent('login', { id: user.id, name: user.name });
        }
        else { handleUnrecognizedSession(); }
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

// Accepts either an email or a username. GoTrue only ever authenticates by
// email, so a bare username is resolved to its email first via a rate-limited
// RPC (anon-callable, since this runs before the user has a session) — the
// real password check still happens in GoTrue afterward either way.
async function resolveIdentifierToEmail(identifier: string): Promise<string> {
  if (identifier.includes('@')) return identifier;
  try {
    const { data, error } = await supabase.schema('wireless').rpc('resolve_login_email', { p_identifier: identifier });
    if (error || !data) return identifier;
    return data as string;
  } catch {
    return identifier;
  }
}

async function loadProfileFromSession(userId: string, email: string): Promise<AuthUser | null> {
  // Demo account defaults are only ever used to provision a brand-new profile
  // (first login, no row yet) — never to overwrite a real, already-existing
  // profile. Several demo emails (admin@, kofi@, ama@wireless.com) now belong
  // to real accounts, and force-syncing them back to hardcoded values on every
  // login would silently undo any real edit made via Settings.
  const demo = mockUsers.find(u => u.email === email);

  try {
    const { data } = await supabase
      .schema('wireless')
      .from('profiles')
      .select('id, name, role, avatar, last_login, status')
      .eq('id', userId)
      .single();

    if (data) {
      // A profile row existing is not enough — the on_auth_user_created
      // trigger creates one for *any* new auth signup (password or OAuth),
      // defaulting it to 'pending'. Only 'active' profiles (provisioned
      // through the admin invite flow) may actually sign in.
      if (data.status !== 'active') return null;
      await supabase.schema('wireless').from('profiles').update({ last_login: new Date().toISOString() }).eq('id', userId);
      return { id: userId, email, name: data.name, role: data.role as UserRole, avatar: data.avatar, lastLogin: data.last_login ?? '' };
    }

    // No profile row under this exact auth id — this happens the first time
    // someone signs in via a new method (e.g. Google) that Supabase treats as
    // a distinct identity. Only provision a profile if this email is already
    // known as staff (an existing ACTIVE profile row, under any id, or a
    // recognized demo account) — an unrecognized email must NOT silently get
    // a new receptionist-level account just by completing a Google consent
    // screen.
    const { data: byEmail } = await supabase
      .schema('wireless')
      .from('profiles')
      .select('name, role, avatar, status')
      .eq('email', email)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    if (!byEmail && !demo) return null;

    const name   = byEmail?.name   ?? demo!.name;
    const role   = (byEmail?.role  ?? demo!.role) as UserRole;
    const avatar = byEmail?.avatar ?? demo!.avatar;
    await supabase.schema('wireless').from('profiles').upsert({
      id: userId, email, name, role, avatar, status: 'active', last_login: new Date().toISOString(),
    });
    return { id: userId, email, name, role, avatar, lastLogin: '' };
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

  const login = async (identifier: string, password: string): Promise<AuthResult> => {
    setState({ loading: true });

    // Demo/mock accounts only ever have an email, never a username — a
    // username login simply won't match one, which is correct.
    const demoMatch = mockUsers.find(u => u.email === identifier && u.password === password);
    setState({ deniedMessage: null });

    // Admin tries Supabase first (needs real session for RLS), others skip straight to mock
    if (isSupabaseConfigured && demoMatch?.role === 'admin') {
      try {
        const email = await resolveIdentifierToEmail(identifier);
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
        const email = await resolveIdentifierToEmail(identifier);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data.session) {
          const user = await loadProfileFromSession(data.session.user.id, data.session.user.email ?? '');
          if (user) { writeStoredUser(user); setState({ user, loading: false }); return { success: true }; }
        }
        setState({ loading: false });
        return { success: false, error: 'Invalid email/username or password' };
      } catch {
        setState({ loading: false });
        return { success: false, error: 'Connection error — please try again' };
      }
    }

    // Mock auth — all demo accounts reach here (non-admin always, admin if Supabase failed)
    if (!demoMatch) { setState({ loading: false }); return { success: false, error: 'Invalid email/username or password' }; }
    const { password: _pw, ...userFields } = demoMatch;
    const user: AuthUser = { ...userFields, _isMock: true };
    writeStoredUser(user);
    setState({ user, loading: false });
    return { success: true };
  };

  const logout = async () => {
    if (isSupabaseConfigured && !snap.user?._isMock) {
      // Must log before signOut() — the RLS insert check needs auth.uid(),
      // which goes away the instant the session is torn down.
      if (snap.user) await logAuthEvent('logout', { id: snap.user.id, name: snap.user.name });
      await supabase.auth.signOut();
    }
    writeStoredUser(null);
    setState({ user: null });
  };

  const loginWithGoogle = async (): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return { success: false, error: 'Google sign-in requires a live Supabase connection.' };
    setState({ deniedMessage: null });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/signin',
        // Always show Google's account chooser rather than silently
        // re-using whatever Google account happens to already be signed in
        // on this browser — that's what leaves someone stuck unable to
        // switch to their actual Wireless-registered Google account.
        queryParams: { prompt: 'select_account' },
      },
    });
    return error ? { success: false, error: error.message } : { success: true };
  };

  const clearDeniedMessage = () => setState({ deniedMessage: null });

  return {
    user: snap.user,
    login,
    loginWithGoogle,
    logout,
    deniedMessage: snap.deniedMessage,
    clearDeniedMessage,
    isAdmin: snap.user?.role === 'admin',
    isAuthenticated: !!snap.user,
    isLoading: snap.loading,
    isSupabaseAuth: isSupabaseConfigured,
  };
}
