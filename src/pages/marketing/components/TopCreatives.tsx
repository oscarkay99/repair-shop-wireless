import { useNavigate } from 'react-router-dom';
import { topCreatives } from '@/mocks/marketing';

const channelMeta: Record<string, { icon: string; color: string; label: string }> = {
  instagram: { icon: 'ri-instagram-line', color: 'text-pink-500', label: 'Instagram' },
  whatsapp:  { icon: 'ri-whatsapp-line',  color: 'text-[#25D366]', label: 'WhatsApp' },
  sms:       { icon: 'ri-message-2-line', color: 'text-slate-500', label: 'SMS'      },
};

export default function TopCreatives() {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Top Performing Creatives</h3>
          <p className="text-xs text-slate-400 mt-0.5">Best click-through rates this month</p>
        </div>
        <button onClick={() => navigate('/marketing')} className="text-xs text-emerald-600 hover:text-emerald-700 cursor-pointer">View all</button>
      </div>
      <div className="space-y-4">
        {topCreatives.map((c, i) => {
          const ch = channelMeta[c.channel];
          return (
            <div key={c.id} className="flex items-center gap-3 group cursor-pointer">
              <span className="text-xs font-bold text-slate-300 w-4 flex-shrink-0">#{i + 1}</span>
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-slate-50">
                <img loading="lazy" decoding="async" src={c.image} alt={c.title} className="w-full h-full object-cover object-top" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{c.title}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className={`w-3 h-3 flex items-center justify-center ${ch.color}`}>
                    <i className={`${ch.icon} text-xs`} />
                  </div>
                  <span className="text-[10px] text-slate-400">{ch.label}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold text-emerald-600">{c.ctr} CTR</p>
                <p className="text-[10px] text-slate-400">{c.clicks} clicks</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
