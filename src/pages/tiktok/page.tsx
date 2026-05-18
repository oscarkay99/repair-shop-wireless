import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/feature/AdminLayout';
import { tiktokChats, tiktokVideos, tiktokCampaigns, tiktokAutomations } from '@/mocks/tiktok';
import {
  getConversations,
  getMessages,
  sendAgentMessage,
  markConversationRead,
  subscribeToMessages,
  subscribeToConversations,
  type SocialConversation,
  type SocialMessage,
  type SocialContact,
} from '@/services/social';
import { generateAiReply } from '@/services/ai';

import TikTokVideos from './components/TikTokVideos';
import TikTokCampaigns from './components/TikTokCampaigns';
import TikTokAutomations from './components/TikTokAutomations';
import ScheduleVideoModal from './components/ScheduleVideoModal';

const tabs = ['DM Inbox', 'Videos', 'Ad Campaigns', 'AI Automations'];

function getInitials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function TikTokPage() {
  const [activeTab, setActiveTab] = useState('DM Inbox');
  const [conversations, setConversations] = useState<(SocialConversation & { contact: SocialContact })[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SocialMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showNewPost, setShowNewPost] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const selectedConv = conversations.find(c => c.id === selectedConvId) ?? null;

  const totalReach = tiktokCampaigns.reduce((s, c) => s + c.reach, 0);
  const totalLeads = tiktokCampaigns.reduce((s, c) => s + c.leads, 0);
  const totalSpent = tiktokCampaigns.reduce((s, c) => s + c.spent, 0);
  const activeCampaigns = tiktokCampaigns.filter(c => c.status === 'Active').length;
  const formatNumber = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`;

  useEffect(() => {
    getConversations('tiktok').then(convs => {
      setConversations(convs);
      if (convs.length > 0) setSelectedConvId(convs[0].id);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    
    const sub = subscribeToConversations('tiktok', (updated) => {
      setConversations(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
    });
    return () => { sub.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!selectedConvId) return;
    setLoadingMessages(true);
    const conv = conversations.find(c => c.id === selectedConvId);
    getMessages(selectedConvId, 'tiktok', conv?.contact_id)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoadingMessages(false));
    markConversationRead(selectedConvId).catch(console.error);
  }, [selectedConvId]);

  useEffect(() => {
    if (!selectedConvId) return;
    const sub = subscribeToMessages(selectedConvId, (newMsg) => {
      setMessages(prev => [...prev, newMsg]);
    });
    return () => { sub.unsubscribe(); };
  }, [selectedConvId]);

  const handleSend = useCallback(async () => {
    if (!chatInput.trim() || !selectedConvId) return;
    const text = chatInput;
    setChatInput('');
    try {
      const sent = await sendAgentMessage(selectedConvId, 'tiktok', text);
      setMessages(prev => [...prev, sent]);
    } catch (err) { console.error(err); }
  }, [chatInput, selectedConvId]);

  const handleGenerateAiReply = async () => {
    if (!selectedConvId || !messages.length) return;
    setAiGenerating(true);
    try {
      const lastCustomerMsg = [...messages].reverse().find(m => m.sender_type === 'customer');
      if (!lastCustomerMsg) return;
      const { reply } = await generateAiReply({ conversation_id: selectedConvId, channel: 'tiktok', message: lastCustomerMsg.content });
      setChatInput(reply);
    } catch (err) { console.error(err); } finally { setAiGenerating(false); }
  };

  // When no real data, fall back to mock chats
  const useMock = conversations.length === 0;

  return (
    <AdminLayout title="TikTok" subtitle="Command Center · @fixhub">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Total Reach', value: formatNumber(totalReach), icon: 'ri-eye-line', color: '#FE2C55' },
          { label: 'Leads Generated', value: `${totalLeads}`, icon: 'ri-user-add-line', color: '#25F4EE' },
          { label: 'Ad Spend', value: `GHS ${totalSpent.toLocaleString()}`, icon: 'ri-money-dollar-circle-line', color: '#FE2C55' },
          { label: 'Active Campaigns', value: `${activeCampaigns}`, icon: 'ri-fire-line', color: '#25F4EE' },
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

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-100">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${activeTab === tab ? 'text-slate-800 border-b-2' : 'text-slate-400 hover:text-slate-600'}`}
              style={activeTab === tab ? { borderColor: '#FE2C55' } : {}}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === 'DM Inbox' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 min-h-[500px]">
              {/* Chat list */}
              <div className="lg:border-r border-slate-100 lg:pr-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FE2C55, #25F4EE)' }}>
                    <i className="ri-tiktok-fill text-white text-sm" />
                  </div>
                  <span className="text-sm font-bold text-slate-800">Direct Messages</span>
                  <span className="ml-auto text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-semibold">
                    {useMock ? tiktokChats.reduce((s, c) => s + c.unread, 0) : conversations.reduce((s, c) => s + c.unread_count, 0)} new
                  </span>
                </div>

                <div className="space-y-1">
                  {useMock ? (
                    tiktokChats.map(chat => (
                      <button
                        key={chat.id}
                        onClick={() => setSelectedConvId(chat.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer text-left ${selectedConvId === chat.id ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}
                      >
                        <div className="relative flex-shrink-0">
                          <img loading="lazy" decoding="async" src={chat.avatar} alt={chat.name} className="w-10 h-10 rounded-full object-cover" />
                          {chat.online && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white" style={{ background: '#25F4EE' }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-800 truncate">{chat.name}</span>
                            <span className="text-[10px] text-slate-400">{chat.time}</span>
                          </div>
                          <p className="text-xs text-slate-400 truncate">{chat.lastMessage}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{chat.source}</span>
                            <span className="text-[10px] text-slate-400">{chat.followerCount.toLocaleString()} followers</span>
                          </div>
                        </div>
                        {chat.unread > 0 && (
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: '#FE2C55' }}>
                            {chat.unread}
                          </span>
                        )}
                      </button>
                    ))
                  ) : (
                    conversations.map(conv => {
                      const name = conv.contact?.display_name ?? conv.contact?.username ?? 'Unknown';
                      return (
                        <button
                          key={conv.id}
                          onClick={() => setSelectedConvId(conv.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer text-left ${selectedConvId === conv.id ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}
                        >
                          <div className="relative flex-shrink-0">
                            {conv.contact?.avatar_url ? (
                              <img loading="lazy" decoding="async" src={conv.contact.avatar_url} className="w-10 h-10 rounded-full object-cover" alt={name} />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">
                                {getInitials(name)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-slate-800 truncate">{name}</span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 truncate">{conv.status}</p>
                          </div>
                          {conv.unread_count > 0 && (
                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: '#FE2C55' }}>
                              {conv.unread_count}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Chat area */}
              <div className="lg:col-span-2 flex flex-col">
                {useMock ? (
                  // Mock chat view
                  (() => {
                    const mockChat = tiktokChats.find(c => c.id === selectedConvId) ?? tiktokChats[0];
                    return mockChat ? (
                      <>
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                          <img loading="lazy" decoding="async" src={mockChat.avatar} alt={mockChat.name} className="w-10 h-10 rounded-full object-cover" />
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{mockChat.name}</p>
                            <p className="text-xs text-slate-400">{mockChat.followerCount.toLocaleString()} followers · {mockChat.online ? 'Online' : 'Offline'}</p>
                          </div>
                          <div className="ml-auto flex items-center gap-2">
                            <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 cursor-pointer">
                              <i className="ri-more-2-fill text-slate-400" />
                            </button>
                          </div>
                        </div>
                        <div className="flex-1 py-4 space-y-3 overflow-y-auto">
                          {mockChat.storyReply && (
                            <div className="text-center">
                              <span className="text-[10px] text-slate-400 bg-slate-50 px-3 py-1 rounded-full">{mockChat.storyReply}</span>
                            </div>
                          )}
                          {mockChat.messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'them' ? 'justify-start' : 'justify-end'}`}>
                              <div
                                className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${msg.sender === 'them' ? 'bg-slate-100 text-slate-700 rounded-tl-sm' : msg.sender === 'ai' ? 'text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-tr-sm'}`}
                                style={msg.sender === 'ai' ? { background: 'linear-gradient(135deg, #FE2C55, #25F4EE)' } : {}}
                              >
                                <p>{msg.text}</p>
                                <p className={`text-[10px] mt-1 ${msg.sender === 'ai' ? 'text-white/60' : 'text-slate-400'}`}>{msg.time}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={chatInput}
                              onChange={e => setChatInput(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleSend()}
                              placeholder="Type a message..."
                              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                            />
                            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-white cursor-pointer" style={{ background: 'linear-gradient(135deg, #FE2C55, #25F4EE)' }} onClick={handleSend}>
                              <i className="ri-send-plane-fill text-sm" />
                            </button>
                          </div>
                        </div>
                      </>
                    ) : null;
                  })()
                ) : (
                  // Real data chat view
                  selectedConv ? (
                    <>
                      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">
                          {getInitials(selectedConv.contact?.display_name ?? null)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{selectedConv.contact?.display_name ?? 'Unknown'}</p>
                          <p className="text-xs text-slate-400">{selectedConv.status}</p>
                        </div>
                        <div className="ml-auto">
                          <button
                            onClick={handleGenerateAiReply}
                            disabled={aiGenerating}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium text-white cursor-pointer disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg, #FE2C55, #25F4EE)' }}
                          >
                            <i className={aiGenerating ? 'ri-loader-4-line animate-spin' : 'ri-sparkling-2-line'} />
                            {aiGenerating ? 'Generating...' : 'AI Reply'}
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 py-4 space-y-3 overflow-y-auto">
                        {loadingMessages ? (
                          <div className="flex items-center justify-center py-8">
                            <i className="ri-loader-4-line animate-spin text-2xl text-slate-400" />
                          </div>
                        ) : messages.map((msg, i) => (
                          <div key={msg.id ?? i} className={`flex ${msg.sender_type === 'customer' ? 'justify-start' : 'justify-end'}`}>
                            <div
                              className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${msg.sender_type === 'customer' ? 'bg-slate-100 text-slate-700 rounded-tl-sm' : 'text-white rounded-tr-sm'}`}
                              style={msg.sender_type !== 'customer' ? { background: 'linear-gradient(135deg, #FE2C55, #25F4EE)' } : {}}
                            >
                              <p>{msg.content}</p>
                              <p className={`text-[10px] mt-1 ${msg.sender_type !== 'customer' ? 'text-white/60' : 'text-slate-400'}`}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            placeholder="Type a message..."
                            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                          />
                          <button
                            onClick={handleSend}
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white cursor-pointer"
                            style={{ background: 'linear-gradient(135deg, #FE2C55, #25F4EE)' }}
                          >
                            <i className="ri-send-plane-fill text-sm" />
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      <div className="text-center">
                        <i className="ri-tiktok-line text-4xl block mb-2" />
                        <p className="text-sm">Select a conversation</p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {activeTab === 'Videos' && (
            <TikTokVideos videos={tiktokVideos} onNewVideo={() => setShowNewPost(true)} formatNumber={formatNumber} />
          )}
          {activeTab === 'Ad Campaigns' && (
            <TikTokCampaigns campaigns={tiktokCampaigns} formatNumber={formatNumber} />
          )}
          {activeTab === 'AI Automations' && (
            <TikTokAutomations automations={tiktokAutomations} />
          )}
        </div>
      </div>

      <ScheduleVideoModal open={showNewPost} onClose={() => setShowNewPost(false)} />
    </AdminLayout>
  );
}
