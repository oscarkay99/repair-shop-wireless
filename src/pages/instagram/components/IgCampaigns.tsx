const igGradient = 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)';

interface IgCampaign {
  id: string;
  name: string;
  status: string;
  type: string;
  startDate: string;
  budget: string;
  reach: number;
  clicks: number;
  leads: number;
  spend: string;
}

interface IgCampaignsProps {
  campaigns: IgCampaign[];
}

export default function IgCampaigns({ campaigns }: IgCampaignsProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800">Instagram Ad Campaigns</h3>
        <button
          className="flex items-center gap-2 px-4 py-2 text-white rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap hover:opacity-90"
          style={{ background: igGradient }}
        >
          <i className="ri-add-line" />New Campaign
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Total Reach', value: '46.2K', icon: 'ri-eye-line' },
          { label: 'Total Clicks', value: '2,697', icon: 'ri-cursor-line' },
          { label: 'Leads Generated', value: '104', icon: 'ri-user-star-line' },
          { label: 'Total Spend', value: 'GHS 700', icon: 'ri-money-dollar-circle-line' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: igGradient }}>
                <i className={`${s.icon} text-white text-sm`} />
              </div>
              <span className="text-xs text-slate-500">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-slate-800">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {campaigns.map(c => (
          <div key={c.id} className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-bold text-slate-800">{c.name}</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    c.status === 'active' ? 'bg-emerald-100 text-emerald-600' :
                    c.status === 'completed' ? 'bg-slate-100 text-slate-500' :
                    'bg-amber-100 text-amber-600'
                  }`}>
                    {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-pink-100 text-pink-600">{c.type}</span>
                </div>
                <p className="text-xs text-slate-400">Started {c.startDate} · Budget {c.budget}</p>
              </div>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 cursor-pointer">
                <i className="ri-more-2-line text-slate-400 text-sm" />
              </button>
            </div>
            {c.status !== 'scheduled' && (
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Reach', value: c.reach.toLocaleString(), icon: 'ri-eye-line', color: '#dc2743' },
                  { label: 'Clicks', value: c.clicks.toLocaleString(), icon: 'ri-cursor-line', color: '#e6683c' },
                  { label: 'Leads', value: c.leads.toString(), icon: 'ri-user-star-line', color: '#DC1F1F' },
                  { label: 'Spent', value: c.spend, icon: 'ri-money-dollar-circle-line', color: '#F59E0B' },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-1" style={{ background: `${s.color}18` }}>
                      <i className={`${s.icon} text-sm`} style={{ color: s.color }} />
                    </div>
                    <p className="text-sm font-bold text-slate-800">{s.value}</p>
                    <p className="text-[10px] text-slate-400">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
            {c.status === 'scheduled' && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <i className="ri-time-line text-amber-500 text-sm" />
                <span className="text-xs text-amber-700">Scheduled to launch on {c.startDate}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
