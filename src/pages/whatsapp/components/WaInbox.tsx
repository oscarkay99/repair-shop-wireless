const statusColors: Record<string, string> = {
  hot_lead: 'bg-rose-100 text-rose-600',
  trade_in: 'bg-amber-100 text-amber-600',
  inquiry: 'bg-sky-100 text-sky-600',
  repair: 'bg-cyan-100 text-cyan-600',
  customer: 'bg-emerald-100 text-emerald-600',
};

const statusLabels: Record<string, string> = {
  hot_lead: 'Hot Lead',
  trade_in: 'Trade-In',
  inquiry: 'Inquiry',
  repair: 'Repair',
  customer: 'Customer',
};

interface WaContact {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  avatarColor: string;
  online: boolean;
  time: string;
  lastMessage: string;
  status: string;
  unread: number;
}

interface WaMessage {
  from: 'customer' | 'agent' | 'ai';
  text: string;
  time: string;
  aiGenerated?: boolean;
}

interface WaInboxProps {
  contacts: WaContact[];
  conversations: Record<string, WaMessage[]>;
  selectedContact: WaContact;
  onSelectContact: (contact: WaContact) => void;
  message: string;
  onMessageChange: (val: string) => void;
  onSendMessage: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  aiEnabled: boolean;
  onToggleAi: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export default function WaInbox({
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
}: WaInboxProps) {
  const currentMessages = conversations[selectedContact.id] || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden" style={{ height: '620px' }}>
      <div className="flex h-full">
        {/* Contact List */}
        <div className="w-[300px] border-r border-slate-100 flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input className="w-full pl-8 pr-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-700 outline-none" placeholder="Search chats..." />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {contacts.map(contact => (
              <button
                key={contact.id}
                onClick={() => onSelectContact(contact)}
                className={`w-full flex items-start gap-3 p-3 border-b border-slate-50 hover:bg-slate-50 transition-all cursor-pointer text-left ${selectedContact.id === contact.id ? 'bg-[rgba(236,1,24,0.05)]' : ''}`}
              >
                <div className="relative flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full ${contact.avatarColor} flex items-center justify-center text-white text-xs font-bold`}>
                    {contact.avatar}
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
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColors[contact.status]}`}>
                      {statusLabels[contact.status]}
                    </span>
                    {contact.unread > 0 && (
                      <span className="w-4 h-4 bg-emerald-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
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
              <div className={`w-9 h-9 rounded-full ${selectedContact.avatarColor} flex items-center justify-center text-white text-xs font-bold`}>
                {selectedContact.avatar}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{selectedContact.name}</p>
                <p className="text-xs text-slate-400">{selectedContact.phone} · {selectedContact.online ? 'Online' : 'Offline'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-3 py-1.5">
                <span className="text-xs text-slate-500">AI Auto-Reply</span>
                <button
                  onClick={onToggleAi}
                  className={`relative w-8 h-4 rounded-full transition-all cursor-pointer ${aiEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${aiEnabled ? 'left-4' : 'left-0.5'}`} />
                </button>
              </div>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 cursor-pointer">
                <i className="ri-phone-line text-slate-500 text-sm" />
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
                        <span className="text-[10px] bg-[rgba(236,1,24,0.08)] text-[#EC0118] px-1.5 py-0.5 rounded-full font-medium">
                          <i className="ri-robot-2-line mr-0.5" />AI
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">{msg.from === 'ai' ? 'AI Agent' : 'You'}</span>
                    </div>
                  )}
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm whitespace-pre-line ${
                      msg.from === 'customer'
                        ? 'bg-white text-slate-700 rounded-tl-sm border border-slate-100'
                        : 'text-white rounded-tr-sm'
                    }`}
                    style={msg.from !== 'customer' ? { background: msg.aiGenerated ? '#EC0118' : '#06B6D4' } : {}}
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
                  placeholder="Type a message..."
                  rows={1}
                  className="w-full bg-transparent text-sm text-slate-700 outline-none resize-none"
                />
              </div>
              <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 cursor-pointer">
                <i className="ri-attachment-2 text-slate-500 text-sm" />
              </button>
              <button
                onClick={onSendMessage}
                className="w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer hover:opacity-90"
                style={{ background: '#EC0118' }}
              >
                <i className="ri-send-plane-fill text-white text-sm" />
              </button>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <button className="text-xs cursor-pointer flex items-center gap-1" style={{ color: '#EC0118' }}>
                <i className="ri-sparkling-2-line" />Generate AI Reply
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

        {/* Right Panel */}
        <div className="w-[220px] border-l border-slate-100 p-4 flex flex-col gap-4 overflow-y-auto">
          <div className="text-center">
            <div className={`w-14 h-14 rounded-full ${selectedContact.avatarColor} flex items-center justify-center text-white text-lg font-bold mx-auto mb-2`}>
              {selectedContact.avatar}
            </div>
            <p className="text-sm font-bold text-slate-800">{selectedContact.name}</p>
            <p className="text-xs text-slate-400">{selectedContact.phone}</p>
            <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[selectedContact.status]}`}>
              {statusLabels[selectedContact.status]}
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
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className={`${a.icon} text-sm ${a.color}`} />
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
