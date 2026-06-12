interface WaBroadcast {
  id: string;
  name: string;
  status: string;
  segment: string;
  date: string;
  message: string;
  sent: number;
  delivered: number;
  read: number;
  replied: number;
}

interface WaBroadcastsProps {
  broadcasts: WaBroadcast[];
  onNewBroadcast: () => void;
}

export default function WaBroadcasts({ broadcasts, onNewBroadcast }: WaBroadcastsProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800">Broadcast Campaigns</h3>
        <button
          onClick={onNewBroadcast}
          className="flex items-center gap-2 px-4 py-2 text-white rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap hover:opacity-90"
          style={{ background: '#DC1F1F' }}
        >
          <i className="ri-add-line" />New Broadcast
        </button>
      </div>
      <div className="space-y-3">
        {broadcasts.map(b => (
          <div key={b.id} className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-bold text-slate-800">{b.name}</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${b.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    {b.status === 'completed' ? 'Completed' : 'Scheduled'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{b.segment} · {b.date}</p>
              </div>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 cursor-pointer">
                <i className="ri-more-2-line text-slate-400 text-sm" />
              </button>
            </div>
            <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 mb-4 leading-relaxed">{b.message}</p>
            {b.status === 'completed' && (
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Sent', value: b.sent, icon: 'ri-send-plane-line', color: 'text-slate-500' },
                  { label: 'Delivered', value: b.delivered, icon: 'ri-check-double-line', color: 'text-sky-500' },
                  { label: 'Read', value: b.read, icon: 'ri-eye-line', color: 'text-emerald-500' },
                  { label: 'Replied', value: b.replied, icon: 'ri-reply-line', color: 'text-slate-500' },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className="w-5 h-5 flex items-center justify-center mx-auto mb-1">
                      <i className={`${s.icon} text-sm ${s.color}`} />
                    </div>
                    <p className="text-sm font-bold text-slate-800">{s.value}</p>
                    <p className="text-[10px] text-slate-400">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
