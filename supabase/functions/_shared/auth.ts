// Shared caller-auth check for Edge Functions, mirroring the pattern already
// used by the live wireless-admin Node service (supabase/wireless-admin on
// the VPS) — verify the bearer token against GoTrue, then look up the
// matching wireless.profiles row via the service role key to confirm the
// account is active (and, for requireAdmin, actually an admin).
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

async function getCallerProfile(authHeader: string | null): Promise<{ id: string; role: string; status: string } | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: ANON_KEY },
  });
  if (!userRes.ok) return null;
  const user = await userRes.json();

  const profRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=id,role,status`, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Accept-Profile': 'wireless',
    },
  });
  if (!profRes.ok) return null;
  const rows = await profRes.json();
  return rows[0] ?? null;
}

/** Any active staff account, regardless of role. */
export async function requireActiveUser(authHeader: string | null) {
  const profile = await getCallerProfile(authHeader);
  if (!profile || profile.status !== 'active') return null;
  return profile;
}

/** Active staff account with the admin role specifically. */
export async function requireAdmin(authHeader: string | null) {
  const profile = await getCallerProfile(authHeader);
  if (!profile || profile.status !== 'active' || profile.role !== 'admin') return null;
  return profile;
}
