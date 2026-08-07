import { salesFunnel } from '@/mocks/analytics';

export default function SalesFunnelChart() {
  const max = Math.max(salesFunnel[0].value, 1);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Sales Funnel</h3>
          <p className="text-xs text-slate-400 mt-0.5">Lead-to-close pipeline · this month</p>
        </div>
        <div className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
          0% close rate
        </div>
      </div>

      <div className="space-y-2.5">
        {salesFunnel.map((stage, i) => {
          const width = (stage.value / max) * 100;
          const dropPct = i > 0
            ? (((salesFunnel[i - 1].value - stage.value) / salesFunnel[i - 1].value) * 100).toFixed(0)
            : null;

          return (
            <div key={stage.stage} className="group">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs text-slate-500 w-24 flex-shrink-0">{stage.stage}</span>
                <div className="flex-1 h-8 bg-slate-50 rounded-xl overflow-hidden relative">
                  <div
                    className="h-full rounded-xl flex items-center px-3 transition-all duration-700"
                    style={{ width: `${width}%`, backgroundColor: stage.color }}
                  >
                    <span className="text-white text-xs font-bold whitespace-nowrap">{stage.value}</span>
                  </div>
                </div>
                {dropPct && (
                  <span className="text-[10px] text-red-400 font-medium w-14 text-right flex-shrink-0">-{dropPct}%</span>
                )}
                {!dropPct && <span className="w-14" />}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-slate-50 grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Biggest Drop-off</p>
          <p className="text-sm font-bold text-slate-800 mt-0.5">—</p>
          <p className="text-[11px] text-slate-400 font-medium">No data yet</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-3">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">AI Suggestion</p>
          <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">Add leads and track them to unlock AI funnel insights</p>
        </div>
      </div>
    </div>
  );
}