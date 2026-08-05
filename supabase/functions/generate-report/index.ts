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
    const {
      period,
      revenue, prevRevenue,
      cogs, opex,
      grossProfit, netProfit, netMargin,
      totalSales, voidedSales,
      topProducts,
      stockAlerts, outOfStock,
      activeLeads, hotLeads,
      pendingPayments,
      ytdRevenue, ytdNetProfit,
    } = await req.json();

    const systemPrompt = `You are a business analyst for iDeals Tech Hub, a gadget shop in Accra, Ghana.
Be concise and direct. Use GHS. Numbers only where meaningful.
Use exactly these markdown sections (2-3 bullets each, no padding):
## Executive Summary
## Revenue & Sales
## Profitability
## Inventory & Stock
## Leads & Pipeline
## Recommendations`;

    const userPrompt = `Generate a business performance report for iDeals Tech Hub.

PERIOD: ${period}

FINANCIALS:
- Revenue: GHS ${Math.round(revenue).toLocaleString()} (prev period: GHS ${Math.round(prevRevenue).toLocaleString()})
- Cost of Goods Sold (COGS): GHS ${Math.round(cogs).toLocaleString()}
- Operating Expenses: GHS ${Math.round(opex).toLocaleString()}
- Gross Profit: GHS ${Math.round(grossProfit).toLocaleString()}
- Net Profit: GHS ${Math.round(netProfit).toLocaleString()} (${netMargin}% margin)
- YTD Revenue: GHS ${Math.round(ytdRevenue).toLocaleString()}
- YTD Net Profit: GHS ${Math.round(ytdNetProfit).toLocaleString()}

SALES:
- Total sales in period: ${totalSales}
- Voided/refunded: ${voidedSales}
- Top selling products: ${topProducts || 'Not specified'}

INVENTORY:
- Stock alerts (≤2 units): ${stockAlerts} products
- Out of stock: ${outOfStock} products

PIPELINE:
- Active leads: ${activeLeads} (${hotLeads} hot)
- Pending payments: GHS ${Math.round(pendingPayments).toLocaleString()}

Analyse this data and produce a business report.`;

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      max_tokens: 550,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const report = response.choices[0]?.message?.content ?? '';
    return new Response(JSON.stringify({ report }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('generate-report error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
