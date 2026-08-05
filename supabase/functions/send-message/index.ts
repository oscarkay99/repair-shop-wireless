import { createClient } from 'npm:@supabase/supabase-js@2';
import { requireActiveUser } from '../_shared/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_ORIGIN') ?? 'https://operations.wirelesscares.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

async function sendWhatsApp(to: string, message: string, integration: any) {
  const url = `https://graph.facebook.com/v19.0/${integration.phone_number_id}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${integration.access_token}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp send failed: ${err}`);
  }
  return res.json();
}

async function sendInstagram(to: string, message: string, integration: any) {
  const url = `https://graph.facebook.com/v19.0/me/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${integration.access_token}`,
    },
    body: JSON.stringify({
      recipient: { id: to },
      message: { text: message },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Instagram send failed: ${err}`);
  }
  return res.json();
}

async function sendTikTok(to: string, message: string, integration: any) {
  // TikTok Business Messaging API
  const url = `https://business-api.tiktok.com/open_api/v1.3/customer_service/conversation/message/send/`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Access-Token': integration.access_token,
    },
    body: JSON.stringify({
      advertiser_id: integration.tiktok_app_id,
      conversation_id: to,
      message: { message_type: 'TEXT', content: { text: message } },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TikTok send failed: ${err}`);
  }
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // This sends a real message to a real customer on the shop's behalf —
  // only a logged-in staff member should be able to trigger it.
  const caller = await requireActiveUser(req.headers.get('authorization'));
  if (!caller) {
    return new Response(JSON.stringify({ error: 'Not authorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { channel, to, message } = await req.json();

    const { data: integration, error } = await supabase
      .from('channel_integrations')
      .select('*')
      .eq('channel', channel)
      .eq('status', 'connected')
      .single();

    if (error || !integration) {
      return new Response(JSON.stringify({ error: `Channel ${channel} not connected` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let result;
    if (channel === 'whatsapp') result = await sendWhatsApp(to, message, integration);
    else if (channel === 'instagram') result = await sendInstagram(to, message, integration);
    else if (channel === 'tiktok') result = await sendTikTok(to, message, integration);
    else throw new Error(`Unknown channel: ${channel}`);

    // Update last_sync timestamp
    await supabase.from('channel_integrations').update({ last_sync: new Date().toISOString() }).eq('channel', channel);

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-message error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
