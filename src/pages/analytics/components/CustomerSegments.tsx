import { useNavigate } from 'react-router-dom';
import { customerSegmentData } from '@/mocks/analytics';

const segmentColors: Record<string, { bg: string; text: string; dot: string }> = {
  VIP:      { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
  Repeat:   { bg: 'bg-slate-50',   text: 'text-slate-700',   dot: 'bg-slate-400'   },
  New:      { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'At-Risk':{ bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-400'     },
};

export default function CustomerSegments() {
  const navigate = useNavigate();
  const total = customerSegmentData.reduce((s, c) => s + c.count, 0);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Customer Segments</h3>
          <p className="text-xs text-slate-400 mt-0.5">{total} total customers</p>
        </div>
        <button onClick={() => navigate('/customers')} className="text-xs text-emerald-600 hover:text-emerald-700 cursor-pointer font-medium">View all</button>
      </div>

      {/* Stacked bar */}
      <div className="flex h-4 rounded-full overflow-hidden gap-0.5 mb-5">
        {customerSegmentData.map((seg) => (
          <div
            key={seg.segment}
            className={`h-full rounded-full transition-all ${segmentColors[seg.segment].dot}`}
            style={{ width: `${seg.pct}%` }}
          />
        ))}
      </div>

      <div className="space-y-3">
        {customerSegmentData.map((seg) => {
          const cfg = segmentColors[seg.segment];
          return (
            <div key={seg.segment} className={`flex items-center gap-3 p-3 rounded-xl ${cfg.bg}`}>
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${cfg.text}`}>{seg.segment}</span>
                  <span className="text-xs font-bold text-slate-800">{seg.revenue}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[10px] text-slate-400">{seg.count} customers · {seg.pct}%</span>
                  <span className="text-[10px] text-slate-500">Avg LTV: {seg.avgLTV}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-50 bg-amber-50 rounded-xl p-3">
        <div className="flex items-start gap-2">
          <div className="w-4 h-4 flex items-center justify-center text-amber-500 flex-shrink-0 mt-0.5">
            <i className="ri-lightbulb-line text-xs" />
          </div>
          <p className="text-[11px] text-amber-700 leading-relaxed">
            <strong>Tip:</strong> Add customers and track purchases to unlock AI-powered retention insights here.
          </p>
        </div>
      </div>
    </div>
  );
}