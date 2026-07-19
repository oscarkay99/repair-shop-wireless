import { useNavigate } from 'react-router-dom';
import { recentActivity } from '@/mocks/dashboard';

const iconMap: Record<string, { icon: string; color: string }> = {
  sale:    { icon: 'ri-shopping-bag-3-line', color: 'text-emerald-500 bg-emerald-50' },
  lead:    { icon: 'ri-user-star-line',       color: 'text-amber-500 bg-amber-50'   },
  payment: { icon: 'ri-bank-card-line',       color: 'text-cyan-500 bg-cyan-50'     },
  repair:  { icon: 'ri-tools-line',           color: 'text-amber-500 bg-amber-50'   },
};

export default function RecentActivity() {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-800">Recent Activity</h3>
        <button onClick={() => navigate('/analytics')} className="text-xs cursor-pointer" style={{ color: '#EC0118' }}>View all</button>
      </div>
      <div className="space-y-3">
        {recentActivity.map((item, i) => {
          const meta = iconMap[item.type];
          return (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-8 h-8 flex items-center justify-center rounded-xl flex-shrink-0 ${meta.color}`}>
                <i className={`${meta.icon} text-sm`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-700 truncate">{item.text}</p>
                <p className="text-[10px] text-slate-400">{item.time}</p>
              </div>
              {item.amount && (
                <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">{item.amount}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
