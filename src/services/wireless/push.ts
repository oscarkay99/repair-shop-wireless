import { isSupabaseConfigured, supabase } from '@/services/supabase';

const API = 'https://api.wirelesscares.com/wireless-admin/v1';

async function getToken(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function getVapidPublicKey(): Promise<string | null> {
  const res = await fetch(`${API}/vapid-public-key`, { method: 'POST' });
  if (!res.ok) return null;
  const json = await res.json();
  return json.publicKey ?? null;
}

export async function savePushSubscription(sub: PushSubscription): Promise<void> {
  const token = await getToken();
  if (!token) throw new Error('Not authenticated');

  const json = sub.toJSON();
  const res = await fetch(`${API}/push-subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: json.keys,
      userAgent: navigator.userAgent,
    }),
  });
  if (!res.ok) throw new Error('Failed to save push subscription');
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  const token = await getToken();
  if (!token) return;
  await fetch(`${API}/push-unsubscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ endpoint }),
  }).catch(() => {});
}
