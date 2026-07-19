import { useMemo } from 'react';
import { useRepairs } from '@/hooks/useRepairs';
import { useInventory } from '@/hooks/useInventory';
import { useExpenses } from '@/hooks/useExpenses';
import { useCustomers } from '@/hooks/useCustomers';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
  PieChart, Pie, Cell,
} from 'recharts';

const GHS = (n: number) =>
  `₵${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const DONUT_COLORS = ['#EC0118', '#06B6D4', '#F59E0B', '#10B981', '#64748b', '#EF4444', '#F97316'];
const LOW_STOCK_THRESHOLD = 5;

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr);
  const dow = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - dow);
  return start.toISOString().split('T')[0];
}

function weekLabel(isoDate: string): string {
  const d = new Date(isoDate);
  return `Wk ${d.toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })}`;
}

function buildWeeks(): { key: string; label: string }[] {
  const today = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (5 - i) * 7);
    const dow = d.getDay();
    const start = new Date(d);
    start.setDate(d.getDate() - dow);
    const key = start.toISOString().split('T')[0];
    return { key, label: weekLabel(key) };
  });
}

function parsePriceGHS(price: string): number {
  return parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
}

// ── KPI card ──────────────────────────────────────────────────────────────────
function KPICard({
  icon, iconBg, iconColor, value, label, valueColor, badge, badgeBg, badgeColor,
}: {
  icon: string; iconBg: string; iconColor: string;
  value: string; label: string; valueColor?: string;
  badge?: string; badgeBg?: string; badgeColor?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
          <i className={`${icon} text-base`} style={{ color: iconColor }} />
        </div>
        {badge && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full leading-tight"
            style={{ background: badgeBg, color: badgeColor }}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="text-[26px] font-black leading-none" style={{ color: valueColor ?? '#1e293b' }}>
        {value}
      </div>
      <div className="text-xs text-slate-400 mt-1.5">{label}</div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function FinancialOverview() {
  const { repairs } = useRepairs();
  const { products } = useInventory();
  const { expenses } = useExpenses();
  const { customers } = useCustomers();
  const { orders } = usePurchaseOrders();

  const completed = useMemo(() => repairs.filter(r => r.status === 'completed'), [repairs]);

  // ── KPI figures ──
  const totalRevenue = useMemo(
    () => completed.reduce((s, r) => s + (r.costNum ?? 0), 0),
    [completed],
  );
  const totalCosts = useMemo(
    () => expenses.reduce((s, e) => s + (e.amount ?? 0), 0),
    [expenses],
  );
  const netProfit = totalRevenue - totalCosts;
  const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const isProfitable = netProfit >= 0;

  const inventoryValue = useMemo(
    () => products.reduce((s, p) => s + parsePriceGHS(p.price) * p.stock, 0),
    [products],
  );

  // ── Weekly Revenue & Profit chart ──
  const weeklyData = useMemo(() => {
    const weeks = buildWeeks();
    const byWeek: Record<string, number> = {};
    completed.forEach(r => {
      if (!r.completedDate) return;
      const wk = getWeekStart(r.completedDate);
      byWeek[wk] = (byWeek[wk] ?? 0) + (r.costNum ?? 0);
    });
    return weeks.map(w => ({
      label: w.label,
      revenue: byWeek[w.key] ?? 0,
      profit: Math.round((byWeek[w.key] ?? 0) * 0.38),
    }));
  }, [completed]);

  // ── Sales by device type (donut) ──
  const salesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    completed.forEach(r => {
      const cat = r.deviceType ?? 'Other';
      map[cat] = (map[cat] ?? 0) + (r.costNum ?? 0);
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [completed]);

  // ── Inventory value by category ──
  const invByCategory = useMemo(() => {
    const map: Record<string, { units: number; value: number }> = {};
    products.forEach(p => {
      const price = parsePriceGHS(p.price);
      if (!map[p.category]) map[p.category] = { units: 0, value: 0 };
      map[p.category].units += p.stock;
      map[p.category].value += Math.round(price * p.stock);
    });
    return Object.entries(map)
      .sort((a, b) => b[1].value - a[1].value)
      .map(([name, d]) => ({ name, units: d.units, value: d.value }));
  }, [products]);

  // ── Quick stats ──
  const lowStockCount = useMemo(
    () => products.filter(p => p.stock > 0 && p.stock < LOW_STOCK_THRESHOLD).length,
    [products],
  );
  const outOfStockCount = useMemo(
    () => products.filter(p => p.stock === 0).length,
    [products],
  );

  const invChartHeight = Math.max(200, invByCategory.length * 52);

  const tooltipStyle = {
    background: 'white',
    border: '1px solid #f1f5f9',
    borderRadius: 10,
    fontSize: 12,
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  };

  return (
    <div className="space-y-5 mt-8">
      {/* Section divider + header */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-100" />
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 px-1">
          Financial Overview
        </div>
        <div className="flex-1 h-px bg-slate-100" />
      </div>

      {/* ── Row 1: KPI Cards ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon="ri-money-cedi-circle-line"
          iconBg="rgba(236,1,24,0.10)"
          iconColor="#EC0118"
          value={GHS(totalRevenue)}
          label="Revenue"
        />
        <KPICard
          icon="ri-coin-line"
          iconBg="rgba(245,158,11,0.10)"
          iconColor="#F59E0B"
          value={GHS(totalCosts)}
          label="Total Costs"
        />
        <KPICard
          icon={isProfitable ? 'ri-arrow-up-line' : 'ri-arrow-down-line'}
          iconBg={isProfitable ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)'}
          iconColor={isProfitable ? '#10B981' : '#EF4444'}
          value={GHS(Math.abs(netProfit))}
          valueColor={isProfitable ? '#1e293b' : '#EF4444'}
          label={isProfitable ? 'Net Profit' : 'Net Loss'}
          badge={`${margin.toFixed(1)}% margin`}
          badgeBg={isProfitable ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)'}
          badgeColor={isProfitable ? '#10B981' : '#EF4444'}
        />
        <KPICard
          icon="ri-archive-line"
          iconBg="rgba(6,182,212,0.10)"
          iconColor="#06B6D4"
          value={GHS(inventoryValue)}
          label="Inventory Value"
        />
      </div>

      {/* ── Row 2: Revenue/Profit chart + Sales by Category donut ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">

        {/* Revenue & Profit Over Time */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="mb-5">
            <h3 className="text-sm font-bold text-slate-800">Revenue & Profit Over Time</h3>
            <p className="text-xs text-slate-400 mt-0.5">All Time</p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weeklyData} barCategoryGap="32%" barGap={3}>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                width={52}
                tickFormatter={(v: number) => `₵${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, name: string) => [GHS(v), name === 'profit' ? 'Profit' : 'Revenue']}
              />
              <Legend iconType="circle" iconSize={8} formatter={(v: string) => (
                <span style={{ fontSize: 11, color: '#64748b' }}>{v === 'profit' ? 'Profit' : 'Revenue'}</span>
              )} />
              <Bar dataKey="profit" name="profit" fill="#10B981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="revenue" name="revenue" fill="#EC0118" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sales by Category */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-800">Sales by Category</h3>
            <p className="text-xs text-slate-400 mt-0.5">All Time</p>
          </div>

          {salesByCategory.length > 0 ? (
            <>
              <div className="flex justify-center my-2">
                <PieChart width={164} height={164}>
                  <Pie
                    data={salesByCategory}
                    cx={78}
                    cy={78}
                    innerRadius={46}
                    outerRadius={76}
                    dataKey="value"
                    stroke="none"
                    paddingAngle={2}
                  >
                    {salesByCategory.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </div>
              <div className="space-y-2.5 mt-2">
                {salesByCategory.slice(0, 6).map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
                    />
                    <span className="text-xs text-slate-600 flex-1 truncate">{d.name}</span>
                    <span className="text-xs font-bold text-slate-800">{GHS(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400">
              <i className="ri-pie-chart-2-line text-3xl opacity-30" />
              <p className="text-xs">No completed repairs yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3: Inventory by Category + Profit Trend ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Inventory Value by Category */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-800">Inventory Value by Category</h3>
            <p className="text-xs text-slate-400 mt-0.5">Current stock value across categories</p>
          </div>
          <ResponsiveContainer width="100%" height={invChartHeight}>
            <BarChart data={invByCategory} layout="vertical" barCategoryGap="28%" barGap={2}>
              <CartesianGrid horizontal={false} stroke="#f1f5f9" />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `₵${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10, fill: '#475569' }}
                axisLine={false}
                tickLine={false}
                width={76}
                tickFormatter={(v: string) => v.length > 10 ? v.slice(0, 9) + '…' : v}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, name: string) => [
                  name === 'value' ? GHS(v) : `${v} units`,
                  name === 'value' ? 'Value (₵)' : 'Units',
                ]}
              />
              <Legend iconType="circle" iconSize={8} formatter={(v: string) => (
                <span style={{ fontSize: 11, color: '#64748b' }}>{v === 'value' ? 'Value (₵)' : 'Units'}</span>
              )} />
              <Bar dataKey="units" name="units" fill="#94a3b8" radius={[0, 3, 3, 0]} barSize={8} />
              <Bar dataKey="value" name="value" fill="#EC0118" radius={[0, 3, 3, 0]} barSize={8} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Profit Trend */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="mb-5">
            <h3 className="text-sm font-bold text-slate-800">Profit Trend</h3>
            <p className="text-xs text-slate-400 mt-0.5">All Time</p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={weeklyData}>
              <CartesianGrid stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                width={52}
                tickFormatter={(v: number) => `₵${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, name: string) => [GHS(v), name === 'profit' ? 'Profit' : 'Revenue']}
              />
              <Legend iconType="circle" iconSize={8} formatter={(v: string) => (
                <span style={{ fontSize: 11, color: '#64748b' }}>{v === 'profit' ? 'Profit' : 'Revenue'}</span>
              )} />
              <Line
                type="monotone"
                dataKey="profit"
                name="profit"
                stroke="#10B981"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#10B981', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                name="revenue"
                stroke="#EC0118"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#EC0118', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row 4: Quick Stats ───────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Products',
            value: products.length,
            sub: `${lowStockCount + outOfStockCount} need attention`,
            icon: 'ri-box-3-line',
            color: '#EC0118',
          },
          {
            label: 'Low Stock',
            value: lowStockCount,
            sub: `${outOfStockCount} out of stock`,
            icon: 'ri-alert-line',
            color: '#F59E0B',
          },
          {
            label: 'Customers',
            value: customers.length,
            sub: 'registered',
            icon: 'ri-user-3-line',
            color: '#10B981',
          },
          {
            label: 'Active POs',
            value: (orders as unknown[]).length,
            sub: (orders as unknown[]).length === 0 ? 'none open' : 'pending approval',
            icon: 'ri-shopping-cart-2-line',
            color: '#06B6D4',
          },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: `${s.color}18` }}
              >
                <i className={`${s.icon} text-sm`} style={{ color: s.color }} />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-800">{s.value}</div>
            <div className="text-xs font-semibold text-slate-600 mt-0.5">{s.label}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
