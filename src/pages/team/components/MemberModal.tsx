interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  sales?: number;
  repairs?: number;
  tasks?: number;
  revenue: string;
  conversionRate?: string;
  avgResponse?: string;
  status: string;
  trend?: string;
}

interface Props {
  member: TeamMember;
  onClose: () => void;
}

export default function MemberModal({ member, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[hsl(var(--card))] rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Team Member</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-pointer">
            <i className="ri-close-line text-base" />
          </button>
        </div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center text-white text-lg font-bold">
            {member.avatar}
          </div>
          <div>
            <h4 className="text-base font-bold text-[hsl(var(--foreground))]">{member.name}</h4>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">{member.role}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {member.sales !== undefined && (
            <div className="bg-[hsl(var(--muted))] rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-[hsl(var(--foreground))]">{member.sales}</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Sales</p>
            </div>
          )}
          {member.conversionRate && (
            <div className="bg-[hsl(var(--muted))] rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-[hsl(var(--foreground))]">{member.conversionRate}</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Close Rate</p>
            </div>
          )}
          {member.avgResponse && (
            <div className="bg-[hsl(var(--muted))] rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-[hsl(var(--foreground))]">{member.avgResponse}</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Avg Response</p>
            </div>
          )}
          <div className="bg-[hsl(var(--muted))] rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-[hsl(var(--foreground))]">{member.revenue}</p>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Revenue</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex-1 py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-all cursor-pointer whitespace-nowrap">
            View Full Report
          </button>
          <button className="flex-1 py-2.5 border border-[hsl(var(--border))] text-[hsl(var(--foreground))] text-xs font-semibold rounded-xl hover:bg-[hsl(var(--muted))] transition-all cursor-pointer whitespace-nowrap">
            Coaching Notes
          </button>
        </div>
      </div>
    </div>
  );
}
