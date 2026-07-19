import { useState } from 'react';
import { campaigns } from '@/mocks/marketing';

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  active:    { label: 'Active',    color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  completed: { label: 'Completed', color: 'bg-slate-100 text-slate-600',    dot: 'bg-slate-400'   },
  draft:     { label: 'Draft',     color: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-400'   },
  paused:    { label: 'Paused',    color: 'bg-red-100 text-red-600',        dot: 'bg-red-400'     },
};

const channelIcons: Record<string, { icon: string; color: string }> = {
  whatsapp:  { icon: 'ri-whatsapp-line',  color: 'text-[#25D366]' },
  instagram: { icon: 'ri-instagram-line', color: 'text-pink-500'  },
  sms:       { icon: 'ri-message-2-line', color: 'text-slate-500' },
};

export default function CampaignList() {
  const [filter, setFilter] = useState('all');
  const [showNew, setShowNew] = useState(false);

  const filtered = filter === 'all' ? campaigns : campaigns.filter((c) => c.status === filter);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-5 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-800 flex-1">Campaigns</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'active', 'draft', 'paused', 'completed'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap capitalize ${
                filter === s ? 'bg-[#EC0118] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {s === 'all' ? 'All' : statusConfig[s]?.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap"
        >
          <div className="w-4 h-4 flex items-center justify-center">
            <i className="ri-add-line text-sm" />
          </div>
          New Campaign
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Campaign', 'Channels', 'Status', 'Reach', 'Leads', 'Conv.', 'Budget', 'ROI', 'Dates', ''].map((h) => (
                <th key={h} className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => {
              const st = statusConfig[c.status];
              return (
                <tr key={c.id} className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/20'}`}>
                  <td className="px-4 py-3">
                    <p className="text-xs font-semibold text-slate-800 whitespace-nowrap">{c.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {c.channels.map((ch) => {
                        const meta = channelIcons[ch];
                        return (
                          <div key={ch} className={`w-5 h-5 flex items-center justify-center ${meta.color}`}>
                            <i className={`${meta.icon} text-sm`} />
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700 font-medium">{c.reach > 0 ? c.reach.toLocaleString() : '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-700 font-medium">{c.leads > 0 ? c.leads : '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-700 font-medium">{c.conversions > 0 ? c.conversions : '—'}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-xs font-medium text-slate-800">{c.budget}</p>
                      <p className="text-[10px] text-slate-400">{c.spent} spent</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold ${c.roi !== '—' ? 'text-emerald-600' : 'text-slate-400'}`}>{c.roi}</span>
                  </td>
                  <td className="px-4 py-3 text-[10px] text-slate-400 whitespace-nowrap">{c.startDate} – {c.endDate}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer transition-all">
                        <i className="ri-eye-line text-sm" />
                      </button>
                      <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer transition-all">
                        <i className="ri-edit-line text-sm" />
                      </button>
                      <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer transition-all">
                        <i className="ri-file-copy-line text-sm" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* New Campaign Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNew(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-slate-800">New Campaign</h3>
              <button onClick={() => setShowNew(false)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
                <i className="ri-close-line text-base" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1.5">Campaign Name</label>
                <input type="text" placeholder="e.g. Samsung Galaxy S24 Promo" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-400 transition-all" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-2">Channels</label>
                <div className="flex gap-2 flex-wrap">
                  {['whatsapp', 'instagram', 'sms'].map((ch) => {
                    const meta = channelIcons[ch];
                    return (
                      <button key={ch} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 hover:border-emerald-400 hover:bg-emerald-50 cursor-pointer capitalize transition-all whitespace-nowrap">
                        <div className={`w-4 h-4 flex items-center justify-center ${meta.color}`}>
                          <i className={`${meta.icon} text-sm`} />
                        </div>
                        {ch}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1.5">Start Date</label>
                  <input type="date" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-400 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1.5">Budget (GHS)</label>
                  <input type="number" placeholder="500" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-400 transition-all" />
                </div>
              </div>
              <button className="w-full py-3 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-all cursor-pointer whitespace-nowrap">
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
