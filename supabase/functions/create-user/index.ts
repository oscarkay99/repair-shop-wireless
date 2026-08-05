import { createClient } from 'npm:@supabase/supabase-js@2';
import { requireAdmin } from '../_shared/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_ORIGIN') ?? 'https://operations.wirelesscares.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Creating a user is an admin-only action — this function holds the
  // service-role key, so without this check anyone who could reach it could
  // mint an arbitrary account (including another admin) with no
  // authorization at all.
  const caller = await requireAdmin(req.headers.get('authorization'));
  if (!caller) {
    return new Response(JSON.stringify({ error: 'Not authorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { name, email, password, role, phone } = await req.json();

    if (!name || !email || !password || !role) {
      return new Response(JSON.stringify({ error: 'name, email, password and role are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name: name, role },
      email_confirm: true,
    });

    if (error) throw error;

    // Patch phone + avatar onto the auto-created profile
    await supabaseAdmin.from('profiles').update({
      phone: phone ?? '',
      avatar: name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
    }).eq('id', data.user.id);

    return new Response(JSON.stringify({ id: data.user.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('create-user error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
