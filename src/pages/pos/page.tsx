import { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/feature/AdminLayout';
import {
  upsellRules, installmentPlans, tradeInConditions, tradeInDevices,
  type PosProduct, type PosCustomer,
} from '@/mocks/pos';
import {
  productMetrics, customerIntelligence,
  detectAnomalies, type AnomalyAlert,
} from '@/mocks/posIntelligence';
import { recordSaleTransaction } from '@/hooks/useLearnedPatterns';
import { useAuth } from '@/hooks/useAuth';
import { useInventory, type InventoryProduct } from '@/hooks/useInventory';
import { useCustomers } from '@/hooks/useCustomers';
import { useSales } from '@/hooks/useSales';
import type { Customer } from '@/types/customer';
import AiReceiptModal from './components/AiReceiptModal';
import IntelligencePanel from './components/IntelligencePanel';
import AiChat from './components/AiChat';
import AddCustomerModal from '@/pages/customers/components/AddCustomerModal';

export interface CartItem {
  product: PosProduct;
  qty: number;
  discount: number;
  imeiEntered?: string;
}

export interface TradeIn {
  device: string;
  condition: string;
  value: number;
}

// ── Natural-language search ────────────────────────────────────────────────────

function parseAiQuery(query: string, products: PosProduct[]): PosProduct[] {
  const q = query.toLowerCase().trim();
  if (!q) return products;
  const priceUnder = q.match(/under\s+(\d+)/)?.[1];
  const priceOver = q.match(/over\s+(\d+)/)?.[1];
  const priceBetween = q.match(/between\s+(\d+)\s+and\s+(\d+)/);
  const brands = ['apple', 'samsung', 'xiaomi', 'google', 'tecno'];
  const types: Record<string, PosProduct['type'][]> = {
    phone: ['phone'], tablet: ['tablet'], laptop: ['laptop'],
    watch: ['wearable'], earbuds: ['audio'], airpods: ['audio'],
    accessory: ['accessory'], accessories: ['accessory'],
    cable: ['accessory'], charger: ['accessory'], case: ['accessory'],
  };
  return products.filter(p => {
    if (priceUnder && p.price > Number(priceUnder)) return false;
    if (priceOver && p.price < Number(priceOver)) return false;
    if (priceBetween && (p.price < Number(priceBetween[1]) || p.price > Number(priceBetween[2]))) return false;
    const brandMatch = brands.find(b => q.includes(b));
    if (brandMatch && !p.brand.toLowerCase().includes(brandMatch)) return false;
    const typeKeyword = Object.keys(types).find(k => q.includes(k));
    if (typeKeyword && !types[typeKeyword].includes(p.type)) return false;
    const cleaned = q.replace(/under\s+\d+|over\s+\d+|between\s+\d+\s+and\s+\d+/g, '').trim();
    const words = cleaned.split(/\s+/).filter(w => w.length > 2 && !brands.includes(w) && !Object.keys(types).includes(w));
    if (words.length > 0 && !words.some(w => p.name.toLowerCase().includes(w))) return false;
    return true;
  });
}

function formatGHS(n: number) {
  return `GHS ${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function formatGHSShort(n: number) {
  if (n >= 1000) return `GHS ${(n / 1000).toFixed(1)}k`;
  return `GHS ${Math.round(n)}`;
}
function margin(price: number, cost: number) {
  return Math.round(((price - cost) / price) * 100);
}
function marginColor(pct: number) {
  if (pct >= 25) return 'text-emerald-600';
  if (pct >= 15) return 'text-amber-500';
  return 'text-rose-500';
}

const CATEGORIES = ['All', 'Phones', 'Laptops', 'Tablets', 'Accessories', 'Wearables'];

const categoryToType: Record<string, PosProduct['type']> = {
  Phones: 'phone', Laptops: 'laptop', Tablets: 'tablet',
  Wearables: 'wearable', Accessories: 'accessory',
};

function mapToPosProduct(p: InventoryProduct): PosProduct {
  const price = parseFloat(p.price.replace(/[^0-9.]/g, '')) || 0;
  return {
    id: p.id, name: p.name, price, cost: p.costPrice ?? 0, stock: p.stock,
    category: p.category, type: categoryToType[p.category] ?? 'accessory',
    brand: p.name.split(' ')[0], imei: !!p.imei,
  };
}

function mapToPosCustomer(c: Customer): PosCustomer {
  const ltv = parseFloat(c.ltv.replace(/[^0-9.]/g, '')) || 0;
  return {
    id: c.id, name: c.name, phone: c.phone, email: c.email,
    loyaltyPoints: c.orders * 10, totalSpent: ltv,
    purchaseCount: c.orders, lastPurchase: c.lastOrder,
    openRepairs: c.repairs, tags: [c.segment],
  };
}

// ── Velocity badge ─────────────────────────────────────────────────────────────

function VelocityBadge({ productId }: { productId: string }) {
  const m = productMetrics.find(x => x.productId === productId);
  if (!m) return null;
  const cfg = {
    hot:    { label: 'Hot Seller', title: 'Hot seller', cls: 'bg-rose-50 text-rose-600 border-rose-200' },
    steady: { label: 'Steady', title: 'Steady mover', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    slow:   { label: 'Slow Mover', title: 'Slow mover', cls: 'bg-amber-50 text-amber-600 border-amber-200' },
    new:    { label: 'New', title: 'New arrival', cls: 'bg-sky-50 text-sky-600 border-sky-200' },
  }[m.velocity];
  return (
    <span
      title={cfg.title}
      className={`absolute top-2 left-2 text-[9px] leading-none font-bold px-2 py-1 rounded-full border ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function POSPage() {
  const [activeTab, setActiveTab] = useState<'checkout' | 'intelligence'>('checkout');
  const [query, setQuery] = useState('');
  const [aiMode, setAiMode] = useState(false);
  const [category, setCategory] = useState('All');
  const [isSearching, setIsSearching] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState('cash');
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'cash' | 'card' | 'split'>('momo');
  const [momoNumber, setMomoNumber] = useState('');
  const [splitCash, setSplitCash] = useState('');

  const [customerQuery, setCustomerQuery] = useState('');
  const [customer, setCustomer] = useState<PosCustomer | null>(null);
  const [customerSuggestions, setCustomerSuggestions] = useState<PosCustomer[]>([]);

  const [showTradeIn, setShowTradeIn] = useState(false);
  const [tradeInDevice, setTradeInDevice] = useState('');
  const [tradeInCondition, setTradeInCondition] = useState('');
  const [tradeIn, setTradeIn] = useState<TradeIn | null>(null);

  const [upsells, setUpsells] = useState<PosProduct[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyAlert[]>([]);

  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedSale, setCompletedSale] = useState<{
    cart: CartItem[]; customer: PosCustomer | null; total: number;
    tradeIn: TradeIn | null; method: string; plan: string;
  } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const { products: inventoryProducts, adjustStock } = useInventory();
  const { customers: allCustomers, add: addCustomer } = useCustomers();
  const { sales, add: saveSale } = useSales();
  const { user } = useAuth();

  const posProductsList = inventoryProducts.map(mapToPosProduct);
  const posCustomersList = allCustomers.map(mapToPosCustomer);
  const today = new Date().toLocaleDateString('en-GH', { month: 'short', day: 'numeric', year: 'numeric' });
  const todaySales = sales.filter(s => s.date === today && s.status !== 'cancelled' && s.status !== 'refunded');

  const parseGHS = (t: string) => parseFloat(t.replace(/[^0-9.]/g, '')) || 0;

  function estimateCogs(itemsStr: string): number {
    return itemsStr.split(',').reduce((sum, part) => {
      const m = part.trim().match(/^(\d+)x\s+(.+)$/);
      if (!m) return sum;
      const qty = parseInt(m[1]);
      const name = m[2].trim().toLowerCase();
      const product = posProductsList.find(p => p.name.toLowerCase() === name);
      return sum + (product ? product.cost * qty : 0);
    }, 0);
  }

  const todayRevenue = todaySales.reduce((s, x) => s + parseGHS(x.total), 0);
  const todayCogs    = todaySales.reduce((s, x) => s + (x.cogs ?? estimateCogs(x.items)), 0);
  const todayProfit  = todayRevenue - todayCogs;
  const todayAvgOrder = todaySales.length > 0 ? todayRevenue / todaySales.length : 0;

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toLocaleDateString('en-GH', { month: 'short', day: 'numeric', year: 'numeric' });
  const yesterdayRevenue = sales
    .filter(s => s.date === yesterday && s.status !== 'cancelled' && s.status !== 'refunded')
    .reduce((s, x) => s + parseGHS(x.total), 0);
  const growthPct = yesterdayRevenue > 0 ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100) : 0;

  // ── Filtered products ────────────────────────────────────────────────────────

  const simpleFiltered = posProductsList.filter(p => {
    const matchCat = category === 'All' || p.category === category;
    if (!matchCat) return false;
    if (!query) return true;
    return p.name.toLowerCase().includes(query.toLowerCase());
  });

  const [aiFiltered, setAiFiltered] = useState<PosProduct[]>([]);

  useEffect(() => {
    if (!aiMode) return;
    if (!query.trim()) { setAiFiltered(posProductsList); return; }
    setIsSearching(true);
    const t = setTimeout(() => { setAiFiltered(parseAiQuery(query, posProductsList)); setIsSearching(false); }, 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, aiMode, posProductsList.length]);

  const displayedProducts = aiMode ? aiFiltered : simpleFiltered;

  // ── Customer lookup ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!customerQuery.trim()) { setCustomerSuggestions([]); return; }
    setCustomerSuggestions(posCustomersList.filter(c =>
      c.phone.includes(customerQuery) || c.name.toLowerCase().includes(customerQuery.toLowerCase()),
    ).slice(0, 4));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerQuery, posCustomersList.length]);

  const customerCI = customer ? customerIntelligence.find(ci => ci.customerId === customer.id.replace('U', 'c').toLowerCase()) ?? null : null;

  // ── Cart math ────────────────────────────────────────────────────────────────

  const cartLines = cart.map(item => ({
    ...item,
    linePrice: item.product.price * item.qty * (1 - item.discount / 100),
  }));
  const subtotal = cartLines.reduce((s, i) => s + i.linePrice, 0);
  const tradeInValue = tradeIn?.value ?? 0;
  const loyaltyDiscount = customer ? Math.min(customer.loyaltyPoints * 0.1, subtotal * 0.05) : 0;
  const orderDiscountAmt = subtotal * (orderDiscount / 100);
  const netBeforePlan = Math.max(0, subtotal - orderDiscountAmt - tradeInValue - loyaltyDiscount);
  const plan = installmentPlans.find(p => p.id === selectedPlan)!;
  const totalWithPlan = netBeforePlan * (1 + plan.rate);
  const monthlyInstallment = plan.months > 0 ? totalWithPlan / plan.months : 0;

  // ── Anomaly detection ────────────────────────────────────────────────────────

  useEffect(() => {
    const hour = new Date().getHours();
    const allAlerts: AnomalyAlert[] = [];
    cart.forEach(item => {
      detectAnomalies(item.discount, item.product.id, hour).forEach(a => {
        if (!allAlerts.find(x => x.message === a.message)) allAlerts.push(a);
      });
    });
    if (orderDiscount >= 15) {
      allAlerts.push({ type: 'high_discount', severity: 'warning', message: `Order-level ${orderDiscount}% discount — manager approval needed` });
    }
    setAnomalies(allAlerts);
  }, [cart, orderDiscount]);

  // ── Upsell engine ────────────────────────────────────────────────────────────

  useEffect(() => {
    const cartIds = cart.map(i => i.product.id);
    const suggested = new Set<string>();
    cart.forEach(item => (upsellRules[item.product.type] ?? []).forEach(id => { if (!cartIds.includes(id)) suggested.add(id); }));
    setUpsells(posProductsList.filter(p => suggested.has(p.id)).slice(0, 4));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart]);

  // ── Cart actions ─────────────────────────────────────────────────────────────

  function addToCart(product: PosProduct) {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product, qty: 1, discount: 0 }];
    });
  }
  function removeFromCart(id: string) { setCart(prev => prev.filter(i => i.product.id !== id)); }
  function updateQty(id: string, qty: number) {
    if (qty <= 0) { removeFromCart(id); return; }
    setCart(prev => prev.map(i => i.product.id === id ? { ...i, qty } : i));
  }
  function updateItemDiscount(id: string, disc: number) {
    setCart(prev => prev.map(i => i.product.id === id ? { ...i, discount: Math.min(disc, 30) } : i));
  }

  function applyTradeIn() {
    const dev = tradeInDevices.find(d => d.id === tradeInDevice);
    const cond = tradeInConditions.find(c => c.id === tradeInCondition);
    if (!dev || !cond) return;
    setTradeIn({ device: dev.name, condition: cond.label, value: Math.round(dev.baseValue * cond.multiplier) });
    setShowTradeIn(false);
  }

  const hasCustomer = !!(customer || customerQuery.trim());

  function completeSale() {
    if (cart.length === 0 || !hasCustomer) return;
    const methodLabel = paymentMethod === 'momo' ? `MoMo (${momoNumber || '—'})` : paymentMethod === 'split' ? `Split (Cash: ${formatGHS(Number(splitCash))})` : paymentMethod === 'cash' ? 'Cash' : 'Card';
    const saleCustomer: typeof customer = customer ?? (customerQuery.trim()
      ? { id: '', name: customerQuery.trim(), phone: '', email: '', loyaltyPoints: 0, totalSpent: 0, purchaseCount: 0, lastPurchase: '', openRepairs: 0, tags: [] }
      : null);
    setCompletedSale({ cart, customer: saleCustomer, total: totalWithPlan, tradeIn, method: methodLabel, plan: plan.label });
    setShowReceipt(true);

    const payMethod = paymentMethod === 'momo' ? 'MoMo' : paymentMethod === 'card' ? 'Card' : 'Cash';

    const saleCogs = cart.reduce((sum, i) => sum + i.product.cost * i.qty * (1 - i.discount / 100), 0);

    void saveSale({
      customer: saleCustomer?.name ?? 'Walk-in',
      items: cart.map(i => `${i.qty}x ${i.product.name}`).join(', '),
      total: `GHS ${Math.round(totalWithPlan).toLocaleString()}`,
      method: payMethod,
      status: 'completed',
      date: today,
      delivery: 'Pickup',
      cogs: saleCogs > 0 ? Math.round(saleCogs) : undefined,
    });

    // Deduct inventory stock
    cart.forEach(item => {
      adjustStock(item.product.id, Math.max(0, item.product.stock - item.qty));
    });

    // Record to pos_transactions for ML pattern learning
    const sessionId = crypto.randomUUID();
    void recordSaleTransaction({
      sessionId,
      items: cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        category: item.product.category,
        quantity: item.qty,
        unitPrice: item.product.price,
        unitCost: item.product.cost,
        discountPct: item.discount,
      })),
      paymentMethod: methodLabel,
      customerId: saleCustomer?.id || null,
      customerName: saleCustomer?.name ?? null,
      customerPhone: saleCustomer?.phone || null,
      cashierId: user?.id,
    });
  }

  function newSale() {
    setCart([]); setCustomer(null); setCustomerQuery('');
    setOrderDiscount(0); setSelectedPlan('cash'); setPaymentMethod('momo');
    setMomoNumber(''); setSplitCash(''); setTradeIn(null);
    setShowReceipt(false); setCompletedSale(null);
    setActiveTab('checkout');
    searchInputRef.current?.focus();
  }

  const inCart = (id: string) => cart.find(i => i.product.id === id)?.qty ?? 0;
  const tradeInEstimate = tradeInDevice && tradeInCondition
    ? Math.round((tradeInDevices.find(d => d.id === tradeInDevice)?.baseValue ?? 0) * (tradeInConditions.find(c => c.id === tradeInCondition)?.multiplier ?? 0))
    : null;

  return (
    <AdminLayout title="AI Point of Sale" subtitle="Intelligent checkout · Demand forecasting · Real-time insights">

      {/* ── Top stats bar ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { label: "Today's Revenue", value: formatGHSShort(todayRevenue), sub: `${growthPct >= 0 ? '+' : ''}${growthPct}% vs yesterday`, icon: 'ri-money-dollar-circle-line', color: '#EC0118', positive: growthPct >= 0 },
          { label: 'Transactions', value: String(todaySales.length), sub: `${formatGHSShort(todayAvgOrder)} avg order`, icon: 'ri-receipt-line', color: '#10b981', positive: true },
          { label: "Today's Profit", value: formatGHSShort(todayProfit), sub: `${Math.round((todayProfit / Math.max(todayRevenue, 1)) * 100)}% margin`, icon: 'ri-line-chart-line', color: '#f59e0b', positive: todayProfit >= 0 },
          { label: 'Reorder Alerts', value: String(productMetrics.filter(m => m.reorderAlert).length), sub: 'items need restocking', icon: 'ri-alarm-warning-line', color: productMetrics.some(m => m.reorderAlert) ? '#ef4444' : '#10b981', positive: !productMetrics.some(m => m.reorderAlert) },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${stat.color}18` }}>
              <i className={`${stat.icon} text-lg`} style={{ color: stat.color }} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-medium">{stat.label}</p>
              <p className="text-lg font-black text-slate-900 leading-tight">{stat.value}</p>
              <p className={`text-[10px] font-medium ${stat.positive ? 'text-emerald-600' : 'text-rose-500'}`}>{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-4">
        {([
          { id: 'checkout', label: 'Checkout', icon: 'ri-store-3-line' },
          { id: 'intelligence', label: 'AI Intelligence', icon: 'ri-sparkling-2-line' },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${activeTab === tab.id ? 'text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200 hover:border-[#EC0118] hover:text-[#EC0118]'}`}
            style={activeTab === tab.id ? { background: 'linear-gradient(135deg, #EC0118, #3b82f6)' } : {}}
          >
            <i className={tab.icon} />{tab.label}
            {tab.id === 'intelligence' && (
              <span className="text-[9px] font-bold bg-amber-400/20 text-amber-700 px-1.5 py-0.5 rounded-full">LIVE</span>
            )}
          </button>
        ))}
        {anomalies.length > 0 && (
          <div className="ml-auto flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-1.5">
            <i className="ri-alarm-warning-fill text-rose-500" />
            <span className="text-xs font-bold text-rose-600">{anomalies.length} alert{anomalies.length > 1 ? 's' : ''}</span>
            <div className="flex gap-1">
              {anomalies.slice(0, 2).map((a, i) => (
                <span key={i} title={a.message} className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${a.severity === 'critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                  {a.severity === 'critical' ? '⚠ Critical' : '⚡ Warning'}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Intelligence tab ────────────────────────────────────────────────── */}
      {activeTab === 'intelligence' && <IntelligencePanel />}

      {/* ── Checkout tab ────────────────────────────────────────────────────── */}
      {activeTab === 'checkout' && (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 min-h-0">

          {/* Left: Products */}
          <div className="xl:col-span-3 flex flex-col gap-3 min-h-0">

            {/* Search bar */}
            <div className="bg-white rounded-2xl border border-slate-100 p-3 flex items-center gap-3">
              <div className="flex-1 relative">
                <i className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${aiMode ? 'ri-sparkling-2-line text-[#EC0118]' : 'ri-search-line text-slate-400'}`} />
                {isSearching && <i className="ri-loader-4-line animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-[#EC0118] text-sm" />}
                <input
                  ref={searchInputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={aiMode ? 'Try: "Samsung under 5000" or "Apple phone"…' : 'Search by name…'}
                  className="w-full bg-slate-50 rounded-xl pl-9 pr-9 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[rgba(236,1,24,0.2)]"
                  autoFocus
                />
              </div>
              <button
                onClick={() => { setAiMode(!aiMode); setQuery(''); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${aiMode ? 'bg-[#EC0118] text-white' : 'bg-slate-100 text-slate-600 hover:bg-[rgba(236,1,24,0.06)] hover:text-[#EC0118]'}`}
              >
                <i className="ri-sparkling-2-line" />AI Search
              </button>
            </div>

            {/* Category pills / AI hints */}
            {!aiMode ? (
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${category === cat ? 'bg-[#EC0118] text-white' : 'bg-white text-slate-500 border border-slate-200 hover:border-[#EC0118] hover:text-[#EC0118]'}`}
                  >{cat}</button>
                ))}
              </div>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {['phones under 5000', 'Apple accessories', 'Samsung watch', 'between 1000 and 3000'].map(hint => (
                  <button key={hint} onClick={() => setQuery(hint)}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-[rgba(236,1,24,0.06)] text-[#EC0118] border border-[rgba(236,1,24,0.15)] hover:bg-[rgba(236,1,24,0.1)] cursor-pointer"
                  >{hint}</button>
                ))}
              </div>
            )}

            {/* Anomaly alerts inline */}
            {anomalies.filter(a => a.severity === 'critical').map((a, i) => (
              <div key={i} className="bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-rose-700">
                <i className="ri-alarm-warning-fill text-rose-500 flex-shrink-0" />
                <span>{a.message}</span>
              </div>
            ))}

            {/* Product grid */}
            <div className="flex-1 overflow-y-auto">
              {displayedProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <i className="ri-search-eye-line text-4xl mb-2" />
                  <p className="text-sm font-medium">No products match "{query}"</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {displayedProducts.map(p => {
                    const qty = inCart(p.id);
                    const mgn = margin(p.price, p.cost);
                    const m = productMetrics.find(x => x.productId === p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => p.stock > 0 && addToCart(p)}
                        disabled={p.stock === 0}
                        className={`group relative bg-white rounded-2xl border p-3 flex flex-col gap-3 text-left transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${qty > 0 ? 'border-[#EC0118] ring-2 ring-[#EC0118]/20' : 'border-slate-100 hover:border-slate-300 hover:shadow-sm'}`}
                      >
                        <VelocityBadge productId={p.id} />
                        {qty > 0 && (
                          <span className="absolute top-2 right-2 bg-[#EC0118] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{qty}</span>
                        )}
                        <div className="w-full mt-8">
                          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 mb-2">
                            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">{p.brand}</p>
                            <p className="text-[11px] font-semibold text-slate-800 leading-tight mt-1 line-clamp-2">{p.name}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-slate-900">{formatGHS(p.price)}</p>
                            <span className={`text-[10px] font-bold ${marginColor(mgn)}`}>{mgn}%</span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <p className="text-[10px] text-slate-400">{p.category} · Stock: {p.stock}</p>
                            {m && m.daysOfStock < 7 && m.daysOfStock > 0 && (
                              <span className="text-[9px] bg-rose-50 text-rose-600 px-1 py-0.5 rounded-full font-semibold">{m.daysOfStock}d left</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent sales */}
            <div className="bg-white rounded-2xl border border-slate-100 p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Today's Sales</p>
              {todaySales.length === 0 ? (
                <p className="text-[11px] text-slate-400 text-center py-3">No sales yet today</p>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {todaySales.map(s => (
                    <div key={s.id} className="flex-shrink-0 bg-slate-50 rounded-xl px-3 py-2 min-w-[160px]">
                      <p className="text-xs font-semibold text-slate-800 truncate">{s.customer}</p>
                      <p className="text-[10px] text-slate-500 truncate">{s.items}</p>
                      <span className="text-xs font-bold text-[#EC0118]">{s.total}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Customer + Cart + Payment */}
          <div className="xl:col-span-2 flex flex-col gap-3 min-h-0 overflow-y-auto">

            {/* Customer lookup */}
            <div className="bg-white rounded-2xl border border-slate-100 p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Customer</p>
              {customer ? (
                <div>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#EC0118]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-[#EC0118]">{customer.name[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800">{customer.name}</p>
                        {customer.tags.map(t => (
                          <span key={t} className="text-[9px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded-full font-bold">{t}</span>
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-500">{customer.phone}</p>
                      <div className="flex gap-3 mt-1 text-[10px] text-slate-500">
                        <span><i className="ri-vip-crown-line text-amber-500 mr-0.5" />{customer.loyaltyPoints} pts</span>
                        <span><i className="ri-shopping-bag-3-line text-[#EC0118] mr-0.5" />{customer.purchaseCount} orders</span>
                        {customer.openRepairs > 0 && <span className="text-rose-500"><i className="ri-tools-line mr-0.5" />{customer.openRepairs} repair</span>}
                      </div>
                      {loyaltyDiscount > 0 && (
                        <div className="mt-1.5 text-[10px] bg-amber-50 text-amber-700 px-2 py-1 rounded-lg font-medium">
                          <i className="ri-gift-line mr-1" />Loyalty discount: –{formatGHS(loyaltyDiscount)}
                        </div>
                      )}
                    </div>
                    <button onClick={() => { setCustomer(null); setCustomerQuery(''); }} className="text-slate-300 hover:text-slate-500 cursor-pointer"><i className="ri-close-line" /></button>
                  </div>
                  {/* AI customer intelligence */}
                  {customerCI && (
                    <div className="mt-2 bg-[rgba(236,1,24,0.05)] rounded-xl p-2.5 space-y-1">
                      <p className="text-[9px] font-bold text-[#EC0118] uppercase tracking-wider"><i className="ri-sparkling-2-line mr-0.5" />AI Insight</p>
                      <p className="text-[10px] text-slate-700"><span className="font-semibold">Next buy:</span> {customerCI.predictedNextPurchase}</p>
                      <p className="text-[10px] text-slate-700"><span className="font-semibold">Offer:</span> {customerCI.recommendedOffer}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: i < Math.round(customerCI.vipScore / 20) ? '#F59E0B' : '#e2e8f0' }} />)}</div>
                        <span className="text-[9px] text-[#EC0118] font-semibold">VIP {customerCI.vipScore}/100</span>
                        <span className={`text-[9px] font-bold ml-auto px-1.5 py-0.5 rounded-full ${customerCI.churnRisk === 'low' ? 'bg-emerald-100 text-emerald-700' : customerCI.churnRisk === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                          {customerCI.churnRisk === 'low' ? 'Loyal' : customerCI.churnRisk === 'medium' ? 'At risk' : 'Churning'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <i className="ri-user-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                      <input
                        value={customerQuery}
                        onChange={e => setCustomerQuery(e.target.value)}
                        placeholder="Search by name or phone…"
                        className="w-full bg-slate-50 rounded-xl pl-9 pr-3 py-2 text-sm placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#EC0118]/30"
                      />
                    </div>
                    <button
                      onClick={() => setShowAddCustomer(true)}
                      className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-[#EC0118] text-white cursor-pointer hover:opacity-90"
                      title="Add new customer"
                    >
                      <i className="ri-user-add-line text-sm" />
                    </button>
                  </div>
                  {(customerSuggestions.length > 0 || customerQuery.trim().length > 1) && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
                      {customerSuggestions.map(c => (
                        <button key={c.id} onClick={() => { setCustomer(c); setCustomerQuery(''); setCustomerSuggestions([]); }} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer text-left">
                          <div className="w-7 h-7 rounded-full bg-[#EC0118]/10 flex items-center justify-center text-xs font-bold text-[#EC0118]">{c.name[0]}</div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800">{c.name}</p>
                            <p className="text-[10px] text-slate-400">{c.phone} · {c.loyaltyPoints} pts</p>
                          </div>
                        </button>
                      ))}
                      {customerSuggestions.length === 0 && customerQuery.trim().length > 1 && (
                        <div className="px-3 py-2 text-[11px] text-slate-400">No match found</div>
                      )}
                      <button
                        onClick={() => { setCustomerSuggestions([]); setShowAddCustomer(true); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 border-t border-slate-100 hover:bg-slate-50 cursor-pointer text-left"
                      >
                        <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <i className="ri-user-add-line text-emerald-600 text-xs" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-emerald-700">Add new customer</p>
                          {customerQuery.trim() && <p className="text-[10px] text-slate-400">"{customerQuery.trim()}"</p>}
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cart */}
            <div className="bg-white rounded-2xl border border-slate-100 p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cart ({cart.length})</p>
                {cart.length > 0 && <button onClick={() => setCart([])} className="text-[10px] text-rose-400 hover:text-rose-600 cursor-pointer">Clear all</button>}
              </div>
              {cart.length === 0 ? (
                <div className="py-8 flex flex-col items-center text-slate-300 gap-2">
                  <i className="ri-shopping-cart-line text-3xl" />
                  <p className="text-xs">Tap a product to add it</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cartLines.map(item => {
                    const effectiveMargin = margin(item.product.price * (1 - item.discount / 100), item.product.cost);
                    return (
                      <div key={item.product.id} className="bg-slate-50 rounded-xl p-2.5">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 leading-tight truncate">{item.product.name}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-[10px] text-slate-500">{formatGHS(item.product.price)}</span>
                              <span className={`text-[10px] font-bold ${marginColor(effectiveMargin)}`}>{effectiveMargin}% margin</span>
                            </div>
                          </div>
                          <button onClick={() => removeFromCart(item.product.id)} className="text-slate-300 hover:text-rose-400 cursor-pointer"><i className="ri-close-line text-sm" /></button>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1">
                            <button onClick={() => updateQty(item.product.id, item.qty - 1)} className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs hover:bg-slate-100 cursor-pointer">−</button>
                            <span className="text-sm font-semibold w-6 text-center">{item.qty}</span>
                            <button onClick={() => updateQty(item.product.id, item.qty + 1)} className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs hover:bg-slate-100 cursor-pointer">+</button>
                          </div>
                          <div className="flex items-center gap-1 flex-1">
                            <i className="ri-percent-line text-slate-400 text-xs" />
                            <input type="number" min={0} max={30} value={item.discount || ''} onChange={e => updateItemDiscount(item.product.id, Number(e.target.value))} placeholder="0" className="w-12 bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 text-xs text-center outline-none" />
                            <span className="text-[10px] text-slate-400">%</span>
                          </div>
                          <span className="text-sm font-bold text-slate-900 ml-auto">{formatGHS(item.linePrice)}</span>
                        </div>
                        {item.product.imei && (
                          <input type="text" value={item.imeiEntered || ''} onChange={e => setCart(prev => prev.map(i => i.product.id === item.product.id ? { ...i, imeiEntered: e.target.value } : i))} placeholder="IMEI (15 digits)" maxLength={15} className="mt-1.5 w-full bg-white border border-dashed border-slate-200 rounded-lg px-2 py-1 text-[10px] font-mono placeholder-slate-300 outline-none" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* AI Upsell */}
            {upsells.length > 0 && (
              <div className="bg-[rgba(236,1,24,0.05)] rounded-2xl border border-[rgba(236,1,24,0.12)] p-3">
                <p className="text-[10px] font-bold text-[#EC0118] uppercase tracking-wider mb-2"><i className="ri-sparkling-2-line mr-1" />AI Suggests</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {upsells.map(p => (
                    <button key={p.id} onClick={() => addToCart(p)} className="flex-shrink-0 bg-white rounded-xl p-2.5 flex flex-col gap-1.5 w-36 border border-[rgba(236,1,24,0.12)] hover:border-[rgba(236,1,24,0.3)] transition-all cursor-pointer text-left">
                      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">{p.category}</p>
                      <p className="text-[10px] font-semibold text-slate-700 line-clamp-2 leading-tight">{p.name}</p>
                      <p className="text-[10px] font-bold text-[#EC0118]">{formatGHS(p.price)}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trade-in */}
            {!tradeIn && !showTradeIn && (
              <button onClick={() => setShowTradeIn(true)} className="bg-white rounded-2xl border border-dashed border-slate-200 p-3 flex items-center gap-2 text-slate-500 hover:border-[#EC0118] hover:text-[#EC0118] transition-all cursor-pointer text-xs font-medium">
                <i className="ri-exchange-line" />Add Trade-In Device
              </button>
            )}
            {tradeIn && (
              <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-3 flex items-center gap-3">
                <i className="ri-exchange-line text-emerald-600 text-lg" />
                <div className="flex-1"><p className="text-xs font-semibold text-emerald-800">{tradeIn.device}</p><p className="text-[10px] text-emerald-600">{tradeIn.condition}</p></div>
                <span className="text-sm font-bold text-emerald-700">–{formatGHS(tradeIn.value)}</span>
                <button onClick={() => setTradeIn(null)} className="text-emerald-400 hover:text-emerald-600 cursor-pointer"><i className="ri-close-line" /></button>
              </div>
            )}
            {showTradeIn && !tradeIn && (
              <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
                <p className="text-xs font-bold text-slate-700">Trade-In Valuation</p>
                <select value={tradeInDevice} onChange={e => setTradeInDevice(e.target.value)} className="w-full bg-slate-50 rounded-xl px-3 py-2 text-sm outline-none border border-slate-200">
                  <option value="">Select device…</option>
                  {tradeInDevices.map(d => <option key={d.id} value={d.id}>{d.name} (base: {formatGHS(d.baseValue)})</option>)}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  {tradeInConditions.map(c => (
                    <button key={c.id} onClick={() => setTradeInCondition(c.id)} className={`px-2 py-2 rounded-xl text-xs font-semibold text-left border transition-all cursor-pointer ${tradeInCondition === c.id ? 'bg-[#EC0118] text-white border-[#EC0118]' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{c.label}</button>
                  ))}
                </div>
                {tradeInEstimate !== null && (
                  <div className="bg-emerald-50 rounded-xl px-3 py-2 flex items-center justify-between">
                    <span className="text-xs text-emerald-700 font-medium">AI Estimated Value</span>
                    <span className="text-base font-bold text-emerald-700">{formatGHS(tradeInEstimate)}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => setShowTradeIn(false)} className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-500 cursor-pointer hover:bg-slate-50">Cancel</button>
                  <button onClick={applyTradeIn} disabled={!tradeInDevice || !tradeInCondition} className="flex-1 px-3 py-2 rounded-xl bg-[#EC0118] text-white text-xs font-semibold disabled:opacity-50 cursor-pointer">Apply</button>
                </div>
              </div>
            )}

            {/* Order summary */}
            {cart.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-3 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Summary</p>
                <div className="flex items-center gap-2">
                  <i className="ri-percent-line text-slate-400 text-xs" />
                  <input type="number" min={0} max={30} value={orderDiscount || ''} onChange={e => setOrderDiscount(Math.min(30, Number(e.target.value)))} placeholder="0" className="w-14 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-center outline-none" />
                  <span className="text-xs text-slate-500">% order discount</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{formatGHS(subtotal)}</span></div>
                  {orderDiscountAmt > 0 && <div className="flex justify-between text-rose-500"><span>Order discount ({orderDiscount}%)</span><span>–{formatGHS(orderDiscountAmt)}</span></div>}
                  {tradeInValue > 0 && <div className="flex justify-between text-emerald-600"><span>Trade-in credit</span><span>–{formatGHS(tradeInValue)}</span></div>}
                  {loyaltyDiscount > 0 && <div className="flex justify-between text-amber-600"><span>Loyalty discount</span><span>–{formatGHS(loyaltyDiscount)}</span></div>}
                  {plan.rate > 0 && <div className="flex justify-between text-slate-500"><span>Installment fee ({Math.round(plan.rate * 100)}%)</span><span>+{formatGHS(netBeforePlan * plan.rate)}</span></div>}
                  <div className="border-t border-slate-100 pt-1 flex justify-between font-bold text-slate-900 text-sm"><span>Total</span><span>{formatGHS(totalWithPlan)}</span></div>
                  {plan.months > 0 && <div className="text-center text-[10px] text-slate-600 bg-slate-50 rounded-lg py-1">{formatGHS(monthlyInstallment)} / month × {plan.months} months</div>}
                </div>
              </div>
            )}

            {/* Installment plans */}
            {cart.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-3 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Plan</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {installmentPlans.map(pl => (
                    <button key={pl.id} onClick={() => setSelectedPlan(pl.id)} className={`py-2 rounded-xl text-[10px] font-semibold border transition-all cursor-pointer text-center ${selectedPlan === pl.id ? 'bg-[#EC0118] text-white border-[#EC0118]' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{pl.label}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Payment method */}
            {cart.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-3 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Method</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {([
                    { id: 'momo', label: 'MoMo', icon: 'ri-smartphone-line', color: '#FFCC00', textColor: '#78350f' },
                    { id: 'cash', label: 'Cash', icon: 'ri-money-cny-circle-line', color: '#22c55e', textColor: 'white' },
                    { id: 'card', label: 'Card', icon: 'ri-bank-card-line', color: '#3b82f6', textColor: 'white' },
                    { id: 'split', label: 'Split', icon: 'ri-split-cells-horizontal', color: '#8b5cf6', textColor: 'white' },
                  ] as const).map(m => (
                    <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                      className={`py-2 rounded-xl text-[10px] font-semibold border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${paymentMethod === m.id ? 'border-transparent' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                      style={paymentMethod === m.id ? { background: m.color, color: m.textColor } : {}}
                    >
                      <i className={`${m.icon} text-sm`} />{m.label}
                    </button>
                  ))}
                </div>
                {paymentMethod === 'momo' && (
                  <div className="relative">
                    <i className="ri-smartphone-line absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 text-sm" />
                    <input value={momoNumber} onChange={e => setMomoNumber(e.target.value)} placeholder="MoMo number (e.g. 0244123456)" className="w-full bg-slate-50 rounded-xl pl-9 pr-3 py-2.5 text-sm placeholder-slate-400 outline-none border border-slate-200 focus:border-amber-300" />
                  </div>
                )}
                {paymentMethod === 'split' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <i className="ri-money-cny-circle-line text-emerald-500 text-sm" />
                      <input type="number" value={splitCash} onChange={e => setSplitCash(e.target.value)} placeholder="Cash amount" className="flex-1 bg-slate-50 rounded-xl px-3 py-2 text-sm placeholder-slate-400 outline-none border border-slate-200" />
                    </div>
                    {splitCash && Number(splitCash) < totalWithPlan && (
                      <p className="text-[10px] text-slate-500 text-right">MoMo remainder: <span className="font-semibold text-amber-600">{formatGHS(totalWithPlan - Number(splitCash))}</span></p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Complete sale */}
            {cart.length > 0 && !hasCustomer && (
              <p className="text-[11px] text-center text-amber-600 font-medium bg-amber-50 rounded-xl py-2 px-3">
                <i className="ri-user-line mr-1" />
                Add a customer name before completing the sale
              </p>
            )}
            <button
              onClick={completeSale}
              disabled={cart.length === 0 || !hasCustomer}
              className="w-full py-4 rounded-2xl text-white font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all hover:opacity-90 flex items-center justify-center gap-2"
              style={{ background: cart.length === 0 || !hasCustomer ? '#94a3b8' : 'linear-gradient(135deg, #EC0118 0%, #BD0113 100%)' }}
            >
              <i className="ri-checkbox-circle-line text-lg" />
              Complete Sale · {formatGHS(totalWithPlan)}
            </button>
          </div>
        </div>
      )}

      {/* AI Receipt */}
      {showReceipt && completedSale && (
        <AiReceiptModal
          cart={completedSale.cart}
          customer={completedSale.customer}
          total={completedSale.total}
          tradeIn={completedSale.tradeIn}
          paymentMethod={completedSale.method}
          plan={completedSale.plan}
          onNewSale={newSale}
        />
      )}

      {showAddCustomer && (
        <AddCustomerModal
          onClose={() => setShowAddCustomer(false)}
          onSave={async (c) => {
            const created = await addCustomer(c);
            setCustomer(mapToPosCustomer(created));
            setCustomerQuery('');
            setShowAddCustomer(false);
          }}
        />
      )}

      {/* Floating AI Chat */}
      <AiChat />
    </AdminLayout>
  );
}
