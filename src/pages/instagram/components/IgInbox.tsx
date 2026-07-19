import { igStats } from '@/mocks/instagram';

const igGradient = 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)';

const statusColors: Record<string, string> = {
  hot_lead: 'bg-rose-100 text-rose-600',
  inquiry: 'bg-amber-100 text-amber-600',
  customer: 'bg-emerald-100 text-emerald-700',
};
const statusLabels: Record<string, string> = {
  hot_lead: 'Hot Lead',
  inquiry: 'Inquiry',
  customer: 'Customer',
};

interface IgContact {
  id: string;
  name: string;
  displayName: string;
  avatar: string;
  avatarColor: string;
  online: boolean;
  time: string;
  lastMessage: string;
  source: string;
  unread: number;
  status: string;
  followers: string;
}

interface IgMessage {
  from: 'customer' | 'agent' | 'ai';
  text: string;
  time: string;
  aiGenerated?: boolean;
  mediaType?: string;
}

interface IgInboxProps {
  contacts: IgContact[];
  conversations: Record<string, IgMessage[]>;
  selectedContact: IgContact;
  onSelectContact: (contact: IgContact) => void;
  message: string;
  onMessageChange: (val: string) => void;
  onSendMessage: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  aiEnabled: boolean;
  onToggleAi: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export default function IgInbox({
  contacts,
  conversations,
  selectedContact,
  onSelectContact,
  message,
  onMessageChange,
  onSendMessage,
  onKeyDown,
  aiEnabled,
  onToggleAi,
  messagesEndRef,
}: IgInboxProps) {
  const currentMessages = conversations[selectedContact.id] || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden" style={{ height: '620px' }}>
      <div className="flex h-full">
        {/* Contact List */}
        <div className="w-[300px] border-r border-slate-100 flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: igGradient }}>
                <i className="ri-instagram-line text-white text-sm" />
              </div>
              <span className="text-sm font-bold text-slate-800">@fixhub</span>
              <span className="ml-auto text-[10px] text-slate-400">{igStats.followers} followers</span>
            </div>
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input className="w-full pl-8 pr-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-700 outline-none" placeholder="Search DMs..." />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {contacts.map(contact => (
              <button
                key={contact.id}
                onClick={() => onSelectContact(contact)}
                className={`w-full flex items-start gap-3 p-3 border-b border-slate-50 hover:bg-slate-50 transition-all cursor-pointer text-left ${selectedContact.id === contact.id ? 'bg-pink-50' : ''}`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full p-0.5" style={{ background: contact.online ? igGradient : '#e2e8f0' }}>
                    <div className={`w-full h-full rounded-full ${contact.avatarColor} flex items-center justify-center text-white text-xs font-bold border-2 border-white`}>
                      {contact.avatar}
                    </div>
                  </div>
                  {contact.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-semibold text-slate-800 truncate">{contact.name}</span>
                    <span className="text-[10px] text-slate-400 flex-shrink-0 ml-1">{contact.time}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{contact.lastMessage}</p>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400">{contact.source}</span>
                    </div>
                    {contact.unread > 0 && (
                      <span className="w-4 h-4 rounded-full text-white text-[10px] flex items-center justify-center font-bold" style={{ background: igGradient }}>
                        {contact.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full p-0.5" style={{ background: igGradient }}>
                <div className={`w-full h-full rounded-full ${selectedContact.avatarColor} flex items-center justify-center text-white text-xs font-bold border-2 border-white`}>
                  {selectedContact.avatar}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{selectedContact.name}</p>
                <p className="text-xs text-slate-400">{selectedContact.displayName} · {selectedContact.followers} followers</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-3 py-1.5">
                <span className="text-xs text-slate-500">AI Auto-Reply</span>
                <button
                  onClick={onToggleAi}
                  className="relative w-8 h-4 rounded-full transition-all cursor-pointer"
                  style={{ background: aiEnabled ? undefined : '#cbd5e1' }}
                >
                  {aiEnabled && <span className="absolute inset-0 rounded-full" style={{ background: igGradient }} />}
                  <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all z-10 ${aiEnabled ? 'left-4' : 'left-0.5'}`} />
                </button>
              </div>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 cursor-pointer">
                <i className="ri-instagram-line text-slate-500 text-sm" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 cursor-pointer">
                <i className="ri-more-2-line text-slate-500 text-sm" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            {currentMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === 'customer' ? 'justify-start' : 'justify-end'}`}>
                <div className="max-w-[70%]">
                  {msg.from !== 'customer' && (
                    <div className="flex items-center gap-1 mb-1 justify-end">
                      {msg.aiGenerated && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white" style={{ background: igGradient }}>
                          <i className="ri-robot-2-line mr-0.5" />AI
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">{msg.from === 'ai' ? 'AI Agent' : 'You'}</span>
                    </div>
                  )}
                  {msg.mediaType && (
                    <div className="mb-1 flex items-center gap-1 text-[10px] text-slate-400">
                      <i className={`${msg.mediaType === 'story' ? 'ri-slideshow-line' : msg.mediaType === 'reel' ? 'ri-film-line' : 'ri-image-line'} text-xs`} />
                      Replied to your {msg.mediaType}
                    </div>
                  )}
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm whitespace-pre-line ${
                      msg.from === 'customer'
                        ? 'bg-white text-slate-700 rounded-tl-sm border border-slate-100'
                        : 'text-white rounded-tr-sm'
                    }`}
                    style={msg.from !== 'customer' ? { background: msg.aiGenerated ? igGradient : '#EC0118' } : {}}
                  >
                    {msg.text}
                  </div>
                  <p className={`text-[10px] text-slate-400 mt-1 ${msg.from === 'customer' ? 'text-left' : 'text-right'}`}>{msg.time}</p>
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
                  onChange={e => onMessageChange(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Send a DM..."
                  rows={1}
                  className="w-full bg-transparent text-sm text-slate-700 outline-none resize-none"
                />
              </div>
              <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 cursor-pointer">
                <i className="ri-image-line text-slate-500 text-sm" />
              </button>
              <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 cursor-pointer">
                <i className="ri-heart-line text-slate-500 text-sm" />
              </button>
              <button
                onClick={onSendMessage}
                className="w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer hover:opacity-90"
                style={{ background: igGradient }}
              >
                <i className="ri-send-plane-fill text-white text-sm" />
              </button>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <button className="text-xs cursor-pointer flex items-center gap-1" style={{ color: '#dc2743' }}>
                <i className="ri-sparkling-2-line" />Generate AI Reply
              </button>
              <button className="text-xs cursor-pointer flex items-center gap-1" style={{ color: '#F59E0B' }}>
                <i className="ri-file-add-line" />Create Quote
              </button>
              <button className="text-xs cursor-pointer flex items-center gap-1" style={{ color: '#EC0118' }}>
                <i className="ri-user-star-line" />Convert to Lead
              </button>
              <button className="text-xs cursor-pointer flex items-center gap-1 text-slate-500">
                <i className="ri-image-2-line" />Send Product Photo
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-[220px] border-l border-slate-100 p-4 flex flex-col gap-4 overflow-y-auto">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full p-0.5 mx-auto mb-2" style={{ background: igGradient }}>
              <div className={`w-full h-full rounded-full ${selectedContact.avatarColor} flex items-center justify-center text-white text-lg font-bold border-2 border-white`}>
                {selectedContact.avatar}
              </div>
            </div>
            <p className="text-sm font-bold text-slate-800">{selectedContact.displayName}</p>
            <p className="text-xs text-slate-400">@{selectedContact.name}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{selectedContact.followers} followers</p>
            <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[selectedContact.status] || 'bg-slate-100 text-slate-500'}`}>
              {statusLabels[selectedContact.status] || selectedContact.status}
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[10px] text-slate-400 mb-1 font-semibold uppercase tracking-wider">Source</p>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: igGradient }}>
                <i className="ri-instagram-line text-white text-[9px]" />
              </div>
              <span className="text-xs text-slate-700">{selectedContact.source}</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Quick Actions</p>
            {[
              { label: 'Create Quote', icon: 'ri-file-add-line', color: '#EC0118' },
              { label: 'Add to Leads', icon: 'ri-user-star-line', color: '#EC0118' },
              { label: 'View Profile', icon: 'ri-instagram-line', color: '#dc2743' },
              { label: 'Send Catalog', icon: 'ri-store-2-line', color: '#cc2366' },
              { label: 'Book Repair', icon: 'ri-tools-line', color: '#e6683c' },
            ].map(a => (
              <button key={a.label} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer text-left">
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className={`${a.icon} text-sm`} style={{ color: a.color }} />
                </div>
                <span className="text-xs text-slate-700">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
