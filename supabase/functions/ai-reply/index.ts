import { createClient } from 'npm:@supabase/supabase-js@2';
import OpenAI from 'npm:openai';
import { OPENAI_MODEL } from '../_shared/openai.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_ORIGIN') ?? 'https://operations.wirelesscares.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  SERVICE_ROLE_KEY,
);

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

const BUSINESS_CONTEXT = `You are the AI sales assistant for iDeals Tech Hub, a premium gadget shop in Accra, Ghana.
You sell smartphones, laptops, tablets, accessories, and offer repair services and trade-ins.
Your store is at Accra Mall. You accept MoMo payments and deliver nationwide (same-day in Accra, 1-2 days regional).
Always respond in a warm, friendly, professional tone. Use a few relevant emojis. Keep responses concise.
Prices are in GHS (Ghana Cedis). Always include a clear call-to-action.
If you don't know a specific price or detail, say you'll check and ask for their contact.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // This function is only ever meant to be called server-to-server by our
  // own webhook handlers (instagram/whatsapp/tiktok-webhook), which already
  // hold the service role key — never directly by a browser. Requiring the
  // exact key as the bearer token (rather than a staff JWT, which the
  // calling webhooks don't have) keeps it a trusted internal call while
  // still closing it off to the public internet.
  if (req.headers.get('authorization') !== `Bearer ${SERVICE_ROLE_KEY}`) {
    return new Response(JSON.stringify({ error: 'Not authorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { conversation_id, channel, message, contact_phone, contact_ig_id, contact_tiktok_id, is_comment } = await req.json();

    // Find matching automation rule by keyword
    const { data: rules } = await supabase
      .from('social_automation_rules')
      .select('*')
      .eq('is_active', true)
      .contains('channels', [channel]);

    const lowerMsg = message.toLowerCase();
    let matchedRule = null;

    for (const rule of rules ?? []) {
      const keywords: string[] = rule.trigger_keywords ?? [];
      if (keywords.some((kw: string) => lowerMsg.includes(kw.toLowerCase()))) {
        matchedRule = rule;
        break;
      }
    }

    // Build conversation history for context
    let historyMessages: { role: 'user' | 'assistant'; content: string }[] = [];
    if (conversation_id) {
      const { data: history } = await supabase
        .from('social_messages')
        .select('sender_type, content, created_at')
        .eq('conversation_id', conversation_id)
        .order('created_at', { ascending: true })
        .limit(20);

      historyMessages = (history ?? []).map((m) => ({
        role: m.sender_type === 'customer' ? 'user' : 'assistant',
        content: m.content,
      }));
    }

    if (!historyMessages.length || historyMessages[historyMessages.length - 1]?.content !== message) {
      historyMessages.push({ role: 'user', content: message });
    }

    const systemPrompt = matchedRule?.ai_prompt
      ? `${BUSINESS_CONTEXT}\n\n${matchedRule.ai_prompt}`
      : BUSINESS_CONTEXT;

    // Call OpenAI using the shared model setting
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      max_tokens: 500,
      messages: [
        { role: 'system', content: systemPrompt },
        ...historyMessages,
      ],
    });

    const replyText = response.choices[0]?.message?.content ?? '';
    if (!replyText) throw new Error('Empty AI response');

    // Store AI reply in DB
    if (conversation_id && !is_comment) {
      await supabase.from('social_messages').insert({
        conversation_id,
        channel,
        direction: 'outbound',
        sender_type: 'ai',
        content: replyText,
        ai_generated: true,
      });

      await supabase.from('social_conversations').update({
        last_message_at: new Date().toISOString(),
      }).eq('id', conversation_id);
    }

    // Update automation rule stats
    if (matchedRule) {
      await supabase
        .from('social_automation_rules')
        .update({ runs: (matchedRule.runs ?? 0) + 1 })
        .eq('id', matchedRule.id);
    }

    // Send the reply via the channel
    if (!is_comment) {
      const contactId = contact_phone ?? contact_ig_id ?? contact_tiktok_id;
      if (contactId) {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({ channel, to: contactId, message: replyText }),
        });
      }
    }

    return new Response(JSON.stringify({ reply: replyText, rule: matchedRule?.name ?? null }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('ai-reply error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
