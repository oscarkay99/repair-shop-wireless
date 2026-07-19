import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { recentActivity } from '@/mocks/dashboard';

const iconMap: Record<string, { icon: string; bg: string; text: string }> = {
  sale:    { icon: 'ri-shopping-bag-3-line', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  lead:    { icon: 'ri-user-star-line',       bg: 'bg-amber-50',   text: 'text-amber-600'  },
  payment: { icon: 'ri-bank-card-line',       bg: 'bg-cyan-50',    text: 'text-cyan-600'   },
  repair:  { icon: 'ri-tools-line',           bg: 'bg-amber-50',   text: 'text-amber-600'  },
};

export default function LiveFeed() {
  const navigate = useNavigate();
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setPulse((p) => !p), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-800">Live Activity</h3>
          <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded-full">
            <div className={`w-1.5 h-1.5 rounded-full bg-emerald-500 transition-opacity duration-1000 ${pulse ? 'opacity-100' : 'opacity-40'}`} />
            <span className="text-[10px] text-emerald-600 font-semibold">Live</span>
          </div>
        </div>
        <button onClick={() => navigate('/analytics')} className="text-xs cursor-pointer font-medium" style={{ color: '#EC0118' }}>View all</button>
      </div>
      <div className="divide-y divide-slate-50">
        {recentActivity.map((item, i) => {
          const meta = iconMap[item.type];
          return (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
              <div className={`w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0 ${meta.bg} ${meta.text}`}>
                <i className={`${meta.icon} text-sm`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700 truncate">{item.text}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{item.time}</p>
              </div>
              {item.amount && (
                <span className="text-xs font-bold text-slate-800 whitespace-nowrap">{item.amount}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}