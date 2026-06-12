interface WaStats {
  totalChats: number;
  activeChats: number;
  avgResponseTime: string;
  aiHandled: string;
  conversionRate: string;
  todayMessages: number;
}

interface WaStatsStripProps {
  stats: WaStats;
}

export default function WaStatsStrip({ stats }: WaStatsStripProps) {
  return (
    <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
      {[
        { label: 'Total Chats', value: stats.totalChats.toLocaleString(), icon: 'ri-chat-3-line', color: 'text-emerald-600' },
        { label: 'Active Now', value: stats.activeChats.toString(), icon: 'ri-radio-button-line', color: 'text-rose-500' },
        { label: 'Avg Response', value: stats.avgResponseTime, icon: 'ri-time-line', color: 'text-amber-500' },
        { label: 'AI Handled', value: stats.aiHandled, icon: 'ri-robot-2-line', color: 'text-slate-500' },
        { label: 'Conversion', value: stats.conversionRate, icon: 'ri-arrow-up-circle-line', color: 'text-sky-500' },
        { label: 'Today', value: stats.todayMessages.toString(), icon: 'ri-message-2-line', color: 'text-teal-500' },
      ].map(s => (
        <div key={s.label} className="bg-white rounded-xl p-3 border border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 flex items-center justify-center">
              <i className={`${s.icon} text-sm ${s.color}`} />
            </div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">{s.label}</span>
          </div>
          <p className="text-lg font-bold text-slate-800">{s.value}</p>
        </div>
      ))}
    </div>
  );
}
