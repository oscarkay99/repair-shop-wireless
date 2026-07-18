const medals = ['ri-medal-fill text-amber-400', 'ri-medal-fill text-[hsl(var(--muted-foreground))]', 'ri-medal-fill text-amber-700'];

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  sales?: number;
  revenue: string;
  conversionRate?: string;
  avgResponse?: string;
  trend?: string;
}

interface Props {
  members: TeamMember[];
  onSelect: (id: string) => void;
}

export default function Leaderboard({ members, onSelect }: Props) {
  const salesReps = members.filter((m) => m.role.includes('Sales'));

  return (
    <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Sales Leaderboard</h3>
        <span className="text-xs text-[hsl(var(--muted-foreground))]">This Month</span>
      </div>
      <div className="space-y-3">
        {salesReps.map((m, i) => (
          <div
            key={m.id}
            onClick={() => onSelect(m.id)}
            className="flex items-center gap-4 p-4 rounded-xl border border-[hsl(var(--border))] hover:border-[hsl(var(--border))] hover:shadow-sm transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2 w-12 flex-shrink-0">
              {i < 3 && (
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className={`${medals[i]} text-base`} />
                </div>
              )}
              {i >= 3 && <span className="text-xs font-bold text-[hsl(var(--muted-foreground))] w-5 text-center">#{i + 1}</span>}
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {m.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{m.name}</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{m.role}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-[hsl(var(--foreground))]">{m.sales} sales</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{m.revenue}</p>
            </div>
            <div className="text-right flex-shrink-0 w-20">
              <p className="text-xs font-bold text-emerald-600">{m.conversionRate}</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">close rate</p>
            </div>
            <div className="text-right flex-shrink-0 w-20">
              <p className="text-xs font-medium text-[hsl(var(--foreground))]">{m.avgResponse}</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">response</p>
            </div>
            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
              <i className={`${m.trend === 'up' ? 'ri-arrow-up-line text-emerald-500' : 'ri-arrow-down-line text-red-400'} text-xs`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
