// ── 30-day sales history powering all AI intelligence features ────────────────

export interface SaleRecord {
  id: string;
  date: string;       // ISO date
  hour: number;       // 0-23
  productId: string;
  qty: number;
  unitPrice: number;
  unitCost: number;
  customerId: string | null;
  paymentMethod: 'momo' | 'cash' | 'card' | 'split';
  discountPct: number;
}

// Generates a plausible 30-day sales history for an Accra gadget shop
function makeHistory(): SaleRecord[] {
  const records: SaleRecord[] = [];
  let id = 1;

  // Product weights: higher = more likely to sell
  const productWeights: Record<string, number> = {
    p1: 3,   // iPhone 15 Pro
    p2: 3,   // S24 Ultra
    p3: 5,   // iPhone 14
    p4: 9,   // Redmi Note 13
    p5: 7,   // Samsung A55
    p6: 2,   // Pixel 8 Pro
    p7: 4,   // iPhone 15
    p8: 11,  // Tecno Camon 30
    p9: 6,   // AirPods Pro
    p10: 14, // Samsung Charger
    p11: 18, // Screen Protector
    p12: 15, // Phone Case
    p13: 3,  // Galaxy Watch
    p14: 2,  // Apple Watch SE
    p15: 12, // USB-C Cable
    p16: 2,  // Xiaomi Pad
  };

  const prices: Record<string, [number, number]> = {
    p1: [12500, 10200], p2: [12800, 10400], p3: [8200, 6600],
    p4: [2800, 2100],   p5: [3400, 2650],   p6: [9800, 7900],
    p7: [10200, 8300],  p8: [1800, 1350],   p9: [1800, 1300],
    p10: [120, 65],     p11: [35, 12],      p12: [45, 18],
    p13: [2200, 1700],  p14: [3200, 2550],  p15: [80, 30],
    p16: [4200, 3300],
  };

  const customerIds = ['c1', 'c2', 'c3', 'c4', 'c5', null, null, null]; // nulls = walk-ins
  const paymentMethods: ('momo' | 'cash' | 'card' | 'split')[] = ['momo', 'momo', 'momo', 'cash', 'cash', 'card', 'split'];
  // Peak hours: 10am-1pm and 4pm-7pm
  const hourWeights = [0,0,0,0,0,0,0,0,1,2,4,5,5,4,3,2,4,5,4,3,2,1,0,0];

  const today = new Date('2026-04-30');

  for (let day = 29; day >= 0; day--) {
    const date = new Date(today);
    date.setDate(today.getDate() - day);
    const dateStr = date.toISOString().split('T')[0];

    // Weekends slightly busier
    const dayOfWeek = date.getDay();
    const dailySales = dayOfWeek === 0 || dayOfWeek === 6 ? 18 : 12;

    for (let s = 0; s < dailySales; s++) {
      // Pick product by weight
      const total = Object.values(productWeights).reduce((a, b) => a + b, 0);
      let rand = Math.random() * total;
      let productId = 'p11';
      for (const [pid, w] of Object.entries(productWeights)) {
        rand -= w;
        if (rand <= 0) { productId = pid; break; }
      }

      // Pick hour by weight
      const hourTotal = hourWeights.reduce((a, b) => a + b, 0);
      let hourRand = Math.random() * hourTotal;
      let hour = 10;
      for (let h = 0; h < 24; h++) {
        hourRand -= hourWeights[h];
        if (hourRand <= 0) { hour = h; break; }
      }

      const [price, cost] = prices[productId];
      const discount = Math.random() < 0.15 ? Math.floor(Math.random() * 3) * 5 : 0; // 15% chance of 5/10/15% discount
      const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
      const payment = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      const qty = productId === 'p11' || productId === 'p12' || productId === 'p15' || productId === 'p10'
        ? Math.floor(Math.random() * 3) + 1 : 1;

      records.push({
        id: `S${String(id++).padStart(4, '0')}`,
        date: dateStr,
        hour,
        productId,
        qty,
        unitPrice: price,
        unitCost: cost,
        customerId,
        paymentMethod: payment,
        discountPct: discount,
      });
    }
  }

  return records;
}

export const salesHistory = makeHistory();

