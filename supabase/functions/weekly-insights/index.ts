import { createClient } from 'npm:@supabase/supabase-js@2';
import { OPENAI_MODEL } from '../_shared/openai.ts';

const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  SERVICE_ROLE_KEY,
);
const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY')!;

const cors = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_ORIGIN') ?? 'https://operations.wirelesscares.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  // Meant to be triggered by a scheduled job holding the service role key,
  // not called directly by a browser — it reads and AI-summarizes real
  // revenue/profit figures, so it must not be left open to the internet.
  if (req.headers.get('authorization') !== `Bearer ${SERVICE_ROLE_KEY}`) {
    return new Response(JSON.stringify({ error: 'Not authorized' }), {
      status: 401, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  try {
    const now = new Date();
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7);
    const prevStart = new Date(weekStart); prevStart.setDate(weekStart.getDate() - 7);

    const weekStr = weekStart.toISOString().split('T')[0];
    const prevStr = prevStart.toISOString().split('T')[0];

    const [{ data: thisWeek }, { data: lastWeek }] = await Promise.all([
      supabase.from('pos_transactions').select('*').gte('sale_date', weekStr),
      supabase.from('pos_transactions').select('*').gte('sale_date', prevStr).lt('sale_date', weekStr),
    ]);

    if (!thisWeek?.length) {
      return new Response(JSON.stringify({ status: 'no_data' }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Aggregate this week
    const thisRevenue = thisWeek.reduce((s, t) => s + Number(t.revenue), 0);
    const lastRevenue = (lastWeek ?? []).reduce((s: number, t: { revenue: number }) => s + Number(t.revenue), 0);
    const thisProfit  = thisWeek.reduce((s, t) => s + Number(t.profit), 0);
    const sessions    = new Set(thisWeek.map(t => t.session_id)).size;

    // Top products by revenue
    const prodMap = new Map<string, { name: string; units: number; revenue: number }>();
    for (const t of thisWeek) {
      const p = prodMap.get(t.product_id) ?? { name: t.product_name, units: 0, revenue: 0 };
      p.units += t.quantity;
      p.revenue += Number(t.revenue);
      prodMap.set(t.product_id, p);
    }
    const topProducts = [...prodMap.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(p => `${p.name} — GHS ${Math.round(p.revenue).toLocaleString()} (${p.units} units)`);

    // Peak day
    const dayRev = new Map<string, number>();
    for (const t of thisWeek) dayRev.set(t.sale_date, (dayRev.get(t.sale_date) ?? 0) + Number(t.revenue));
    const peakDay = [...dayRev.entries()].sort((a, b) => b[1] - a[1])[0];

    // Slowest hour (for a promo suggestion)
    const hourRev = new Map<number, number>();
    for (const t of thisWeek) hourRev.set(t.hour_of_day, (hourRev.get(t.hour_of_day) ?? 0) + Number(t.revenue));
    const slowHour = [...hourRev.entries()].sort((a, b) => a[1] - b[1])[0]?.[0] ?? 14;

    const summary = {
      week_of: weekStr,
      revenue_ghs: Math.round(thisRevenue),
      revenue_change_pct: lastRevenue > 0
        ? `${((thisRevenue - lastRevenue) / lastRevenue * 100).toFixed(1)}%`
        : 'first week of data',
      profit_ghs: Math.round(thisProfit),
      margin_pct: Math.round((thisProfit / thisRevenue) * 100),
      transactions: sessions,
      top_products: topProducts,
      peak_day: peakDay ? `${peakDay[0]} — GHS ${Math.round(peakDay[1]).toLocaleString()}` : 'N/A',
      slow_hour: `${slowHour}:00`,
    };

    // Ask OpenAI for three narrative insights using the shared model setting
    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.6,
        messages: [
          {
            role: 'system',
            content: `You are a retail analytics expert for iDeals Tech Hub, a gadget shop in Accra, Ghana.
Analyse the weekly sales data and return exactly 3 insights — one opportunity, one warning, one trend.
Each insight must be specific to the numbers provided, immediately actionable, and 1-2 sentences.
Currency: GHS. Return JSON: { "insights": [{ "type": "opportunity"|"warning"|"trend", "title": string, "body": string }] }`,
          },
          { role: 'user', content: JSON.stringify(summary, null, 2) },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    const gpt = await completion.json();
    const { insights = [] } = JSON.parse(gpt.choices[0].message.content);

    const rows = insights.map((ins: { type: string; title: string; body: string }) => ({
      generated_at: now.toISOString(),
      week_start: weekStr,
      insight_type: ins.type,
      content: ins.body,
      metadata: { title: ins.title, summary },
    }));

    await supabase.from('ai_insights').insert(rows);

    return new Response(JSON.stringify({ status: 'ok', insights_generated: rows.length, summary }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('weekly-insights:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
