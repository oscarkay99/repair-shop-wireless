import { createClient } from 'npm:@supabase/supabase-js@2';

const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  SERVICE_ROLE_KEY,
);

const cors = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_ORIGIN') ?? 'https://operations.wirelesscares.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Exponential moving average — weights recent days more heavily (alpha=0.3)
function ema(series: number[], alpha = 0.3): number {
  if (series.length === 0) return 0;
  return series.reduce((acc, v) => alpha * v + (1 - alpha) * acc);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  // Meant to be triggered by a scheduled job holding the service role key,
  // not called directly by a browser — it reads 90 days of transaction data.
  if (req.headers.get('authorization') !== `Bearer ${SERVICE_ROLE_KEY}`) {
    return new Response(JSON.stringify({ error: 'Not authorized' }), {
      status: 401, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  try {
    const now = new Date();
    const d30 = new Date(now); d30.setDate(now.getDate() - 30);
    const d7  = new Date(now); d7.setDate(now.getDate() - 7);
    const d14 = new Date(now); d14.setDate(now.getDate() - 14);
    const d90 = new Date(now); d90.setDate(now.getDate() - 90);

    const to90 = d90.toISOString().split('T')[0];
    const to30 = d30.toISOString().split('T')[0];
    const to14 = d14.toISOString().split('T')[0];
    const to7  = d7.toISOString().split('T')[0];

    // Pull all transactions from last 90 days
    const { data: txns, error: txErr } = await supabase
      .from('pos_transactions')
      .select('*')
      .gte('sale_date', to90)
      .order('sale_date');

    if (txErr) throw txErr;
    if (!txns?.length) {
      return new Response(JSON.stringify({ status: 'no_data' }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const nowStr = now.toISOString();

    // ── 1. Product velocity (EMA-based) ────────────────────────────────────────

    type DayMap = Map<string, number>;
    const productDays = new Map<string, { name: string; units: DayMap; revenue: DayMap; profit: DayMap }>();

    for (const t of txns) {
      if (!productDays.has(t.product_id)) {
        productDays.set(t.product_id, { name: t.product_name, units: new Map(), revenue: new Map(), profit: new Map() });
      }
      const p = productDays.get(t.product_id)!;
      p.units.set(t.sale_date, (p.units.get(t.sale_date) ?? 0) + t.quantity);
      p.revenue.set(t.sale_date, (p.revenue.get(t.sale_date) ?? 0) + Number(t.revenue));
      p.profit.set(t.sale_date, (p.profit.get(t.sale_date) ?? 0) + Number(t.profit));
    }

    const productPatterns = [];
    for (const [pid, p] of productDays) {
      let units30 = 0, rev30 = 0, profit30 = 0, units7 = 0, prior7 = 0;
      for (const [day, u] of p.units) {
        if (day >= to30) { units30 += u; rev30 += p.revenue.get(day) ?? 0; profit30 += p.profit.get(day) ?? 0; }
        if (day >= to7)  { units7 += u; }
        if (day >= to14 && day < to7) { prior7 += u; }
      }

      // Build 30-day series for EMA (oldest → newest)
      const series: number[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now); d.setDate(now.getDate() - i);
        series.push(p.units.get(d.toISOString().split('T')[0]) ?? 0);
      }
      const avgDailySales = ema(series, 0.3);

      const trend = units7 > prior7 * 1.2 ? 'up' : units7 < prior7 * 0.8 ? 'down' : 'flat';
      const velocity = avgDailySales >= 2 ? 'hot' : avgDailySales >= 0.5 ? 'steady' : units30 > 0 ? 'slow' : 'new';
      const forecast7d = Math.round(avgDailySales * 7 * (trend === 'up' ? 1.1 : 1.0));
      const avgUnitPrice = units30 > 0 ? rev30 / units30 : 0;

      productPatterns.push({
        product_id: pid,
        updated_at: nowStr,
        units_sold_7d: units7,
        units_sold_30d: units30,
        revenue_30d: +rev30.toFixed(2),
        profit_30d: +profit30.toFixed(2),
        avg_daily_sales: +avgDailySales.toFixed(3),
        velocity,
        // days_of_stock left at 0 — needs inventory integration
        days_of_stock: 0,
        sell_through_pct: 0,
        trend,
        reorder_alert: false,
        forecast_7d: forecast7d,
        forecast_revenue_7d: +(avgDailySales * 7 * avgUnitPrice).toFixed(2),
      });
    }

    // ── 2. Market basket analysis (lift scores) ────────────────────────────────

    const sessions = new Map<string, Set<string>>();
    for (const t of txns.filter(t => t.sale_date >= to30)) {
      if (!t.session_id) continue;
      if (!sessions.has(t.session_id)) sessions.set(t.session_id, new Set());
      sessions.get(t.session_id)!.add(t.product_id);
    }

    const N = sessions.size;
    const itemFreq = new Map<string, number>();
    const pairFreq = new Map<string, number>();

    for (const items of sessions.values()) {
      const arr = [...items];
      for (const a of arr) itemFreq.set(a, (itemFreq.get(a) ?? 0) + 1);
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          const key = [arr[i], arr[j]].sort().join('|');
          pairFreq.set(key, (pairFreq.get(key) ?? 0) + 1);
        }
      }
    }

    const bundlePatterns = [];
    for (const [pair, count] of pairFreq) {
      if (count < 2 || N < 5) continue;
      const [a, b] = pair.split('|');
      const pA = (itemFreq.get(a) ?? 1) / N;
      const pB = (itemFreq.get(b) ?? 1) / N;
      const lift = (count / N) / (pA * pB);
      if (lift < 1.2) continue;
      bundlePatterns.push({
        product_a: a, product_b: b,
        co_occurrences: count,
        lift_score: +lift.toFixed(3),
        updated_at: nowStr,
      });
    }

    // ── 3. Customer intelligence ───────────────────────────────────────────────

    type CustAcc = {
      spent: number; sessionIds: Set<string>; purchaseDays: string[];
      lastDay: string; catSpend: Map<string, number>;
    };
    const custMap = new Map<string, CustAcc>();

    for (const t of txns) {
      if (!t.customer_id) continue;
      if (!custMap.has(t.customer_id)) {
        custMap.set(t.customer_id, { spent: 0, sessionIds: new Set(), purchaseDays: [], lastDay: t.sale_date, catSpend: new Map() });
      }
      const c = custMap.get(t.customer_id)!;
      c.spent += Number(t.revenue);
      c.sessionIds.add(t.session_id ?? t.id);
      if (!c.purchaseDays.includes(t.sale_date)) c.purchaseDays.push(t.sale_date);
      if (t.sale_date > c.lastDay) c.lastDay = t.sale_date;
      if (t.category) c.catSpend.set(t.category, (c.catSpend.get(t.category) ?? 0) + Number(t.revenue));
    }

    const customerPatterns = [];
    for (const [cid, c] of custMap) {
      const orderCount = c.sessionIds.size;
      const avgOrderValue = c.spent / Math.max(orderCount, 1);
      const daysSince = Math.floor((now.getTime() - new Date(c.lastDay).getTime()) / 86_400_000);

      // VIP score: spend (0-40) + frequency (0-35) + recency (0-25)
      const vipScore = Math.min(Math.round(c.spent / 500), 40)
        + Math.min(orderCount * 5, 35)
        + Math.max(25 - daysSince, 0);

      const churnRisk = daysSince > 30 ? 'high' : daysSince > 14 ? 'medium' : 'low';

      // Predicted next purchase: avg interval between purchase days
      const sorted = [...c.purchaseDays].sort();
      let avgInterval = 30;
      if (sorted.length > 1) {
        const gaps = sorted.slice(1).map((d, i) =>
          (new Date(d).getTime() - new Date(sorted[i]).getTime()) / 86_400_000);
        avgInterval = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      }
      const daysUntilNext = Math.max(0, Math.round(avgInterval - daysSince));
      const predictedNextPurchase = daysUntilNext === 0 ? 'Overdue' : daysUntilNext === 1 ? 'Tomorrow' : `In ${daysUntilNext} days`;

      const favCategory = [...c.catSpend.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      const recommendedOffer = churnRisk === 'high'
        ? 'Win-back: 10% off next visit'
        : vipScore > 60 ? 'Early access + VIP pricing'
        : 'Bundle deal on accessories';

      customerPatterns.push({
        customer_id: cid, updated_at: nowStr,
        total_spent: +c.spent.toFixed(2),
        order_count: orderCount,
        avg_order_value: +avgOrderValue.toFixed(2),
        days_since_last_purchase: daysSince,
        vip_score: vipScore,
        churn_risk: churnRisk,
        predicted_next_purchase: predictedNextPurchase,
        recommended_offer: recommendedOffer,
        favorite_category: favCategory,
      });
    }

    // ── 4. Peak hour patterns ──────────────────────────────────────────────────

    const hourAcc = new Map<number, { rev: number; txns: number; days: Set<string> }>();
    for (let h = 0; h < 24; h++) hourAcc.set(h, { rev: 0, txns: 0, days: new Set() });

    for (const t of txns.filter(t => t.sale_date >= to30)) {
      const h = hourAcc.get(t.hour_of_day);
      if (!h) continue;
      h.rev += Number(t.revenue);
      h.txns++;
      h.days.add(t.sale_date);
    }

    const peakHourPatterns = [...hourAcc.entries()].map(([hour, h]) => {
      const days = Math.max(h.days.size, 1);
      return {
        hour_of_day: hour, updated_at: nowStr,
        avg_transactions: +(h.txns / days).toFixed(2),
        avg_revenue: +(h.rev / days).toFixed(2),
        total_transactions: h.txns,
        total_revenue: +h.rev.toFixed(2),
        sample_days: days,
      };
    });

    // ── 5. Persist everything ──────────────────────────────────────────────────

    const [r1, r2, r3, r4] = await Promise.all([
      supabase.from('product_patterns').upsert(productPatterns, { onConflict: 'product_id' }),
      bundlePatterns.length
        ? supabase.from('bundle_patterns').upsert(bundlePatterns, { onConflict: 'product_a,product_b' })
        : Promise.resolve({ error: null }),
      customerPatterns.length
        ? supabase.from('customer_patterns').upsert(customerPatterns, { onConflict: 'customer_id' })
        : Promise.resolve({ error: null }),
      supabase.from('peak_hour_patterns').upsert(peakHourPatterns, { onConflict: 'hour_of_day' }),
    ]);

    const errors = [r1, r2, r3, r4].flatMap(r => r.error ? [r.error.message] : []);

    return new Response(JSON.stringify({
      status: 'ok',
      computed_at: nowStr,
      transactions_processed: txns.length,
      products_updated: productPatterns.length,
      bundles_found: bundlePatterns.length,
      customers_profiled: customerPatterns.length,
      errors: errors.length ? errors : undefined,
    }), { headers: { ...cors, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('learn-patterns:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
