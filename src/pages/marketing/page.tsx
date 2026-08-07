import { useState } from 'react';
import AdminLayout from '@/components/feature/AdminLayout';
import MarketingStats from './components/MarketingStats';
import AnalyticsSection from './components/AnalyticsSection';
import CampaignList from './components/CampaignList';
import CampaignCalendar from './components/CampaignCalendar';
import TopCreatives from './components/TopCreatives';

const tabs = [
  { id: 'overview', label: 'Overview', icon: 'ri-dashboard-3-line' },
  { id: 'analytics', label: 'Analytics', icon: 'ri-bar-chart-2-line' },
  { id: 'campaigns', label: 'Campaigns', icon: 'ri-megaphone-line' },
  { id: 'calendar', label: 'Calendar', icon: 'ri-calendar-line' },
];

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <AdminLayout title="Marketing" subtitle="Campaigns, analytics, and performance insights">
      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-white border border-slate-100 rounded-2xl p-1.5 mb-5 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#EC0118] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <i className={`${tab.icon} text-sm`} />
            </div>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          <MarketingStats />

          {/* Quick insight banner */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[rgba(236,1,24,0.08)] flex-shrink-0">
              <i className="ri-sparkling-2-line text-[#EC0118] text-lg" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">AI Marketing Insight</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Run your first campaign to unlock AI-powered insights. Connect your channels, launch a broadcast, and get personalized recommendations based on real performance data.
              </p>
            </div>
            <button className="flex items-center gap-2 bg-[rgba(236,1,24,0.06)] hover:bg-[rgba(236,1,24,0.1)] text-[#EC0118] text-xs font-medium px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex-shrink-0 border border-[rgba(236,1,24,0.15)]">
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-sparkling-2-line text-xs" />
              </div>
              Generate Campaign
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <CampaignList />
            </div>
            <div className="space-y-5">
              <TopCreatives />
              {/* Channel breakdown mini */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">Active Campaigns</h3>
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <i className="ri-megaphone-line text-2xl text-slate-200 mb-2" />
                  <p className="text-xs text-slate-400">No active campaigns</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-5">
          <MarketingStats />

          {/* Period selector */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Performance Analytics</h2>
            <div className="flex items-center gap-1 bg-white border border-slate-100 rounded-xl p-1">
              {['This Month', 'Last Month', 'Last 3 Months'].map((p) => (
                <button
                  key={p}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all cursor-pointer whitespace-nowrap first:bg-slate-900 first:text-white"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <AnalyticsSection />

          {/* ROI breakdown table */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">Campaign ROI Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Campaign', 'Budget', 'Spent', 'Revenue Generated', 'ROI', 'Leads', 'Cost/Lead', 'Conv. Rate'].map((h) => (
                      <th key={h} className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-xs text-slate-400">
                      No campaign data yet. Launch your first campaign to see ROI breakdown here.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="space-y-5">
          <MarketingStats />
          <CampaignList />
          <TopCreatives />
        </div>
      )}

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <CampaignCalendar />
            </div>
            <div className="space-y-4">
              {/* Upcoming events */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">Upcoming This Week</h3>
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <i className="ri-calendar-line text-2xl text-slate-200 mb-2" />
                  <p className="text-xs text-slate-400">No upcoming events</p>
                </div>
              </div>

              {/* Schedule new */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-100 mb-3">
                  <i className="ri-add-circle-line text-emerald-600 text-base" />
                </div>
                <p className="text-sm font-semibold text-emerald-800 mb-1">Schedule a Campaign</p>
                <p className="text-xs text-emerald-600 mb-3">Plan your next WhatsApp broadcast or Instagram post.</p>
                <button className="w-full py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-all cursor-pointer whitespace-nowrap">
                  + New Campaign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
