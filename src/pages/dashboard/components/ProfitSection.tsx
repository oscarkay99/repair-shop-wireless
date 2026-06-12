import { useMemo } from 'react';
import { useSales } from '@/hooks/useSales';
import { useExpenses } from '@/hooks/useExpenses';
import { useInventory } from '@/hooks/useInventory';

function parseGHS(t: string | number) {
  return typeof t === 'number' ? t : parseFloat(String(t).replace(/[^0-9.]/g, '')) || 0;
}

function fmt(n: number) {
  if (Math.abs(n) >= 1000) return `GHS ${(n / 1000).toFixed(1)}k`;
  return `GHS ${Math.round(n).toLocaleString()}`;
}

function pct(part: number, whole: number) {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

export default function ProfitSection() {
  const { sales } = useSales();
  const { expenses } = useExpenses();
  const { products } = useInventory();

  const now = new Date();
  const thisMonth = now.toLocaleDateString('en-GH', { month: 'short' });
  const thisYear  = String(now.getFullYear());
  const today     = now.toLocaleDateString('en-GH', { month: 'short', day: 'numeric', year: 'numeric' });

  const activeSales = sales.filter(s => s.status !== 'cancelled' && s.status !== 'refunded');

  function estimateCogs(itemsStr: string): number {
    return itemsStr.split(',').reduce((sum, part) => {
      const m = part.trim().match(/^(\d+)x\s+(.+)$/);
      if (!m) return sum;
      const qty = parseInt(m[1]);
      const name = m[2].trim().toLowerCase();
      const product = products.find(p => p.name.toLowerCase() === name);
      return sum + (product?.costPrice ? product.costPrice * qty : 0);
    }, 0);
  }

  function saleCogs(s: { cogs?: number; items: string }) {
    return s.cogs ?? estimateCogs(s.items);
  }

  const { todayRevenue, todayCogs, todayProfit,
          monthRevenue, monthCogs, monthGross, monthOpEx, monthNet,
          ytdRevenue, ytdCogs, ytdGross, ytdOpEx, ytdNet,
          chartData } = useMemo(() => {
    const todaySales  = activeSales.filter(s => s.date === today);
    const monthSales  = activeSales.filter(s => s.date?.includes(thisMonth) && s.date?.includes(thisYear));
    const ytdSales    = activeSales.filter(s => s.date?.includes(thisYear));

    const sum = (arr: typeof activeSales) => arr.reduce((s, x) => s + parseGHS(x.total), 0);
    const cogs = (arr: typeof activeSales) => arr.reduce((s, x) => s + saleCogs(x), 0);
    const opex = (month: string, year: string) => expenses
      .filter(e => e.type === 'expense' && e.date?.includes(month) && e.date?.includes(year))
      .reduce((s, e) => s + parseGHS(e.amount), 0);

    const tRev  = sum(todaySales);
    const tCogs = cogs(todaySales);
    const mRev  = sum(monthSales);
    const mCogs = cogs(monthSales);
    const mOpEx = opex(thisMonth, thisYear);
    const yRev  = sum(ytdSales);
    const yCogs = cogs(ytdSales);
    const yOpEx = expenses.filter(e => e.type === 'expense' && e.date?.includes(thisYear))
      .reduce((s, e) => s + parseGHS(e.amount), 0);

    const chart = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const mo = d.toLocaleDateString('en-GH', { month: 'short' });
      const yr = String(d.getFullYear());
      const sl = activeSales.filter(s => s.date?.includes(mo) && s.date?.includes(yr));
      const rev  = sum(sl);
      const cg   = cogs(sl);
      const opx  = opex(mo, yr);
      return { month: mo, gross: rev - cg, net: rev - cg - opx };
    });

    return {
      todayRevenue: tRev, todayCogs: tCogs, todayProfit: tRev - tCogs,
      monthRevenue: mRev, monthCogs: mCogs, monthGross: mRev - mCogs, monthOpEx: mOpEx, monthNet: mRev - mCogs - mOpEx,
      ytdRevenue: yRev, ytdCogs: yCogs, ytdGross: yRev - yCogs, ytdOpEx: yOpEx, ytdNet: yRev - yCogs - yOpEx,
      chartData: chart,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sales, expenses, products]);

  const maxBar = Math.max(...chartData.map(d => Math.max(d.gross, 0)), 1);

  const tiles = [
    { label: "Today's Profit",    value: fmt(todayProfit),  sub: `${pct(todayProfit, todayRevenue)}% margin`,   color: '#25D366', icon: 'ri-sun-line',           positive: todayProfit >= 0 },
    { label: 'Gross Profit (Mo)', value: fmt(monthGross),   sub: `${pct(monthGross, monthRevenue)}% gross margin`, color: '#DC1F1F', icon: 'ri-arrow-up-circle-line', positive: monthGross >= 0 },
    { label: 'Net Profit (Mo)',   value: fmt(monthNet),     sub: `after GHS ${Math.round(monthOpEx / 1000 * 10) / 10}k opex`, color: '#06B6D4', icon: 'ri-percent-line', positive: monthNet >= 0 },
    { label: 'YTD Net Profit',    value: fmt(ytdNet),       sub: `${pct(ytdNet, ytdRevenue)}% net margin`,      color: '#F59E0B', icon: 'ri-trophy-line',        positive: ytdNet >= 0 },
  ];

  const hasCostPrices = products.some(p => (p.costPrice ?? 0) > 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Profit Overview</h3>
          <p className="text-xs text-slate-400 mt-0.5">Revenue · COGS · Operating expenses</p>
        </div>
        {!hasCostPrices && (
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 flex items-center gap-1">
            <i className="ri-alert-line" />
            Set cost prices in Inventory for accurate profit
          </span>
        )}
      </div>

      {/* Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-100">
        {tiles.map(t => (
          <div key={t.label} className="bg-white px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${t.color}18` }}>
                <i className={`${t.icon} text-xs`} style={{ color: t.color }} />
              </div>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{t.label}</span>
            </div>
            <p className="text-xl font-black text-slate-900">{t.value}</p>
            <p className={`text-[10px] mt-0.5 font-medium ${t.positive ? 'text-emerald-600' : 'text-rose-500'}`}>{t.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 p-5">
        {/* Monthly breakdown */}
        <div>
          <p className="text-xs font-bold text-slate-700 mb-3">This Month's Breakdown</p>
          <div className="space-y-2.5">
            {[
              { label: 'Revenue',            value: monthRevenue, color: '#DC1F1F', positive: true },
              { label: '− Cost of Goods',    value: -monthCogs,   color: '#E05A2B', positive: false },
              { label: '= Gross Profit',     value: monthGross,   color: '#25D366', positive: monthGross >= 0, bold: true },
              { label: '− Operating Expenses', value: -monthOpEx, color: '#F59E0B', positive: false },
              { label: '= Net Profit',       value: monthNet,     color: monthNet >= 0 ? '#25D366' : '#E05A2B', positive: monthNet >= 0, bold: true },
            ].map(row => (
              <div key={row.label} className={`flex items-center justify-between text-xs ${row.bold ? 'pt-2 border-t border-slate-100' : ''}`}>
                <span className={row.bold ? 'font-bold text-slate-800' : 'text-slate-500'}>{row.label}</span>
                <span className="font-bold" style={{ color: row.color }}>
                  GHS {Math.abs(Math.round(row.value)).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 6-month gross profit chart */}
        <div>
          <p className="text-xs font-bold text-slate-700 mb-3">Gross Profit — Last 6 Months</p>
          {chartData.every(d => d.gross === 0) ? (
            <div className="flex flex-col items-center justify-center h-24 text-center">
              <i className="ri-bar-chart-2-line text-2xl text-slate-200 block mb-1" />
              <p className="text-xs text-slate-400">No profit data yet</p>
            </div>
          ) : (
            <div className="flex items-end gap-2 h-24">
              {chartData.map(d => {
                const height = Math.max((Math.max(d.gross, 0) / maxBar) * 80, d.gross > 0 ? 4 : 0);
                return (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="relative w-full" style={{ height: '80px' }}>
                      <div className="absolute bottom-0 left-0 right-0 rounded-t-md transition-all duration-500 group-hover:opacity-80"
                        style={{ height: `${height}px`, background: d.gross >= 0 ? 'linear-gradient(to top, #DC1F1F, #06B6D4)' : '#E05A2B' }} />
                      {d.gross !== 0 && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                          {fmt(d.gross)}
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-400">{d.month}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400">
            <span>YTD Revenue: <strong className="text-slate-700">GHS {Math.round(ytdRevenue).toLocaleString()}</strong></span>
            <span>YTD Gross: <strong className="text-slate-700">GHS {Math.round(ytdGross).toLocaleString()}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
