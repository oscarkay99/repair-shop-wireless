import { useState } from 'react';
import AdminLayout from '@/components/feature/AdminLayout';
import { loyaltyTiers, loyaltyCustomers, loyaltyRewards, loyaltyStats } from '@/mocks/loyalty';
import RedeemModal from './components/RedeemModal';

const tabs = ['Members', 'Tiers', 'Rewards', 'Analytics'];

export default function LoyaltyPage() {
  const [activeTab, setActiveTab] = useState('Members');
  const [memberSearch, setMemberSearch] = useState('');
  const [showRedeem, setShowRedeem] = useState(false);
  const [selectedReward, setSelectedReward] = useState('');

  const getTierColor = (tier: string) => {
    const t = loyaltyTiers.find(x => x.name === tier);
    return t?.color || '#CD7F32';
  };

  return (
    <AdminLayout title="Loyalty & Rewards" subtitle="Points Program · Customer Retention · Tier Benefits">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
        {[
          { label: 'Total Members', value: loyaltyStats.totalMembers.toLocaleString(), icon: 'ri-group-line', color: '#DC1F1F' },
          { label: 'Active Members', value: loyaltyStats.activeMembers.toLocaleString(), icon: 'ri-user-follow-line', color: '#25D366' },
          { label: 'Points Issued', value: (loyaltyStats.totalPointsIssued / 1000).toFixed(0) + 'K', icon: 'ri-coin-line', color: '#F59E0B' },
          { label: 'Points Redeemed', value: (loyaltyStats.totalPointsRedeemed / 1000).toFixed(0) + 'K', icon: 'ri-exchange-line', color: '#E05A2B' },
          { label: 'Retention Rate', value: `${loyaltyStats.retentionRate}%`, icon: 'ri-heart-pulse-line', color: '#0F172A' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
                <i className={`${s.icon} text-sm`} style={{ color: s.color }} />
              </div>
              <span className="text-xs text-slate-400">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-slate-800">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex border border-slate-200 rounded-xl p-1 bg-white">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-700'
              }`}
              style={activeTab === tab ? { background: '#DC1F1F' } : {}}
            >
              {tab}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowRedeem(true)}
          className="bg-[#DC1F1F] hover:bg-[#B81616] px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap transition-colors duration-150"
        >
          <i className="ri-gift-line mr-1" /> Redeem Points
        </button>
      </div>

      {/* Members Tab */}
      {activeTab === 'Members' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">All Members</h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search members..."
                className="px-3 py-2 rounded-lg bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {loyaltyCustomers.filter((c) => !memberSearch.trim() || c.name.toLowerCase().includes(memberSearch.toLowerCase())).map((customer) => (
              <div key={customer.id} className="p-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                <img loading="lazy" decoding="async" src={customer.avatar} alt={customer.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800">{customer.name}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold text-white" style={{ background: getTierColor(customer.tier) }}>
                      {customer.tier}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-[10px] text-slate-500">
                    <span>{customer.points.toLocaleString()} points</span>
                    <span>GHS {customer.lifetimeSpend.toLocaleString()} lifetime</span>
                    <span>{customer.visits} visits</span>
                    <span>Last: {customer.lastVisit}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-slate-400">{customer.rewardsRedeemed} redeemed</p>
                  <p className="text-[10px] text-slate-400">Next: {customer.nextReward}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tiers Tab */}
      {activeTab === 'Tiers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loyaltyTiers.map((tier) => (
            <div key={tier.id} className="bg-white rounded-2xl p-5 border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${tier.color}15` }}>
                  <i className={`${tier.icon} text-xl`} style={{ color: tier.color }} />
                </div>
                <div>
                  <p className="text-lg font-bold" style={{ color: tier.color }}>{tier.name}</p>
                  <p className="text-xs text-slate-400">{tier.minPoints.toLocaleString()} - {tier.maxPoints === 999999 ? '+' : tier.maxPoints.toLocaleString()} pts</p>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-2xl font-bold text-slate-800">{tier.customers.toLocaleString()}</p>
                <p className="text-xs text-slate-400">active members</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Benefits</p>
                {tier.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                    <i className="ri-check-line text-xs" style={{ color: tier.color }} />
                    {benefit}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rewards Tab */}
      {activeTab === 'Rewards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loyaltyRewards.map((reward) => (
            <div key={reward.id} className="bg-white rounded-2xl p-4 border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{reward.category}</span>
                <span className="text-xs text-slate-400">{reward.redeemed} redeemed</span>
              </div>
              <p className="text-sm font-semibold text-slate-800 mb-1">{reward.name}</p>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-2xl font-bold" style={{ color: '#F59E0B' }}>{reward.points.toLocaleString()}</span>
                <span className="text-xs text-slate-400">points</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Value: GHS {reward.value}</span>
                <button
                  onClick={() => { setSelectedReward(reward.id); setShowRedeem(true); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
                  style={{ background: '#DC1F1F' }}
                >
                  Redeem
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'Analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl p-5 border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Tier Distribution</h3>
            <div className="space-y-3">
              {loyaltyTiers.map((tier) => (
                <div key={tier.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: tier.color }} />
                      <span className="text-slate-700 font-medium">{tier.name}</span>
                    </div>
                    <span className="text-slate-500">{tier.customers.toLocaleString()} ({((tier.customers / loyaltyStats.totalMembers) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(tier.customers / loyaltyStats.totalMembers) * 100}%`, background: tier.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Program Performance</h3>
            <div className="space-y-4">
              {[
                { label: 'Revenue from Loyalty Members', value: `GHS ${loyaltyStats.revenueFromLoyalty.toLocaleString()}`, percent: 62.5, color: '#DC1F1F' },
                { label: 'Points Redemption Rate', value: `${((loyaltyStats.totalPointsRedeemed / loyaltyStats.totalPointsIssued) * 100).toFixed(1)}%`, percent: 41, color: '#F59E0B' },
                { label: 'Member Retention', value: `${loyaltyStats.retentionRate}%`, percent: loyaltyStats.retentionRate, color: '#25D366' },
                { label: 'Top Tier Percentage', value: `${loyaltyStats.topTierPercentage}%`, percent: loyaltyStats.topTierPercentage * 5, color: '#0F172A' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="font-semibold" style={{ color: item.color }}>{item.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(item.percent, 100)}%`, background: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showRedeem && (
        <RedeemModal
          customers={loyaltyCustomers}
          rewards={loyaltyRewards}
          selectedReward={selectedReward}
          onRewardChange={setSelectedReward}
          onClose={() => setShowRedeem(false)}
        />
      )}
    </AdminLayout>
  );
}