import { useState } from 'react';
import { leadSources, conversionFunnel, weeklyPerformance } from '@/mocks/marketing';

export default function AnalyticsSection() {
  const [activeMetric, setActiveMetric] = useState<'reach' | 'leads' | 'conversions'>('leads');

  const maxWeekly = Math.max(...weeklyPerformance.map((w) => w[activeMetric]));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

      {/* Weekly Performance Chart */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Weekly Performance</h3>
            <p className="text-xs text-slate-400 mt-0.5">6-week trend across all campaigns</p>
          </div>
          <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1">
            {(['reach', 'leads', 'conversions'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setActiveMetric(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap capitalize ${
                  activeMetric === m ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-end gap-3 h-44">
          {weeklyPerformance.map((w) => {
            const val = w[activeMetric];
            const height = (val / maxWeekly) * 100;
            return (
              <div key={w.week} className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer">
                <div className="relative w-full flex items-end justify-center" style={{ height: '152px' }}>
                  <div
                    className="w-full rounded-t-xl bg-emerald-100 group-hover:bg-emerald-200 transition-all duration-300 relative overflow-hidden"
                    style={{ height: `${height}%`, minHeight: '8px' }}
                  >
                    <div className="absolute bottom-0 left-0 right-0 rounded-t-xl bg-emerald-500 opacity-75" style={{ height: '55%' }} />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap z-10">
                      {activeMetric === 'reach' ? val.toLocaleString() : val}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">{w.week}</span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-50">
          <div>
            <p className="text-xs text-slate-400">Best Week</p>
            <p className="text-sm font-bold text-slate-800">Apr W4</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Avg. Weekly Leads</p>
            <p className="text-sm font-bold text-slate-800">74</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-emerald-600">
            <div className="w-4 h-4 flex items-center justify-center">
              <i className="ri-arrow-up-line text-sm" />
            </div>
            <span className="text-sm font-semibold">+125%</span>
            <span className="text-xs text-slate-400">vs 6 weeks ago</span>
          </div>
        </div>
      </div>

      {/* Lead Sources Donut */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <h3 className="text-sm font-semibold text-slate-800 mb-1">Lead Sources</h3>
        <p className="text-xs text-slate-400 mb-5">Where your leads come from</p>

        {/* Visual donut-style bar */}
        <div className="flex h-3 rounded-full overflow-hidden mb-5 gap-0.5">
          {leadSources.map((s) => (
            <div
              key={s.source}
              className="h-full rounded-full transition-all"
              style={{ width: `${s.pct}%`, backgroundColor: s.color }}
            />
          ))}
        </div>

        <div className="space-y-3">
          {leadSources.map((s) => (
            <div key={s.source} className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-xs text-slate-600 flex-1">{s.source}</span>
              <span className="text-xs font-semibold text-slate-800">{s.leads}</span>
              <span className="text-xs text-slate-400 w-8 text-right">{s.pct}%</span>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-slate-50">
          <p className="text-xs text-slate-400">Top channel</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-5 h-5 flex items-center justify-center rounded-full bg-[#25D366]/10 text-[#25D366]">
              <i className="ri-whatsapp-line text-xs" />
            </div>
            <span className="text-sm font-bold text-slate-800">WhatsApp: 46%</span>
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-slate-100">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Conversion Funnel</h3>
            <p className="text-xs text-slate-400 mt-0.5">From reach to closed sale · this month</p>
          </div>
          <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-medium">2.1% overall conversion</span>
        </div>

        <div className="flex items-end gap-3">
          {conversionFunnel.map((stage, i) => {
            const colors = ['bg-slate-200', 'bg-blue-200', 'bg-amber-300', 'bg-emerald-300', 'bg-emerald-500'];
            const textColors = ['text-slate-600', 'text-blue-700', 'text-amber-700', 'text-emerald-700', 'text-emerald-800'];
            return (
              <div key={stage.stage} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="text-center mb-1">
                  <p className="text-xs font-bold text-slate-800">{stage.value.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400">{stage.pct}%</p>
                </div>
                <div
                  className={`w-full rounded-xl ${colors[i]} transition-all group-hover:opacity-80`}
                  style={{ height: `${Math.max(stage.pct * 2.4, 12)}px` }}
                />
                <p className={`text-xs font-medium ${textColors[i]} text-center whitespace-nowrap`}>{stage.stage}</p>
                {i < conversionFunnel.length - 1 && (
                  <div className="absolute" />
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-5 gap-3 mt-5 pt-4 border-t border-slate-50">
          {conversionFunnel.map((stage, i) => {
            const dropPct = i > 0
              ? (((conversionFunnel[i - 1].value - stage.value) / conversionFunnel[i - 1].value) * 100).toFixed(0)
              : null;
            return (
              <div key={stage.stage} className="text-center">
                {dropPct && (
                  <p className="text-[10px] text-red-400 font-medium">-{dropPct}% drop</p>
                )}
                {!dropPct && <p className="text-[10px] text-slate-300">—</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
