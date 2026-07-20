import { isSupabaseConfigured, supabase, db } from '@/services/supabase';

const API = 'https://api.wirelesscares.com/wireless-admin/v1';

async function getToken(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export interface WirelessProfile {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: string;
  avatar: string;
  last_login: string | null;
}

export async function getWirelessUsers(): Promise<WirelessProfile[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await db
    .from('profiles')
    .select('id, name, email, username, role, avatar, last_login')
    .order('name');
  if (error) throw error;
  return (data ?? []) as WirelessProfile[];
}

export async function createWirelessUser(payload: {
  name: string;
  email: string;
  username?: string;
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

// Admins can update any profile's name/role/username directly — RLS
// (profiles_update) already allows this for the admin role, no service-role
// backend call needed. A duplicate username surfaces as a Postgres unique-
// violation (23505), which callers should catch and show as "already taken".
export async function updateWirelessUser(userId: string, patch: { name?: string; role?: string; username?: string | null }): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Not connected to Supabase');
  const { error } = await db.from('profiles').update(patch).eq('id', userId);
  if (error) {
    if (error.code === '23505') throw new Error('That username is already taken');
    throw error;
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

// Admin-only: set another user's password directly (they aren't asked for
// their old one — this goes through the service-role backend, same gate as
// create/delete-user, not the self-service changePassword below).
export async function resetUserPassword(userId: string, password: string): Promise<void> {
  const token = await getToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ userId, password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Failed to reset password');
}

export async function changePassword(newPassword: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Not connected to Supabase');
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export interface MyProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  bio: string;
  birthday: string | null;
  created_at: string;
}

export async function getMyProfile(): Promise<MyProfile | null> {
  if (!isSupabaseConfigured) return null;
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user?.id;
  if (!userId) return null;
  const { data, error } = await db
    .from('profiles')
    .select('id, name, email, phone, bio, birthday, created_at')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data as MyProfile;
}

export async function updateMyProfile(patch: Partial<Pick<MyProfile, 'name' | 'phone' | 'bio' | 'birthday'>>): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Not connected to Supabase');
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user?.id;
  if (!userId) throw new Error('Not authenticated');
  const { error } = await db.from('profiles').update(patch).eq('id', userId);
  if (error) throw error;
}

export interface UpcomingBirthdayRow {
  id: string;
  name: string;
  avatar: string;
  role: string;
  birthday: string;
}

export async function getUpcomingBirthdays(): Promise<UpcomingBirthdayRow[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await db.rpc('get_upcoming_birthdays');
  if (error) throw error;
  return ((data as UpcomingBirthdayRow[] | null) ?? []).filter(r => r.birthday);
}
