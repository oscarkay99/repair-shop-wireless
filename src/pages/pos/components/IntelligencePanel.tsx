import { useLearnedPatterns } from '@/hooks/useLearnedPatterns';
import { posProducts } from '@/mocks/pos';
import { productMetrics as mockMetrics } from '@/mocks/posIntelligence';
import type { ProductMetrics } from '@/mocks/posIntelligence';

function formatGHS(n: number) {
  return `GHS ${n.toLocaleString('en-GH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function VelocityBadge({ v }: { v: ProductMetrics['velocity'] }) {
  const cfg = {
    hot:    { label: '🔥 Hot',    cls: 'bg-rose-50 text-rose-600 border-rose-200' },
    steady: { label: '📈 Steady', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    slow:   { label: '🐢 Slow',   cls: 'bg-amber-50 text-amber-600 border-amber-200' },
    new:    { label: '✨ New',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  }[v];
  return <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${cfg.cls}`}>{cfg.label}</span>;
}

function TrendIcon({ t }: { t: ProductMetrics['trend'] }) {
  if (t === 'up')   return <i className="ri-arrow-up-line text-emerald-500 text-xs" />;
  if (t === 'down') return <i className="ri-arrow-down-line text-rose-500 text-xs" />;
  return <i className="ri-subtract-line text-slate-400 text-xs" />;
}

function DataSourceBanner({ hasRealData, transactionCount, lastUpdated, isLoading }: {
  hasRealData: boolean; transactionCount: number; lastUpdated: string | null; isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="lg:col-span-2 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs"
        style={{ background: 'rgba(7,16,31,0.05)', border: '1px solid rgba(7,16,31,0.1)', color: '#1E5FBE' }}>
        <div className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin flex-shrink-0" style={{ borderColor: '#2463BE', borderTopColor: 'transparent' }} />
        Loading learned patterns from your transaction history…
      </div>
    );
  }
  if (hasRealData) {
    const updated = lastUpdated ? new Date(lastUpdated).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
    return (
      <div className="lg:col-span-2 flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs"
        style={{ background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.2)', color: '#059669' }}>
        <i className="ri-brain-line flex-shrink-0" />
        <span>
          <strong>Live ML data</strong>: patterns learned from <strong>{transactionCount.toLocaleString()}</strong> real transactions.
          {updated && <span className="opacity-70"> Last updated {updated}.</span>}
        </span>
        <span className="ml-auto opacity-60 font-medium">Run <code className="bg-emerald-100 px-1 rounded">learn-patterns</code> to refresh</span>
      </div>
    );
  }
  return (
    <div className="lg:col-span-2 flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-amber-200 bg-amber-50 text-amber-700 text-xs">
      <i className="ri-database-2-line flex-shrink-0" />
      <span>
        Showing <strong>demo data</strong>. Complete your first sales at POS and run <code className="bg-amber-100 px-1 rounded">learn-patterns</code> to activate real ML patterns.
      </span>
    </div>
  );
}

