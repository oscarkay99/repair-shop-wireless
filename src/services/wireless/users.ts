import { isSupabaseConfigured, supabase, db } from '@/services/supabase';

const API = 'https://rogernortconsult.com/api/wireless';

async function getToken(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export interface WirelessProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  last_login: string | null;
}

export async function getWirelessUsers(): Promise<WirelessProfile[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await db
    .from('profiles')
    .select('id, name, email, role, avatar, last_login')
    .order('name');
  if (error) throw error;
  return (data ?? []) as WirelessProfile[];
}

export async function createWirelessUser(payload: {
  name: string;
  email: string;
  role: string;
  password: string;
}): Promise<void> {
  const token = await getToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API}/create-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Failed to create user');

  // Sync profile row (trigger should do it, but patch name/role to be safe)
  const userId = json.user?.id;
  if (userId) {
    await db.from('profiles').update({ name: payload.name, role: payload.role }).eq('id', userId);
  }
}

export async function deleteWirelessUser(userId: string): Promise<void> {
  const token = await getToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API}/delete-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ userId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Failed to delete user');
}

export async function changePassword(newPassword: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Not connected to Supabase');
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
