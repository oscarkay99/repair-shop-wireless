import OpenAI from 'npm:openai';
import { OPENAI_MODEL } from '../_shared/openai.ts';
import { requireActiveUser } from '../_shared/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_ORIGIN') ?? 'https://operations.wirelesscares.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const caller = await requireActiveUser(req.headers.get('authorization'));
  if (!caller) {
    return new Response(JSON.stringify({ error: 'Not authorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { topic, channel, tone = 'engaging', product, price } = await req.json();

    const channelGuide: Record<string, string> = {
      instagram: 'Instagram post or Reel caption. Use relevant hashtags (5-8). Include emojis. Max 300 characters for caption + hashtags below.',
      tiktok: 'TikTok video caption. Keep it punchy and trendy. 3-5 hashtags. Max 150 characters.',
      whatsapp: 'WhatsApp broadcast message. Friendly and direct. No hashtags. Max 200 characters.',
    };

    const guide = channelGuide[channel] ?? channelGuide.instagram;

    const prompt = `You are a social media content creator for iDeals Tech Hub, a premium gadget shop in Accra, Ghana.
Create 3 variations of a ${guide}

Topic: ${topic}
${product ? `Product: ${product}` : ''}
${price ? `Price: GHS ${price}` : ''}
Tone: ${tone}

For each variation provide:
1. The main caption/message
2. A short hook (first line that grabs attention)
3. A CTA (call to action)

Respond with valid JSON only:
{
  "variations": [
    {
      "caption": "full caption text with emojis and hashtags",
      "hook": "opening hook line",
      "cta": "call to action"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('ai-generate-post error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