// ── Computed metrics ──────────────────────────────────────────────────────────

export interface ProductMetrics {
  productId: string;
  unitsSold30d: number;
  revenue30d: number;
  profit30d: number;
  avgDailySales: number;       // units/day over last 30d
  velocity: 'hot' | 'steady' | 'slow' | 'new';
  daysOfStock: number;         // current stock / avg daily sales
  sellThrough: number;         // % of days with at least 1 sale
  trend: 'up' | 'flat' | 'down'; // last 7d vs prior 7d
  reorderAlert: boolean;
}

const currentStock: Record<string, number> = {
  p1: 4, p2: 3, p3: 6, p4: 12, p5: 8, p6: 2,
  p7: 5, p8: 15, p9: 9, p10: 30, p11: 100,
  p12: 80, p13: 6, p14: 4, p15: 60, p16: 3,
};

function computeMetrics(): ProductMetrics[] {
  const productIds = Object.keys(currentStock);
  const now = new Date('2026-04-30');
  const day7ago = new Date(now); day7ago.setDate(now.getDate() - 7);
  const day14ago = new Date(now); day14ago.setDate(now.getDate() - 14);

  return productIds.map(pid => {
    const records = salesHistory.filter(r => r.productId === pid);
    const unitsSold30d = records.reduce((s, r) => s + r.qty, 0);
    const revenue30d = records.reduce((s, r) => s + r.unitPrice * r.qty * (1 - r.discountPct / 100), 0);
    const profit30d = records.reduce((s, r) => s + (r.unitPrice - r.unitCost) * r.qty * (1 - r.discountPct / 100), 0);
    const avgDailySales = unitsSold30d / 30;

    const last7 = records.filter(r => new Date(r.date) >= day7ago).reduce((s, r) => s + r.qty, 0);
    const prior7 = records.filter(r => new Date(r.date) >= day14ago && new Date(r.date) < day7ago).reduce((s, r) => s + r.qty, 0);
    const trend: 'up' | 'flat' | 'down' = last7 > prior7 * 1.2 ? 'up' : last7 < prior7 * 0.8 ? 'down' : 'flat';

    const daysWithSales = new Set(records.map(r => r.date)).size;
    const sellThrough = Math.round((daysWithSales / 30) * 100);

    const velocity: 'hot' | 'steady' | 'slow' | 'new' =
      avgDailySales > 1.5 ? 'hot' :
      avgDailySales > 0.5 ? 'steady' :
      avgDailySales > 0.1 ? 'slow' : 'new';

    const daysOfStock = avgDailySales > 0 ? Math.round(currentStock[pid] / avgDailySales) : 999;
    const reorderAlert = daysOfStock <= 7 && currentStock[pid] <= 5;

    return { productId: pid, unitsSold30d, revenue30d, profit30d, avgDailySales, velocity, daysOfStock, sellThrough, trend, reorderAlert };
  });
}

export const productMetrics = computeMetrics();

// ── Frequently bought together ────────────────────────────────────────────────

export interface BundleInsight {
  productA: string;
  productB: string;
  coOccurrences: number;
  liftScore: number;
}

function computeBundles(): BundleInsight[] {
  // Group sales by day+customer (same session = same day + same customer)
  const sessions: Record<string, string[]> = {};
  for (const r of salesHistory) {
    const key = `${r.date}-${r.customerId ?? r.id.slice(0, 4)}`;
    if (!sessions[key]) sessions[key] = [];
    sessions[key].push(r.productId);
  }

  const pairCounts: Record<string, number> = {};
  const productCounts: Record<string, number> = {};

  for (const pids of Object.values(sessions)) {
    const unique = [...new Set(pids)];
    for (const pid of unique) {
      productCounts[pid] = (productCounts[pid] ?? 0) + 1;
    }
    for (let i = 0; i < unique.length; i++) {
      for (let j = i + 1; j < unique.length; j++) {
        const key = [unique[i], unique[j]].sort().join('|');
        pairCounts[key] = (pairCounts[key] ?? 0) + 1;
      }
    }
  }

  const totalSessions = Object.keys(sessions).length;
  const results: BundleInsight[] = [];

  for (const [pair, count] of Object.entries(pairCounts)) {
    if (count < 3) continue;
    const [a, b] = pair.split('|');
    const pA = (productCounts[a] ?? 1) / totalSessions;
    const pB = (productCounts[b] ?? 1) / totalSessions;
    const pAB = count / totalSessions;
    const lift = pAB / (pA * pB);
    results.push({ productA: a, productB: b, coOccurrences: count, liftScore: Math.round(lift * 10) / 10 });
  }

  return results.sort((a, b) => b.liftScore - a.liftScore).slice(0, 10);
}

