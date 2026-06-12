import { useState } from 'react';
import AdminLayout from '@/components/feature/AdminLayout';
import { smsCampaigns, smsTemplates, smsSegments, smsStats } from '@/mocks/sms';
import ComposeModal from './components/ComposeModal';

const tabs = ['Campaigns', 'Templates', 'Segments', 'Analytics'];

export default function SMSPage() {
  const [activeTab, setActiveTab] = useState('Campaigns');
  const [showCompose, setShowCompose] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('');
  const [messageText, setMessageText] = useState('');

  return (
    <AdminLayout title="SMS Campaigns" subtitle="Bulk Messaging · Payment Reminders · Delivery Updates">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
        {[
          { label: 'Total Sent', value: smsStats.totalSent.toLocaleString(), icon: 'ri-send-plane-line', color: '#DC1F1F' },
          { label: 'Delivered', value: `${smsStats.deliveryRate}%`, icon: 'ri-check-double-line', color: '#25D366' },
          { label: 'Read Rate', value: `${smsStats.readRate}%`, icon: 'ri-eye-line', color: '#F59E0B' },
          { label: 'Replies', value: `${smsStats.replyRate}%`, icon: 'ri-reply-line', color: '#E05A2B' },
          { label: 'Credits Left', value: smsStats.creditsRemaining.toLocaleString(), icon: 'ri-coin-line', color: '#0F172A' },
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

      {/* Compose Button */}
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
          onClick={() => setShowCompose(true)}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap"
          style={{ background: '#DC1F1F' }}
        >
          <i className="ri-add-line mr-1" /> Compose Campaign
        </button>
      </div>

      {/* Campaigns Tab */}
      {activeTab === 'Campaigns' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">All Campaigns</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {smsCampaigns.map((campaign) => (
              <div key={campaign.id} className="p-4 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: campaign.type === 'Promotional' ? '#F59E0B15' : 'rgba(220,31,31,0.08)' }}>
                  <i className={`${campaign.type === 'Promotional' ? 'ri-megaphone-line' : 'ri-mail-send-line'} text-lg`} style={{ color: campaign.type === 'Promotional' ? '#F59E0B' : '#DC1F1F' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-slate-800">{campaign.name}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      campaign.status === 'Sent' ? 'bg-green-50 text-green-600' : campaign.status === 'Active' ? 'bg-cyan-50 text-cyan-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {campaign.status}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{campaign.type}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2 line-clamp-2">{campaign.message}</p>
                  <div className="flex items-center gap-4 text-[10px] text-slate-400">
                    <span><i className="ri-send-plane-line mr-1" />{campaign.sent.toLocaleString()}</span>
                    <span><i className="ri-check-line mr-1" />{campaign.delivered.toLocaleString()}</span>
                    <span><i className="ri-eye-line mr-1" />{campaign.read.toLocaleString()}</span>
                    <span><i className="ri-reply-line mr-1" />{campaign.replies}</span>
                    <span><i className="ri-user-add-line mr-1" />{campaign.leads} leads</span>
                    <span><i className="ri-time-line mr-1" />{campaign.sentAt}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'Templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {smsTemplates.map((template) => (
            <div key={template.id} className="bg-white rounded-2xl p-4 border border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${template.category === 'Promotional' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                  {template.category}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-800 mb-2">{template.name}</p>
              <div className="bg-slate-50 rounded-xl p-3 mb-3">
                <p className="text-xs text-slate-600 leading-relaxed">{template.message}</p>
              </div>
              <button
                onClick={() => { setSelectedTemplate(template.id); setMessageText(template.message); setShowCompose(true); }}
                className="w-full py-2 rounded-xl text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
                style={{ background: '#DC1F1F' }}
              >
                Use Template
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Segments Tab */}
      {activeTab === 'Segments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {smsSegments.map((segment) => (
            <div key={segment.id} className="bg-white rounded-2xl p-4 border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-800">{segment.name}</p>
                <span className="text-lg font-bold" style={{ color: '#DC1F1F' }}>{segment.count.toLocaleString()}</span>
              </div>
              <p className="text-xs text-slate-500 mb-4">{segment.description}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(segment.count / 2840) * 100}%`, background: '#DC1F1F' }} />
                </div>
                <span className="text-[10px] text-slate-400">{Math.round((segment.count / 2840) * 100)}%</span>
              </div>
              <button
                onClick={() => { setSelectedSegment(segment.id); setShowCompose(true); }}
                className="w-full mt-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer whitespace-nowrap"
                style={{ borderColor: '#DC1F1F', color: '#DC1F1F' }}
              >
                Send to Segment
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'Analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl p-5 border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Delivery Funnel</h3>
            <div className="space-y-4">
              {[
                { label: 'Sent', value: smsStats.totalSent, max: smsStats.totalSent, color: '#DC1F1F' },
                { label: 'Delivered', value: smsStats.totalDelivered, max: smsStats.totalSent, color: '#25D366' },
                { label: 'Read', value: smsStats.totalRead, max: smsStats.totalSent, color: '#F59E0B' },
                { label: 'Replied', value: smsStats.totalReplies, max: smsStats.totalSent, color: '#E05A2B' },
                { label: 'Converted to Leads', value: smsStats.totalLeads, max: smsStats.totalSent, color: '#0F172A' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="font-semibold" style={{ color: item.color }}>{item.value.toLocaleString()} ({((item.value / item.max) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(item.value / item.max) * 100}%`, background: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Credit Usage</h3>
            <div className="flex items-center justify-center py-8">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(220,31,31,0.08)" strokeWidth="12" />
                  <circle
                    cx="50" cy="50" r="40" fill="none" stroke="#DC1F1F"
                    strokeWidth="12"
                    strokeDasharray={`${(smsStats.creditsUsed / (smsStats.creditsUsed + smsStats.creditsRemaining)) * 251.2} 251.2`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-2xl font-bold text-slate-800">{Math.round((smsStats.creditsUsed / (smsStats.creditsUsed + smsStats.creditsRemaining)) * 100)}%</p>
                  <p className="text-[10px] text-slate-400">Used</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: '#DC1F1F' }} />
                <span className="text-slate-500">Used: {smsStats.creditsUsed.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-100" />
                <span className="text-slate-500">Remaining: {smsStats.creditsRemaining.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCompose && (
        <ComposeModal
          templates={smsTemplates}
          segments={smsSegments}
          selectedTemplate={selectedTemplate}
          selectedSegment={selectedSegment}
          messageText={messageText}
          onTemplateChange={(id) => {
            setSelectedTemplate(id);
            const t = smsTemplates.find(t => t.id === id);
            if (t) setMessageText(t.message);
          }}
          onSegmentChange={setSelectedSegment}
          onMessageChange={setMessageText}
          onClose={() => setShowCompose(false)}
        />
      )}
    </AdminLayout>
  );
}