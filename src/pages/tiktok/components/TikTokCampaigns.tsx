interface TikTokCampaign {
  id: string;
  name: string;
  status: string;
  budget: number;
  spent: number;
  reach: number;
  clicks: number;
  leads: number;
  ctr: number;
  cpl: number;
}

interface TikTokCampaignsProps {
  campaigns: TikTokCampaign[];
  formatNumber: (n: number) => string;
}

export default function TikTokCampaigns({ campaigns, formatNumber }: TikTokCampaignsProps) {
  return (
    <div className="space-y-3">
      {campaigns.map((campaign) => (
        <div key={campaign.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: campaign.status === 'Active' ? '#FE2C5515' : campaign.status === 'Completed' ? '#25F4EE15' : '#F59E0B15' }}>
            <i className={`${campaign.status === 'Active' ? 'ri-fire-line' : campaign.status === 'Completed' ? 'ri-check-line' : 'ri-time-line'} text-lg`} style={{ color: campaign.status === 'Active' ? '#FE2C55' : campaign.status === 'Completed' ? '#25F4EE' : '#F59E0B' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-800">{campaign.name}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                campaign.status === 'Active' ? 'text-white' : campaign.status === 'Completed' ? 'text-slate-700' : 'text-slate-600'
              }`}
              style={{ background: campaign.status === 'Active' ? '#FE2C55' : campaign.status === 'Completed' ? '#25F4EE' : '#F59E0B' }}
              >
                {campaign.status}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-[10px] text-slate-500">
              <span>Budget: GHS {campaign.budget.toLocaleString()}</span>
              <span>Spent: GHS {campaign.spent.toLocaleString()}</span>
              <span>Reach: {formatNumber(campaign.reach)}</span>
              <span>Clicks: {formatNumber(campaign.clicks)}</span>
              <span>Leads: {campaign.leads}</span>
              <span>CTR: {campaign.ctr}%</span>
              <span>CPL: GHS {campaign.cpl}</span>
            </div>
          </div>
          <div className="w-24 flex-shrink-0">
            <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(campaign.spent / campaign.budget) * 100}%`, background: 'linear-gradient(90deg, #FE2C55, #25F4EE)' }} />
            </div>
            <p className="text-[10px] text-slate-400 mt-1 text-right">{Math.round((campaign.spent / campaign.budget) * 100)}% spent</p>
          </div>
        </div>
      ))}
    </div>
  );
}
