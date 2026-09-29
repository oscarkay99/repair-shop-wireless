import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  '';

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

// Row-level security never errors on an UPDATE/DELETE it filters out — it just
// matches zero rows, and the client reports success. That is how "Mark
// Collected" looked saved for reception and then reverted on refresh. Ask
// PostgREST for the affected-row count on every PATCH/DELETE and turn a zero
// into a real error, so a blocked write can never look like it worked.
const NOT_PERMITTED_MESSAGE = "That change wasn't saved: you may not have permission, or the record no longer exists.";

const strictWriteFetch: typeof fetch = async (input, init) => {
  const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if ((method !== 'PATCH' && method !== 'DELETE') || !url.includes('/rest/v1/')) {
    return fetch(input, init);
  }
  const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
  const prefer = headers.get('Prefer');
  if (!prefer?.includes('count=')) headers.set('Prefer', prefer ? `${prefer},count=exact` : 'count=exact');
  const response = await fetch(input, { ...init, headers });
  const total = response.headers.get('Content-Range')?.split('/')[1];
  if (response.ok && total === '0') {
    return new Response(
      JSON.stringify({ code: '42501', message: NOT_PERMITTED_MESSAGE, details: null, hint: null }),
      { status: 403, statusText: 'Forbidden', headers: { 'Content-Type': 'application/json' } },
    );
  }
  return response;
};

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    global: { fetch: strictWriteFetch },
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  },
);

// Scoped client for the wireless schema — use this for all WIRELESS data
export const db = supabase.schema('wireless');