export default function IntelligencePanel() {
  const { productMetrics, bundleInsights, customerIntelligence, peakHours,
          aiInsights, hasRealData, transactionCount, lastUpdated, isLoading } = useLearnedPatterns();

  const metrics = [...productMetrics].sort((a, b) => b.revenue30d - a.revenue30d);
  const reorderAlerts = metrics.filter(m => m.reorderAlert);
  const slowMovers    = metrics.filter(m => m.velocity === 'slow' && m.daysOfStock > 30).slice(0, 4);
  const topSellers    = metrics.slice(0, 5);

  const visibleHours  = peakHours.filter(h => h.hour >= 8 && h.hour <= 20);
  const maxHourRev    = Math.max(...visibleHours.map(h => h.revenue), 1);
  const peakHour      = visibleHours.reduce((a, b) => b.transactions > a.transactions ? b : a, visibleHours[0]);

  // For forecast: use real metrics where available, fall back to mock for price lookup
  const forecastItems = (hasRealData ? productMetrics : mockMetrics)
    .filter(m => m.velocity === 'hot' || m.trend === 'up')
    .slice(0, 4);

  const insightTypeStyle = {
    opportunity: { icon: 'ri-lightbulb-flash-line', color: '#059669', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
    warning:     { icon: 'ri-alert-line',            color: '#D97706', bg: 'rgba(217,119,6,0.08)',  border: 'rgba(217,119,6,0.2)' },
    trend:       { icon: 'ri-line-chart-line',        color: '#1E5FBE', bg: 'rgba(236,1,24,0.08)',  border: 'rgba(7,16,31,0.15)' },
  };

  const cardStyle = {
    background: 'white',
    border: '1px solid rgba(7,16,31,0.07)',
    boxShadow: '0 1px 3px rgba(7,16,31,0.04), 0 6px 24px rgba(236,1,24,0.08)',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-y-auto pb-4">

      {/* ── Data source indicator ──────────────────────────────────────────── */}
      <DataSourceBanner hasRealData={hasRealData} transactionCount={transactionCount} lastUpdated={lastUpdated} isLoading={isLoading} />

      {/* ── AI weekly insights (only when real data available) ─────────────── */}
      {aiInsights.length > 0 && (
        <div className="lg:col-span-2 rounded-2xl p-4" style={cardStyle}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: 'rgba(10,31,74,0.4)' }}>
            <i className="ri-sparkling-2-line mr-1" style={{ color: '#F59E0B' }} />Weekly AI Insights
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {aiInsights.slice(0, 3).map(ins => {
              const s = insightTypeStyle[ins.insight_type] ?? insightTypeStyle.trend;
              return (
                <div key={ins.id} className="rounded-xl p-3" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <i className={`${s.icon} text-sm`} style={{ color: s.color }} />
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: s.color }}>
                      {ins.insight_type}
                    </span>
                  </div>
                  {ins.title && <p className="text-xs font-bold text-slate-800 mb-0.5">{ins.title}</p>}
                  <p className="text-[11px] text-slate-600 leading-relaxed">{ins.content}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Top performers ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-4" style={cardStyle}>
        <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: 'rgba(10,31,74,0.4)' }}>
          <i className="ri-bar-chart-fill mr-1" style={{ color: '#F59E0B' }} />Top Performers · 30 Days
        </p>
        <div className="space-y-2">
          {topSellers.map((m, i) => {
            const product = posProducts.find(p => p.id === m.productId);
            if (!product) return null;
            const barWidth = Math.round((m.revenue30d / (metrics[0]?.revenue30d ?? 1)) * 100);
            return (
              <div key={m.productId}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold w-4" style={{ color: 'rgba(10,31,74,0.3)' }}>{i + 1}</span>
                  <p className="flex-1 text-xs font-semibold text-slate-800 truncate">{product.name}</p>
                  <VelocityBadge v={m.velocity} />
                  <TrendIcon t={m.trend} />
                  <span className="text-xs font-bold text-slate-700">{formatGHS(m.revenue30d)}</span>
                </div>
                <div className="ml-6 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(236,1,24,0.08)' }}>
                  <div className="h-full rounded-full" style={{ width: `${barWidth}%`, background: 'linear-gradient(90deg, #0F172A, #2463BE)' }} />
                </div>
                <div className="ml-6 flex gap-3 mt-0.5 text-[9px]" style={{ color: 'rgba(10,31,74,0.38)' }}>
                  <span>{m.unitsSold30d} units</span>
                  <span>{formatGHS(m.profit30d)} profit</span>
                  <span>{m.daysOfStock < 999 ? `${m.daysOfStock}d stock` : 'Ample stock'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Reorder alerts + slow movers ──────────────────────────────────── */}
      <div className="space-y-4">
        {reorderAlerts.length > 0 && (
          <div className="rounded-2xl border border-rose-200 p-4" style={{ background: '#FFF5F5' }}>
            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-2">
              <i className="ri-alarm-warning-line mr-1" />Reorder Alerts
            </p>
            <div className="space-y-2">
              {reorderAlerts.map(m => {
                const product = posProducts.find(p => p.id === m.productId);
                if (!product) return null;
                return (
                  <div key={m.productId} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2">
                    <i className="ri-error-warning-fill text-rose-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{product.name}</p>
                      <p className="text-[10px] text-rose-500">{m.daysOfStock}d of stock · {m.unitsSold30d} sold/30d</p>
                    </div>
                    <span className="text-[10px] font-bold bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full flex-shrink-0">Reorder</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-amber-200 p-4" style={{ background: '#FFFBEB' }}>
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2">
            <i className="ri-snail-line mr-1" />Slow Movers, Consider Promotion
          </p>
          {slowMovers.length === 0 ? (
            <p className="text-xs text-amber-600 flex items-center gap-1.5">
              <i className="ri-checkbox-circle-line" />All products moving well
            </p>
          ) : (
            <div className="space-y-2">
              {slowMovers.map(m => {
                const product = posProducts.find(p => p.id === m.productId);
                if (!product) return null;
                return (
                  <div key={m.productId} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2">
                    <i className="ri-time-line text-amber-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{product.name}</p>
                      <p className="text-[10px] text-amber-600">{m.unitsSold30d} units/30d · {m.daysOfStock}d stock</p>
                    </div>
                    <span className="text-[10px] text-amber-600 font-bold flex-shrink-0">{m.sellThrough}% sell-thru</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Peak hours ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-4" style={cardStyle}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(10,31,74,0.4)' }}>
            <i className="ri-time-line mr-1" style={{ color: '#F59E0B' }} />
            Peak Hours {hasRealData ? '(Real Data)' : '(30 Day Avg)'}
          </p>
          {peakHour && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(245,166,35,0.12)', color: '#B8860B' }}>
              Peak: {peakHour.hour}:00
            </span>
          )}
        </div>
        <div className="flex items-end gap-1 h-20">
          {visibleHours.map(h => {
            const height = Math.max(Math.round((h.revenue / maxHourRev) * 100), 3);
            const isTop = peakHour && h.hour === peakHour.hour;
            return (
              <div key={h.hour} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                <div
                  className="w-full rounded-t-md transition-all"
                  style={{
                    height: `${height}%`, minHeight: 2,
                    background: isTop
                      ? 'linear-gradient(180deg, #F59E0B, #D97706)'
                      : 'rgba(7,16,31,0.1)',
                  }}
                />
                <span className="text-[8px]" style={{ color: 'rgba(10,31,74,0.35)' }}>{h.hour}</span>
                <div className="absolute bottom-full mb-1 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                  {h.transactions} sales · {formatGHS(h.revenue)}
                </div>
              </div>
            );
          })}
        </div>
        {peakHour && (
          <p className="text-[10px] mt-2 text-center" style={{ color: 'rgba(10,31,74,0.4)' }}>
            Best promo window: <span className="font-semibold" style={{ color: '#1E5FBE' }}>{peakHour.hour}:00 – {peakHour.hour + 2}:00</span>
          </p>
        )}
      </div>

      {/* ── Frequently bought together ─────────────────────────────────────── */}
      <div className="rounded-2xl p-4" style={cardStyle}>
        <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: 'rgba(10,31,74,0.4)' }}>
          <i className="ri-links-line mr-1 text-emerald-500" />Frequently Bought Together
          {hasRealData && <span className="ml-1 text-emerald-500 normal-case font-normal">· from real purchases</span>}
        </p>
        <div className="space-y-2">
          {bundleInsights.slice(0, 5).map((b, i) => {
            const pA = posProducts.find(p => p.id === b.productA);
            const pB = posProducts.find(p => p.id === b.productB);
            const nameA = pA?.name ?? b.productA;
            const nameB = pB?.name ?? b.productB;
            return (
              <div key={i} className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'rgba(7,16,31,0.04)' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 text-xs text-slate-700 font-medium">
                    <span className="truncate">{nameA}</span>
                    <i className="ri-add-line flex-shrink-0" style={{ color: 'rgba(10,31,74,0.3)' }} />
                    <span className="truncate">{nameB}</span>
                  </div>
                  <p className="text-[10px] mt-0.5" style={{ color: 'rgba(10,31,74,0.38)' }}>{b.coOccurrences}× co-purchased</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] font-bold text-emerald-600">{b.liftScore}x lift</p>
                  <p className="text-[9px]" style={{ color: 'rgba(10,31,74,0.35)' }}>correlation</p>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] mt-3 rounded-lg px-2 py-1.5 text-center" style={{ background: 'rgba(16,185,129,0.08)', color: '#059669' }}>
          <i className="ri-lightbulb-line mr-1" />
          Suggest these combos at checkout for +18% avg order value
        </p>
      </div>

      {/* ── Customer intelligence ──────────────────────────────────────────── */}
      <div className="lg:col-span-2 rounded-2xl p-4" style={cardStyle}>
        <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: 'rgba(10,31,74,0.4)' }}>
          <i className="ri-user-star-line mr-1 text-amber-500" />Customer Intelligence
          {hasRealData && <span className="ml-1 text-amber-500 normal-case font-normal">· learned from purchase history</span>}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {[...customerIntelligence].sort((a, b) => b.vipScore - a.vipScore).map(ci => {
            const names: Record<string, string> = {
              c1: 'Kwame Asante', c2: 'Ama Owusu', c3: 'Kofi Mensah',
              c4: 'Abena Frimpong', c5: 'Yaw Darko',
            };
            const name = names[ci.customerId] ?? ci.customerId;
            const initials = name.split(' ').map(n => n[0]).join('');
            const churnCfg = {
              low:    { label: 'Loyal',    cls: 'text-emerald-600 bg-emerald-50' },
              medium: { label: 'At risk',  cls: 'text-amber-600 bg-amber-50' },
              high:   { label: 'Churning', cls: 'text-rose-600 bg-rose-50' },
            }[ci.churnRisk] ?? { label: ci.churnRisk, cls: 'text-slate-500 bg-slate-50' };
            return (
              <div key={ci.customerId} className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(7,16,31,0.04)', border: '1px solid rgba(7,16,31,0.07)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                    style={{ background: 'rgba(245,166,35,0.15)', color: '#B8860B' }}>
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full" style={{
                          background: i < Math.round(ci.vipScore / 20) ? '#F59E0B' : 'rgba(10,31,74,0.1)',
                        }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between"><span style={{ color: 'rgba(10,31,74,0.4)' }}>Spent</span><span className="font-semibold">{formatGHS(ci.totalSpent)}</span></div>
                  <div className="flex justify-between"><span style={{ color: 'rgba(10,31,74,0.4)' }}>Orders</span><span className="font-semibold">{ci.orderCount}</span></div>
                  <div className="flex justify-between"><span style={{ color: 'rgba(10,31,74,0.4)' }}>Last visit</span><span className="font-semibold">{ci.daysSinceLastPurchase}d ago</span></div>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${churnCfg.cls}`}>{churnCfg.label}</span>
                <p className="text-[9px] rounded-lg px-1.5 py-1 leading-relaxed" style={{ background: 'rgba(245,166,35,0.1)', color: '#B8860B' }}>
                  <i className="ri-sparkling-2-line mr-0.5" />{ci.predictedNextPurchase}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Demand forecast ────────────────────────────────────────────────── */}
      <div className="lg:col-span-2 rounded-2xl p-4 text-white"
        style={{ background: 'linear-gradient(135deg, #0F172A 0%, #EC0118 50%, #06B6D4 100%)' }}>
        <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-3">
          <i className="ri-sparkling-2-line mr-1 text-amber-400" />
          AI Demand Forecast · Next 7 Days
          {hasRealData && <span className="ml-1 text-amber-400/70 normal-case font-normal">· EMA model, trained on {transactionCount} transactions</span>}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {forecastItems.map(m => {
            const product = posProducts.find(p => p.id === m.productId);
            if (!product) return null;
            const forecastUnits = Math.round(m.avgDailySales * 7 * 1.1);
            const forecastRevenue = forecastUnits * product.price;
            return (
              <div key={m.productId} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <p className="text-xs font-semibold text-white truncate mb-1">{product.name}</p>
                <p className="text-2xl font-black text-white figure">{forecastUnits}</p>
                <p className="text-[10px] text-white/50">units expected</p>
                <p className="text-[10px] font-semibold mt-1" style={{ color: '#F59E0B' }}>{formatGHS(forecastRevenue)}</p>
                <div className={`text-[9px] mt-1.5 px-1.5 py-0.5 rounded-full inline-block ${
                  m.trend === 'up' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/60'
                }`}>
                  {m.trend === 'up' ? '↑ Trending up' : '→ Steady'}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-white/35 mt-3">
          {hasRealData
            ? `EMA(α=0.3) on ${transactionCount} real transactions · Updated nightly by learn-patterns edge function`
            : 'Demo forecast · Complete sales at POS to activate real ML predictions'}
        </p>
      </div>

    </div>
  );
}
