import { createClient } from 'npm:@supabase/supabase-js@2';

const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_ORIGIN') ?? 'https://operations.wirelesscares.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  SERVICE_ROLE_KEY,
);

async function publishToInstagram(caption: string, integration: any): Promise<string> {
  // Step 1: Create media container (image post or caption-only)
  const containerRes = await fetch(
    `https://graph.facebook.com/v19.0/${integration.ig_user_id}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${integration.access_token}` },
      body: JSON.stringify({ caption, media_type: 'IMAGE', image_url: '' }),
    },
  );
  if (!containerRes.ok) throw new Error(`IG container failed: ${await containerRes.text()}`);
  const { id: containerId } = await containerRes.json();

  // Step 2: Publish
  const publishRes = await fetch(
    `https://graph.facebook.com/v19.0/${integration.ig_user_id}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${integration.access_token}` },
      body: JSON.stringify({ creation_id: containerId }),
    },
  );
  if (!publishRes.ok) throw new Error(`IG publish failed: ${await publishRes.text()}`);
  const { id } = await publishRes.json();
  return id;
}

async function sendWhatsAppBroadcast(message: string, integration: any): Promise<string> {
  // WhatsApp broadcasts require approved templates; this sends a text message to the business number
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${integration.phone_number_id}/messages`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${integration.access_token}` },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: integration.phone_number_id,
        type: 'text',
        text: { body: message },
      }),
    },
  );
  if (!res.ok) throw new Error(`WA broadcast failed: ${await res.text()}`);
  const { messages } = await res.json();
  return messages?.[0]?.id ?? 'sent';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Meant to be triggered by a scheduled job holding the service role key —
  // it publishes live to the shop's connected social accounts.
  if (req.headers.get('authorization') !== `Bearer ${SERVICE_ROLE_KEY}`) {
    return new Response(JSON.stringify({ error: 'Not authorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { post_id } = await req.json();

    const { data: post, error: postErr } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('id', post_id)
      .single();

    if (postErr || !post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const platformPostIds: Record<string, string> = {};
    const errors: string[] = [];

    for (const channel of post.channels ?? []) {
      const { data: integration } = await supabase
        .from('channel_integrations')
        .select('*')
        .eq('channel', channel)
        .eq('status', 'connected')
        .single();

      if (!integration) {
        errors.push(`${channel}: not connected`);
        continue;
      }

      try {
        if (channel === 'instagram') {
          platformPostIds.instagram = await publishToInstagram(post.content, integration);
        } else if (channel === 'whatsapp') {
          platformPostIds.whatsapp = await sendWhatsAppBroadcast(post.content, integration);
        }
        // TikTok video publishing requires media upload via their separate upload API
        // Mark as queued for manual review
        else if (channel === 'tiktok') {
          platformPostIds.tiktok = 'queued_for_upload';
        }
      } catch (channelErr) {
        errors.push(`${channel}: ${String(channelErr)}`);
      }
    }

    const allFailed = errors.length === post.channels.length;

    await supabase.from('scheduled_posts').update({
      status: allFailed ? 'failed' : 'published',
      published_at: new Date().toISOString(),
      platform_post_ids: platformPostIds,
    }).eq('id', post_id);

    return new Response(JSON.stringify({ success: !allFailed, platformPostIds, errors }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('publish-post error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
