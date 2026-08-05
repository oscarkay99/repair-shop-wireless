import { createClient } from 'npm:@supabase/supabase-js@2';
import { OPENAI_MODEL } from '../_shared/openai.ts';
import { requireActiveUser } from '../_shared/auth.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_ORIGIN') ?? 'https://operations.wirelesscares.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── System prompt for POS AI ──────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an AI assistant for iDeals Tech Hub, a gadget shop in Accra, Ghana.
You help cashiers at the Point of Sale by:
1. Interpreting natural-language product queries and returning filter criteria
2. Suggesting upsell products based on what's in the cart
3. Estimating trade-in values for used devices

Prices are in GHS (Ghana Cedis). Be concise and return valid JSON only — no prose.`;

const CHAT_SYSTEM_PROMPT = `You are an AI sales assistant for iDeals Tech Hub, a gadget shop in Accra, Ghana.
You help cashiers and sales managers make better decisions at the point of sale.

You have access to today's sales summary and top product data in each message.
Currency is GHS (Ghana Cedis). Keep responses short (2–4 sentences max), practical, and action-oriented.
Speak like a knowledgeable colleague, not a corporate bot. No bullet points unless listing items.
Return JSON: { "reply": string }`;

// ── Action handlers ───────────────────────────────────────────────────────────

async function handleSearch(query: string) {
  const completion = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Parse this POS search query and return JSON with these optional fields:
{ "brand": string|null, "type": "phone"|"tablet"|"laptop"|"audio"|"wearable"|"accessory"|null, "priceMax": number|null, "priceMin": number|null, "keywords": string[] }

Query: "${query}"`,
        },
      ],
      response_format: { type: 'json_object' },
    }),
  });
  const data = await completion.json();
  return JSON.parse(data.choices[0].message.content);
}

async function handleUpsell(cartProducts: { name: string; type: string; brand: string }[]) {
  const completion = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.3,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `The customer has these items in their cart:
${JSON.stringify(cartProducts, null, 2)}

Suggest up to 4 complementary product types they might want to add. Return JSON:
{ "suggestions": [{ "type": string, "reason": string }] }`,
        },
      ],
      response_format: { type: 'json_object' },
    }),
  });
  const data = await completion.json();
  return JSON.parse(data.choices[0].message.content);
}

async function handleTradeIn(deviceName: string, condition: string, description: string) {
  const completion = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.2,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Estimate a fair trade-in value in GHS for this device at a Ghanaian gadget shop:

Device: ${deviceName}
Condition: ${condition}
Description: ${description}

Consider local Accra market prices, import costs, and resale potential.
Return JSON: { "estimatedValue": number, "minValue": number, "maxValue": number, "reasoning": string }`,
        },
      ],
      response_format: { type: 'json_object' },
    }),
  });
  const data = await completion.json();
  return JSON.parse(data.choices[0].message.content);
}

async function handleChat(query: string, context: Record<string, unknown>) {
  const completion = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.7,
      messages: [
        { role: 'system', content: CHAT_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Context:\n${JSON.stringify(context, null, 2)}\n\nQuestion: ${query}`,
        },
      ],
      response_format: { type: 'json_object' },
    }),
  });
  const data = await completion.json();
  return JSON.parse(data.choices[0].message.content);
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const caller = await requireActiveUser(req.headers.get('authorization'));
  if (!caller) {
    return new Response(JSON.stringify({ error: 'Not authorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { action, ...payload } = await req.json();

    let result: unknown;

    if (action === 'search') {
      result = await handleSearch(payload.query);
    } else if (action === 'upsell') {
      result = await handleUpsell(payload.cartProducts);
    } else if (action === 'trade-in') {
      result = await handleTradeIn(payload.deviceName, payload.condition, payload.description ?? '');
    } else if (action === 'chat') {
      result = await handleChat(payload.query, payload.context ?? {});
    } else {
      return new Response(JSON.stringify({ error: 'Unknown action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('pos-ai error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
