import { useState, useRef, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/feature/AdminLayout';
import { waStats } from '@/mocks/whatsapp';
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

import WaStatsStrip from './components/WaStatsStrip';
import WaBroadcasts from './components/WaBroadcasts';
import WaAutomations from './components/WaAutomations';
import NewBroadcastModal from './components/NewBroadcastModal';
import { waBroadcasts } from '@/mocks/whatsapp';

type Tab = 'inbox' | 'broadcasts' | 'automations';

const statusColors: Record<string, string> = {
  hot_lead: 'bg-rose-100 text-rose-600',
  trade_in: 'bg-amber-100 text-amber-600',
  inquiry: 'bg-sky-100 text-sky-600',
  repair: 'bg-cyan-100 text-cyan-600',
  customer: 'bg-emerald-100 text-emerald-600',
  open: 'bg-sky-100 text-sky-600',
};

const avatarColors = ['bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-sky-500', 'bg-teal-500'];

function getAvatarColor(id: string): string {
  const idx = id.charCodeAt(0) % avatarColors.length;
  return avatarColors[idx];
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function WhatsAppPage() {
  const [tab, setTab] = useState<Tab>('inbox');
  const [conversations, setConversations] = useState<(SocialConversation & { contact: SocialContact })[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SocialMessage[]>([]);
  const [message, setMessage] = useState('');
  const [broadcastModal, setBroadcastModal] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConv = conversations.find(c => c.id === selectedConvId) ?? null;
  const aiEnabled = selectedConv?.ai_enabled ?? true;

  useEffect(() => {
    getConversations('whatsapp').then(convs => {
      setConversations(convs);
      if (convs.length > 0) setSelectedConvId(convs[0].id);
    }).catch(console.error);
  }, []);

  // Realtime: update conversation list when any conversation changes
  useEffect(() => {
    
    const sub = subscribeToConversations('whatsapp', (updated) => {
      setConversations(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
    });
    return () => { sub.unsubscribe(); };
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (!selectedConvId) return;
    setLoadingMessages(true);
    const conv = conversations.find(c => c.id === selectedConvId);
    getMessages(selectedConvId, 'whatsapp', conv?.contact_id)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoadingMessages(false));
    markConversationRead(selectedConvId).catch(console.error);
    setConversations(prev => prev.map(c => c.id === selectedConvId ? { ...c, unread_count: 0 } : c));
  }, [selectedConvId]);

  // Realtime: append new messages to active conversation
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
      const sent = await sendAgentMessage(selectedConvId, 'whatsapp', text);
      setMessages(prev => [...prev, sent]);
    } catch (err) {
      console.error('Send failed:', err);
    }
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
      const { reply } = await generateAiReply({
        conversation_id: selectedConvId,
        channel: 'whatsapp',
        message: lastCustomerMsg.content,
      });
      setMessage(reply);
    } catch (err) {
      console.error('AI generate failed:', err);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleToggleAi = async () => {
    if (!selectedConvId) return;
    const newVal = !aiEnabled;
    setConversations(prev => prev.map(c => c.id === selectedConvId ? { ...c, ai_enabled: newVal } : c));
    await toggleAiEnabled(selectedConvId, newVal).catch(console.error);
  };

  return (
    <AdminLayout title="WhatsApp Command Center" subtitle="Live customer conversations, AI auto-replies & broadcast campaigns">
      <WaStatsStrip stats={waStats} />

      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit mb-5">
        {(['inbox', 'broadcasts', 'automations'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap capitalize ${tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t === 'inbox' && <><i className="ri-inbox-line mr-1.5" />Inbox</>}
            {t === 'broadcasts' && <><i className="ri-broadcast-line mr-1.5" />Broadcasts</>}
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
                  <input className="w-full pl-8 pr-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-700 outline-none" placeholder="Search chats..." />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.map(conv => {
                  const contact = conv.contact;
                  const name = contact?.display_name ?? contact?.phone ?? 'Unknown';
                  const initials = getInitials(name);
                  const avatarColor = getAvatarColor(conv.id);
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConvId(conv.id)}
                      className={`w-full flex items-start gap-3 p-3 border-b border-slate-50 hover:bg-slate-50 transition-all cursor-pointer text-left ${selectedConvId === conv.id ? 'bg-[rgba(236,1,24,0.05)]' : ''}`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold`}>
                          {initials}
                        </div>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm font-semibold text-slate-800 truncate">{name}</span>
                          <span className="text-[10px] text-slate-400 flex-shrink-0 ml-1">
                            {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{contact?.phone ?? ''}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColors[conv.status] ?? statusColors.open}`}>
                            {conv.status.replace('_', ' ')}
                          </span>
                          {conv.unread_count > 0 && (
                            <span className="w-4 h-4 bg-emerald-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
                {conversations.length === 0 && (
                  <div className="p-8 text-center text-sm text-slate-400">
                    <i className="ri-message-3-line text-2xl block mb-2" />
                    No conversations yet.<br />Messages will appear here when customers DM you.
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
                      <p className="text-sm font-semibold text-slate-800">{selectedConv.contact?.display_name ?? selectedConv.contact?.phone ?? 'Unknown'}</p>
                      <p className="text-xs text-slate-400">{selectedConv.contact?.phone ?? ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-3 py-1.5">
                      <span className="text-xs text-slate-500">AI Auto-Reply</span>
                      <button
                        onClick={handleToggleAi}
                        className={`relative w-8 h-4 rounded-full transition-all cursor-pointer ${aiEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
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
                              <span className="text-[10px] bg-cyan-100 text-cyan-600 px-1.5 py-0.5 rounded-full font-medium">
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
                          style={msg.sender_type !== 'customer' ? { background: msg.ai_generated ? '#EC0118' : '#06B6D4' } : {}}
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
                        placeholder="Type a message..."
                        rows={1}
                        className="w-full bg-transparent text-sm text-slate-700 outline-none resize-none"
                      />
                    </div>
                    <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 cursor-pointer">
                      <i className="ri-attachment-2 text-slate-500 text-sm" />
                    </button>
                    <button
                      onClick={sendMessage}
                      className="w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer hover:opacity-90"
                      style={{ background: '#EC0118' }}
                    >
                      <i className="ri-send-plane-fill text-white text-sm" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={handleGenerateAiReply}
                      disabled={aiGenerating}
                      className="text-xs cursor-pointer flex items-center gap-1 disabled:opacity-50"
                      style={{ color: '#EC0118' }}
                    >
                      <i className={`${aiGenerating ? 'ri-loader-4-line animate-spin' : 'ri-sparkling-2-line'}`} />
                      {aiGenerating ? 'Generating...' : 'Generate AI Reply'}
                    </button>
                    <button className="text-xs cursor-pointer flex items-center gap-1" style={{ color: '#F59E0B' }}>
                      <i className="ri-file-add-line" />Create Quote
                    </button>
                    <button className="text-xs cursor-pointer flex items-center gap-1" style={{ color: '#06B6D4' }}>
                      <i className="ri-user-star-line" />Convert to Lead
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <i className="ri-whatsapp-line text-4xl block mb-3" />
                  <p className="text-sm">Select a conversation to start chatting</p>
                </div>
              </div>
            )}

            {/* Right panel */}
            {selectedConv && (
              <div className="w-[220px] border-l border-slate-100 p-4 flex flex-col gap-4 overflow-y-auto">
                <div className="text-center">
                  <div className={`w-14 h-14 rounded-full ${getAvatarColor(selectedConv.id)} flex items-center justify-center text-white text-lg font-bold mx-auto mb-2`}>
                    {getInitials(selectedConv.contact?.display_name ?? null)}
                  </div>
                  <p className="text-sm font-bold text-slate-800">{selectedConv.contact?.display_name ?? 'Unknown'}</p>
                  <p className="text-xs text-slate-400">{selectedConv.contact?.phone ?? ''}</p>
                  <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[selectedConv.status] ?? statusColors.open}`}>
                    {selectedConv.status}
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Quick Actions</p>
                  {[
                    { label: 'Create Quote', icon: 'ri-file-add-line', color: 'text-emerald-600' },
                    { label: 'Add to Leads', icon: 'ri-user-star-line', color: 'text-amber-600' },
                    { label: 'View Profile', icon: 'ri-user-line', color: 'text-sky-600' },
                    { label: 'Send Catalog', icon: 'ri-store-2-line', color: 'text-slate-600' },
                    { label: 'Book Repair', icon: 'ri-tools-line', color: 'text-rose-600' },
                  ].map(a => (
                    <button key={a.label} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer text-left">
                      <i className={`${a.icon} text-sm ${a.color}`} />
                      <span className="text-xs text-slate-700">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'broadcasts' && (
        <WaBroadcasts broadcasts={waBroadcasts} onNewBroadcast={() => setBroadcastModal(true)} />
      )}

      {tab === 'automations' && <WaAutomations />}

      <NewBroadcastModal open={broadcastModal} onClose={() => setBroadcastModal(false)} />
    </AdminLayout>
  );
}