export const bundleInsights = computeBundles();

// ── Peak hour analysis ────────────────────────────────────────────────────────

export interface HourMetric {
  hour: number;
  label: string;
  transactions: number;
  revenue: number;
}

export function computePeakHours(): HourMetric[] {
  const byHour: Record<number, { transactions: number; revenue: number }> = {};
  for (const r of salesHistory) {
    if (!byHour[r.hour]) byHour[r.hour] = { transactions: 0, revenue: 0 };
    byHour[r.hour].transactions++;
    byHour[r.hour].revenue += r.unitPrice * r.qty * (1 - r.discountPct / 100);
  }
  return Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    label: h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`,
    transactions: byHour[h]?.transactions ?? 0,
    revenue: byHour[h]?.revenue ?? 0,
  })).filter(h => h.transactions > 0);
}

export const peakHours = computePeakHours();

// ── Customer intelligence ─────────────────────────────────────────────────────

export interface CustomerIntelligence {
  customerId: string;
  totalSpent: number;
  totalTransactions: number;
  avgOrderValue: number;
  daysSinceLastPurchase: number;
  topCategories: string[];
  predictedNextPurchase: string;
  recommendedOffer: string;
  vipScore: number; // 0-100
  churnRisk: 'low' | 'medium' | 'high';
}

const productCategories: Record<string, string> = {
  p1: 'Apple', p2: 'Samsung', p3: 'Apple', p4: 'Xiaomi', p5: 'Samsung',
  p6: 'Google', p7: 'Apple', p8: 'Tecno', p9: 'Audio', p10: 'Accessories',
  p11: 'Accessories', p12: 'Accessories', p13: 'Samsung', p14: 'Apple',
  p15: 'Accessories', p16: 'Xiaomi',
};

const productNames: Record<string, string> = {
  p1: 'iPhone 15 Pro', p2: 'Samsung S24 Ultra', p3: 'iPhone 14',
  p4: 'Redmi Note 13', p5: 'Samsung A55', p6: 'Google Pixel 8 Pro',
  p7: 'iPhone 15', p8: 'Tecno Camon 30', p9: 'AirPods Pro 2',
  p10: 'Charger', p11: 'Screen Protector', p12: 'Phone Case',
  p13: 'Galaxy Watch 6', p14: 'Apple Watch SE', p15: 'USB-C Cable',
  p16: 'Xiaomi Pad 6',
};

function computeCustomerIntelligence(): CustomerIntelligence[] {
  const customerIds = ['c1', 'c2', 'c3', 'c4', 'c5'];

  return customerIds.map(cid => {
    const records = salesHistory.filter(r => r.customerId === cid);
    const totalSpent = records.reduce((s, r) => s + r.unitPrice * r.qty * (1 - r.discountPct / 100), 0);
    const totalTransactions = records.length;
    const avgOrderValue = totalTransactions > 0 ? totalSpent / totalTransactions : 0;

    const lastDate = records.length > 0
      ? Math.max(...records.map(r => new Date(r.date).getTime()))
      : 0;
    const daysSinceLastPurchase = lastDate
      ? Math.floor((new Date('2026-04-30').getTime() - lastDate) / (1000 * 60 * 60 * 24))
      : 999;

    const catCount: Record<string, number> = {};
    for (const r of records) {
      const cat = productCategories[r.productId] ?? 'Other';
      catCount[cat] = (catCount[cat] ?? 0) + r.qty;
    }
    const topCategories = Object.entries(catCount).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([c]) => c);

    // Most bought product type → predict next
    const topCat = topCategories[0] ?? 'Apple';
    const predictedNextPurchase = topCat === 'Apple'
      ? 'iPhone 15 or AirPods Pro upgrade'
      : topCat === 'Samsung'
      ? 'Samsung Galaxy Watch or A-series refresh'
      : topCat === 'Accessories'
      ? 'Premium case or fast charger bundle'
      : 'Mid-range device upgrade';

    const recommendedOffer = avgOrderValue > 5000
      ? '5% VIP loyalty discount on next purchase'
      : totalTransactions >= 3
      ? 'Free screen protector with next device'
      : '10% off accessories bundle';

    const vipScore = Math.min(100, Math.round(
      (totalSpent / 500) * 0.4 +
      (totalTransactions * 5) * 0.3 +
      (Math.max(0, 30 - daysSinceLastPurchase) / 30) * 30
    ));

    const churnRisk: 'low' | 'medium' | 'high' =
      daysSinceLastPurchase > 20 ? 'high' :
      daysSinceLastPurchase > 10 ? 'medium' : 'low';

    return {
      customerId: cid,
      totalSpent,
      totalTransactions,
      avgOrderValue,
      daysSinceLastPurchase,
      topCategories,
      predictedNextPurchase,
      recommendedOffer,
      vipScore,
      churnRisk,
    };
  });
}

export const customerIntelligence = computeCustomerIntelligence();

// ── Today's summary ───────────────────────────────────────────────────────────

export function getTodaySummary() {
  const today = '2026-04-30';
  const todayRecords = salesHistory.filter(r => r.date === today);
  const revenue = todayRecords.reduce((s, r) => s + r.unitPrice * r.qty * (1 - r.discountPct / 100), 0);
  const profit = todayRecords.reduce((s, r) => s + (r.unitPrice - r.unitCost) * r.qty * (1 - r.discountPct / 100), 0);
  const transactions = todayRecords.length;
  const avgOrder = transactions > 0 ? revenue / transactions : 0;

  const yesterday = '2026-04-29';
  const yRecords = salesHistory.filter(r => r.date === yesterday);
  const yRevenue = yRecords.reduce((s, r) => s + r.unitPrice * r.qty * (1 - r.discountPct / 100), 0);

  return { revenue, profit, transactions, avgOrder, yRevenue, growthPct: yRevenue > 0 ? Math.round(((revenue - yRevenue) / yRevenue) * 100) : 0 };
}

// ── Anomaly detection ─────────────────────────────────────────────────────────

export interface AnomalyAlert {
  type: 'high_discount' | 'low_margin' | 'unusual_hour' | 'repeat_refund';
  severity: 'warning' | 'critical';
  message: string;
  productId?: string;
}

export function detectAnomalies(discountPct: number, productId: string, hour: number): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = [];
  const prices: Record<string, [number, number]> = {
    p1: [12500, 10200], p2: [12800, 10400], p3: [8200, 6600],
    p4: [2800, 2100], p5: [3400, 2650], p6: [9800, 7900],
    p7: [10200, 8300], p8: [1800, 1350], p9: [1800, 1300],
    p10: [120, 65], p11: [35, 12], p12: [45, 18],
    p13: [2200, 1700], p14: [3200, 2550], p15: [80, 30], p16: [4200, 3300],
  };

  if (discountPct >= 20) {
    alerts.push({ type: 'high_discount', severity: 'critical', message: `${discountPct}% discount exceeds approval threshold`, productId });
  } else if (discountPct >= 10) {
    alerts.push({ type: 'high_discount', severity: 'warning', message: `${discountPct}% discount — confirm with manager`, productId });
  }

  const [price, cost] = prices[productId] ?? [100, 80];
  const effectiveMargin = ((price * (1 - discountPct / 100) - cost) / (price * (1 - discountPct / 100))) * 100;
  if (effectiveMargin < 8) {
    alerts.push({ type: 'low_margin', severity: 'critical', message: `Margin drops to ${Math.round(effectiveMargin)}% after discount`, productId });
  }

  if (hour < 8 || hour > 20) {
    alerts.push({ type: 'unusual_hour', severity: 'warning', message: `Transaction at ${hour}:00 — outside normal hours` });
  }

  return alerts;
}
