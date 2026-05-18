import { useState, useRef, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/feature/AdminLayout';
import { igPosts, igCampaigns, igStats } from '@/mocks/instagram';
import {
  getConversations,
  getMessages,
  sendAgentMessage,
  markConversationRead,
  toggleAiEnabled,
  subscribeToMessages,
  subscribeToConversations,
  type SocialConversation,
  type SocialMessage,
  type SocialContact,
} from '@/services/social';
import { generateAiReply } from '@/services/ai';

import IgStatsStrip from './components/IgStatsStrip';
import IgPosts from './components/IgPosts';
import IgCampaigns from './components/IgCampaigns';
import IgAutomations from './components/IgAutomations';
import SchedulePostModal from './components/SchedulePostModal';

type Tab = 'inbox' | 'posts' | 'campaigns' | 'automations';

const avatarColors = ['bg-orange-500', 'bg-pink-500', 'bg-violet-500', 'bg-rose-500', 'bg-sky-500', 'bg-teal-500', 'bg-amber-500'];
function getAvatarColor(id: string) { return avatarColors[id.charCodeAt(0) % avatarColors.length]; }
function getInitials(name: string | null) { if (!name) return '?'; return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2); }

export default function InstagramPage() {
  const [tab, setTab] = useState<Tab>('inbox');
  const [conversations, setConversations] = useState<(SocialConversation & { contact: SocialContact })[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SocialMessage[]>([]);
  const [message, setMessage] = useState('');
  const [postModal, setPostModal] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConv = conversations.find(c => c.id === selectedConvId) ?? null;
  const aiEnabled = selectedConv?.ai_enabled ?? true;

  useEffect(() => {
    getConversations('instagram').then(convs => {
      setConversations(convs);
      if (convs.length > 0) setSelectedConvId(convs[0].id);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    
    const sub = subscribeToConversations('instagram', (updated) => {
      setConversations(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
    });
    return () => { sub.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!selectedConvId) return;
    setLoadingMessages(true);
    const conv = conversations.find(c => c.id === selectedConvId);
    getMessages(selectedConvId, 'instagram', conv?.contact_id)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoadingMessages(false));
    markConversationRead(selectedConvId).catch(console.error);
    setConversations(prev => prev.map(c => c.id === selectedConvId ? { ...c, unread_count: 0 } : c));
  }, [selectedConvId]);

  useEffect(() => {
    if (!selectedConvId) return;
    const sub = subscribeToMessages(selectedConvId, (newMsg) => {
      setMessages(prev => [...prev, newMsg]);
    });
    return () => { sub.unsubscribe(); };
  }, [selectedConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!message.trim() || !selectedConvId) return;
    const text = message;
    setMessage('');
    try {
      const sent = await sendAgentMessage(selectedConvId, 'instagram', text);
      setMessages(prev => [...prev, sent]);
    } catch (err) { console.error(err); }
  }, [message, selectedConvId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleGenerateAiReply = async () => {
    if (!selectedConvId || !messages.length) return;
    setAiGenerating(true);
    try {
      const lastCustomerMsg = [...messages].reverse().find(m => m.sender_type === 'customer');
      if (!lastCustomerMsg) return;
      const { reply } = await generateAiReply({ conversation_id: selectedConvId, channel: 'instagram', message: lastCustomerMsg.content });
      setMessage(reply);
    } catch (err) { console.error(err); } finally { setAiGenerating(false); }
  };

  const handleToggleAi = async () => {
    if (!selectedConvId) return;
    const newVal = !aiEnabled;
    setConversations(prev => prev.map(c => c.id === selectedConvId ? { ...c, ai_enabled: newVal } : c));
    await toggleAiEnabled(selectedConvId, newVal).catch(console.error);
  };

  return (
    <AdminLayout title="Instagram Command Center" subtitle="DM inbox, post analytics, ad campaigns & AI auto-replies">
      <IgStatsStrip />

      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit mb-5">
        {(['inbox', 'posts', 'campaigns', 'automations'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap capitalize ${tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t === 'inbox' && <><i className="ri-message-3-line mr-1.5" />DM Inbox</>}
            {t === 'posts' && <><i className="ri-image-line mr-1.5" />Posts & Reels</>}
            {t === 'campaigns' && <><i className="ri-advertisement-line mr-1.5" />Ad Campaigns</>}
            {t === 'automations' && <><i className="ri-robot-2-line mr-1.5" />AI Automations</>}
          </button>
        ))}
      </div>

      {tab === 'inbox' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden" style={{ height: '620px' }}>
          <div className="flex h-full">
            {/* Contact list */}
            <div className="w-[300px] border-r border-slate-100 flex flex-col flex-shrink-0">
              <div className="p-3 border-b border-slate-100">
                <div className="relative">
                  <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input className="w-full pl-8 pr-3 py-2 bg-slate-50 rounded-lg text-sm outline-none" placeholder="Search DMs..." />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.map(conv => {
                  const contact = conv.contact;
                  const name = contact?.username ?? contact?.display_name ?? 'Unknown';
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConvId(conv.id)}
                      className={`w-full flex items-start gap-3 p-3 border-b border-slate-50 hover:bg-slate-50 transition-all cursor-pointer text-left ${selectedConvId === conv.id ? 'bg-pink-50' : ''}`}
                    >
                      <div className="relative flex-shrink-0">
                        {contact?.avatar_url ? (
                          <img loading="lazy" decoding="async" src={contact.avatar_url} className="w-10 h-10 rounded-full object-cover" alt={name} />
                        ) : (
                          <div className={`w-10 h-10 rounded-full ${getAvatarColor(conv.id)} flex items-center justify-center text-white text-xs font-bold`}>
                            {getInitials(contact?.display_name ?? null)}
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-pink-500 rounded-full border-2 border-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm font-semibold text-slate-800 truncate">@{name}</span>
                          <span className="text-[10px] text-slate-400 ml-1">
                            {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{conv.status}</p>
                        {conv.unread_count > 0 && (
                          <span className="mt-1 inline-flex w-4 h-4 bg-pink-500 rounded-full text-white text-[10px] items-center justify-center font-bold">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
                {conversations.length === 0 && (
                  <div className="p-8 text-center text-sm text-slate-400">
                    <i className="ri-instagram-line text-2xl block mb-2" />
                    No DMs yet.<br />Messages will appear here when followers DM you.
                  </div>
                )}
              </div>
            </div>

            {/* Chat area */}
            {selectedConv ? (
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full ${getAvatarColor(selectedConv.id)} flex items-center justify-center text-white text-xs font-bold`}>
                      {getInitials(selectedConv.contact?.display_name ?? null)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">@{selectedConv.contact?.username ?? selectedConv.contact?.display_name ?? 'Unknown'}</p>
                      <p className="text-xs text-slate-400">{selectedConv.contact?.display_name ?? ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-3 py-1.5">
                      <span className="text-xs text-slate-500">AI Auto-Reply</span>
                      <button onClick={handleToggleAi} className={`relative w-8 h-4 rounded-full transition-all cursor-pointer ${aiEnabled ? 'bg-pink-500' : 'bg-slate-300'}`}>
                        <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${aiEnabled ? 'left-4' : 'left-0.5'}`} />
                      </button>
                    </div>
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 cursor-pointer">
                      <i className="ri-more-2-line text-slate-500 text-sm" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <i className="ri-loader-4-line animate-spin text-2xl text-slate-400" />
                    </div>
                  ) : messages.map((msg, i) => (
                    <div key={msg.id ?? i} className={`flex ${msg.sender_type === 'customer' ? 'justify-start' : 'justify-end'}`}>
                      <div className="max-w-[70%]">
                        {msg.sender_type !== 'customer' && (
                          <div className="flex items-center gap-1 mb-1 justify-end">
                            {msg.ai_generated && (
                              <span className="text-[10px] bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded-full font-medium">
                                <i className="ri-robot-2-line mr-0.5" />AI
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">{msg.sender_type === 'ai' ? 'AI Agent' : 'You'}</span>
                          </div>
                        )}
                        <div
                          className={`px-3 py-2 rounded-2xl text-sm whitespace-pre-line ${
                            msg.sender_type === 'customer'
                              ? 'bg-white text-slate-700 rounded-tl-sm border border-slate-100'
                              : 'text-white rounded-tr-sm'
                          }`}
                          style={msg.sender_type !== 'customer' ? { background: msg.ai_generated ? '#E1306C' : '#C01050' } : {}}
                        >
                          {msg.content}
                        </div>
                        <p className={`text-[10px] text-slate-400 mt-1 ${msg.sender_type === 'customer' ? 'text-left' : 'text-right'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-3 border-t border-slate-100 bg-white">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2">
                      <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Reply to DM..."
                        rows={1}
                        className="w-full bg-transparent text-sm text-slate-700 outline-none resize-none"
                      />
                    </div>
                    <button
                      onClick={sendMessage}
                      className="w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer hover:opacity-90"
                      style={{ background: '#E1306C' }}
                    >
                      <i className="ri-send-plane-fill text-white text-sm" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={handleGenerateAiReply}
                      disabled={aiGenerating}
                      className="text-xs cursor-pointer flex items-center gap-1 disabled:opacity-50"
                      style={{ color: '#E1306C' }}
                    >
                      <i className={`${aiGenerating ? 'ri-loader-4-line animate-spin' : 'ri-sparkling-2-line'}`} />
                      {aiGenerating ? 'Generating...' : 'Generate AI Reply'}
                    </button>
                    <button className="text-xs cursor-pointer flex items-center gap-1 text-violet-600">
                      <i className="ri-image-add-line" />Send Product Photo
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <i className="ri-instagram-line text-4xl block mb-3" />
                  <p className="text-sm">Select a DM to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'posts' && <IgPosts posts={igPosts} onNewPost={() => setPostModal(true)} />}
      {tab === 'campaigns' && <IgCampaigns campaigns={igCampaigns} />}
      {tab === 'automations' && <IgAutomations />}

      <SchedulePostModal open={postModal} onClose={() => setPostModal(false)} />
    </AdminLayout>
  );
}
