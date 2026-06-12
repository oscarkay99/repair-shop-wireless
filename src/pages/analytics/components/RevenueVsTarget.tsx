import { monthlyData } from '@/mocks/analytics';

export default function RevenueVsTarget() {
  const max = Math.max(...monthlyData.map((d) => Math.max(d.revenue, d.target)), 1);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Revenue vs Target</h3>
          <p className="text-xs text-slate-400 mt-0.5">6-month performance against monthly goals</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span className="text-[11px] text-slate-500">Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-slate-200" />
            <span className="text-[11px] text-slate-500">Target</span>
          </div>
        </div>
      </div>

      <div className="flex items-end gap-3" style={{ height: '160px' }}>
        {monthlyData.map((d) => {
          const revH = (d.revenue / max) * 100;
          const tarH = (d.target / max) * 100;
          const beat = d.revenue >= d.target;
          return (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer">
              <div className="relative w-full flex items-end justify-center gap-1" style={{ height: '136px' }}>
                {/* Target bar */}
                <div
                  className="w-[45%] rounded-t-lg bg-slate-100 group-hover:bg-slate-200 transition-all relative"
                  style={{ height: `${tarH}%` }}
                >
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-700 text-white text-[9px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap z-10">
                    Target: GHS {d.target.toLocaleString()}
                  </div>
                </div>
                {/* Revenue bar */}
                <div
                  className={`w-[45%] rounded-t-lg transition-all relative ${beat ? 'bg-emerald-500 group-hover:bg-emerald-400' : 'bg-amber-400 group-hover:bg-amber-300'}`}
                  style={{ height: `${revH}%` }}
                >
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#DC1F1F] text-white text-[9px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap z-10">
                    GHS {d.revenue.toLocaleString()}
                  </div>
                  {beat && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-400 rounded-full" />
                  )}
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">{d.month}</span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-50">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">6-Month Total</p>
          <p className="text-base font-bold text-slate-900 mt-0.5">GHS 0</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Months Beat Target</p>
          <p className="text-base font-bold text-emerald-600 mt-0.5">0 / 0</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Best Month</p>
          <p className="text-base font-bold text-slate-900 mt-0.5">—</p>
        </div>
      </div>
    </div>
  );
}