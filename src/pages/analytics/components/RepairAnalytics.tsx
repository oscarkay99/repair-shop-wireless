import { repairMetrics, stockHealthData } from '@/mocks/analytics';

export default function RepairAnalytics() {
  const maxRev = Math.max(...repairMetrics.map((r) => r.revenue), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Repair Revenue Trend */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Repair Revenue</h3>
            <p className="text-xs text-slate-400 mt-0.5">Monthly repair income trend</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-slate-900">GHS 0</p>
            <p className="text-[10px] text-slate-400 font-semibold">0% in 6 months</p>
          </div>
        </div>
        <div className="flex items-end gap-2" style={{ height: '100px' }}>
          {repairMetrics.map((r) => {
            const h = (r.revenue / maxRev) * 100;
            return (
              <div key={r.month} className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer">
                <div className="relative w-full flex items-end" style={{ height: '80px' }}>
                  <div className="absolute inset-0 bg-slate-50 rounded-xl" />
                  <div
                    className="relative w-full rounded-xl bg-gradient-to-t from-blue-600 to-blue-400 group-hover:from-blue-500 group-hover:to-blue-300 transition-all"
                    style={{ height: `${h}%` }}
                  >
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#DC1F1F] text-white text-[9px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                      GHS {r.revenue.toLocaleString()}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">{r.month}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400">Total Repairs</p>
            <p className="text-sm font-bold text-slate-800">0 completed</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">Avg Turnaround</p>
            <p className="text-sm font-bold text-slate-800">—</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">Satisfaction</p>
            <p className="text-sm font-bold text-slate-400">—</p>
          </div>
        </div>
      </div>

      {/* Stock Health */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Stock Health</h3>
            <p className="text-xs text-slate-400 mt-0.5">0 products tracked</p>
          </div>
          <button className="text-xs text-emerald-600 hover:text-emerald-700 cursor-pointer font-medium">View inventory</button>
        </div>

        {/* Donut-style visual */}
        <div className="flex h-4 rounded-full overflow-hidden gap-0.5 mb-5">
          {stockHealthData.map((s) => (
            <div key={s.label} className={`h-full rounded-full ${s.color}`} style={{ width: `${s.pct}%` }} />
          ))}
        </div>

        <div className="space-y-3 mb-5">
          {stockHealthData.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${s.color}`} />
              <span className="text-xs text-slate-600 flex-1">{s.label}</span>
              <span className="text-xs font-bold text-slate-800">{s.value}</span>
              <span className="text-xs text-slate-400 w-8 text-right">{s.pct}%</span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 border-b border-slate-50">
            <span className="text-xs text-slate-500">Inventory Value</span>
            <span className="text-xs font-bold text-slate-800">GHS 0</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-50">
            <span className="text-xs text-slate-500">Avg Days in Stock</span>
            <span className="text-xs font-bold text-slate-400">—</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-xs text-slate-500">Fastest Mover</span>
            <span className="text-xs font-bold text-slate-400">—</span>
          </div>
        </div>
      </div>
    </div>
  );
}