import { useSyncExternalStore } from 'react';

export type UserRole = 'admin' | 'sales_manager' | 'sales_rep' | 'technician' | 'inventory_manager';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  lastLogin: string;
}

const STORAGE_KEY = 'fixhub_auth_user';

export const mockUsers: (AuthUser & { password: string })[] = [
  { id: 'U001', name: 'Kwame Asante',   email: 'admin@fixhub.com',  password: 'admin123', role: 'admin',             avatar: 'KA', lastLogin: 'Apr 23, 2026' },
  { id: 'U002', name: 'Kofi Mensah',    email: 'kofi@fixhub.com',   password: 'kofi123',  role: 'sales_manager',     avatar: 'KM', lastLogin: 'Apr 23, 2026' },
  { id: 'U003', name: 'Abena Frimpong', email: 'abena@fixhub.com',  password: 'abena123', role: 'sales_rep',         avatar: 'AF', lastLogin: 'Apr 22, 2026' },
  { id: 'U004', name: 'Ama Owusu',      email: 'ama@fixhub.com',    password: 'ama123',   role: 'technician',        avatar: 'AO', lastLogin: 'Apr 22, 2026' },
  { id: 'U005', name: 'Yaw Darko',      email: 'yaw@fixhub.com',    password: 'yaw123',   role: 'inventory_manager', avatar: 'YD', lastLogin: 'Apr 21, 2026' },
];

interface AuthState { user: AuthUser | null; initializing: boolean }
type AuthResult = { success: boolean; error?: string };

const listeners = new Set<() => void>();
let authState: AuthState = { user: readStoredUser(), initializing: false };

function readStoredUser(): AuthUser | null {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'); } catch { return null; }
}
function writeStoredUser(user: AuthUser | null) {
  try {
    user ? localStorage.setItem(STORAGE_KEY, JSON.stringify(user)) : localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}
function setAuthState(next: Partial<AuthState>) {
  authState = { ...authState, ...next };
  listeners.forEach(l => l());
}
function subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); }
function getSnapshot() { return authState; }

export function useAuth() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    const found = mockUsers.find(u => u.email === email && u.password === password);
    if (!found) return { success: false, error: 'Invalid email or password' };
    const { password: _pw, ...user } = found;
    writeStoredUser(user);
    setAuthState({ user });
    return { success: true };
  };

  const logout = () => {
    writeStoredUser(null);
    setAuthState({ user: null });
  };

  const resetPassword = async (email: string): Promise<AuthResult> => {
    const exists = mockUsers.some(u => u.email === email);
    return exists ? { success: true } : { success: false, error: 'No account found for that email address' };
  };

  return {
    user: state.user,
    login,
    logout,
    resetPassword,
    isAdmin: state.user?.role === 'admin',
    isAuthenticated: !!state.user,
    isLoading: state.initializing,
    isSupabaseAuth: false,
  };
}
