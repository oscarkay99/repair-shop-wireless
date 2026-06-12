import { useState } from 'react';
import { revenueChart, monthlyRevenue } from '@/mocks/dashboard';

const tabs = ['This Week', 'This Month', '6 Months'];

export default function RevenueChart() {
  const [activeTab, setActiveTab] = useState(0);

  const data = activeTab === 0
    ? revenueChart.map((d) => ({ label: d.day, value: d.value }))
    : activeTab === 1
    ? [{ label: 'W1', value: 0 }, { label: 'W2', value: 0 }, { label: 'W3', value: 0 }, { label: 'W4', value: 0 }]
    : monthlyRevenue.map((d) => ({ label: d.month, value: d.revenue }));

  const max = Math.max(...data.map((d) => d.value), 1);
  const total = 'GHS 0';
  const change = '0%';

  return (
    <div className="rounded-2xl p-6 h-full" style={{ background: 'white', border: '1px solid rgba(7,16,31,0.07)', boxShadow: '0 1px 3px rgba(7,16,31,0.04), 0 6px 24px rgba(220,31,31,0.08)' }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Revenue Performance</h3>
          <p className="text-xs text-slate-400 mt-0.5">GHS — all payment methods</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === i ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="flex items-end gap-2" style={{ height: '140px' }}>
        {data.map((d, i) => {
          const height = Math.max((d.value / max) * 100, 4);
          return (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer">
              <div className="relative w-full flex items-end justify-center" style={{ height: '120px' }}>
                {/* Background bar */}
                <div className="absolute bottom-0 left-0 right-0 bg-slate-50 rounded-xl" style={{ height: '100%' }} />
                {/* Value bar */}
                <div
                  className="relative w-full rounded-xl overflow-hidden transition-all duration-500"
                  style={{ height: `${height}%` }}
                >
                  <div className="absolute inset-0 rounded-xl" style={{ background: 'linear-gradient(to top, #0F172A, #2463BE, #4A87F5)' }} />
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-all" style={{ background: 'linear-gradient(to top, #0F172A, #1A52A8, #2B6DD4)' }} />
                  <div className="absolute top-0 left-0 right-0 h-4 rounded-t-xl opacity-30" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)' }} />
                </div>
                {/* Tooltip */}
                <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-[#DC1F1F] text-white text-[10px] px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap z-10 pointer-events-none">
                  GHS {d.value.toLocaleString()}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">{d.label}</span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-50">
        <div>
          <p className="text-[11px] text-slate-400 uppercase tracking-wider">Total</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{total}</p>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(245,166,35,0.12)', color: '#B8860B' }}>
            <i className="ri-arrow-up-line text-xs" />
            <span className="text-sm font-bold">{change}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">vs previous period</p>
        </div>
      </div>
    </div>
  );
}