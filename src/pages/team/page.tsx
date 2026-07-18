import { useState } from 'react';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/shared/Pagination';
import AdminLayout from '@/components/feature/AdminLayout';
import { teamMembers, teamStats } from '@/mocks/team';
import Leaderboard from './components/Leaderboard';
import MemberModal from './components/MemberModal';

export default function TeamPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const member = selected ? teamMembers.find((m) => m.id === selected) : null;
  const { paginated, page, setPage, totalPages, total, from, to } = usePagination(teamMembers, 9);

  return (
    <AdminLayout title="Team" subtitle="Performance, leaderboard, and coaching">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {teamStats.map((s) => (
          <div key={s.label} className="bg-[hsl(var(--card))] rounded-2xl p-5 border border-[hsl(var(--border))] relative overflow-hidden">
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${s.accent} rounded-l-2xl`} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))] font-medium uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl font-bold text-[hsl(var(--foreground))] mt-1">{s.value}</p>
                <p className="text-xs text-emerald-600 font-medium mt-1">{s.change}</p>
              </div>
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                <i className={`${s.icon} text-lg`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Leaderboard members={teamMembers} onSelect={setSelected} />

      {/* All Team Members */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginated.map((m) => (
          <div
            key={m.id}
            onClick={() => setSelected(m.id)}
            className="bg-[hsl(var(--card))] rounded-2xl p-5 border border-[hsl(var(--border))] hover:shadow-md hover:border-[hsl(var(--border))] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white text-base font-bold">
                {m.avatar}
              </div>
              <div>
                <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{m.name}</p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{m.role}</p>
              </div>
              <div className="ml-auto">
                <div className={`w-2 h-2 rounded-full ${m.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {m.sales !== undefined && (
                <div className="bg-[hsl(var(--muted))] rounded-xl p-2.5">
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Sales</p>
                  <p className="text-sm font-bold text-[hsl(var(--foreground))]">{m.sales}</p>
                </div>
              )}
              {m.repairs !== undefined && (
                <div className="bg-[hsl(var(--muted))] rounded-xl p-2.5">
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Repairs</p>
                  <p className="text-sm font-bold text-[hsl(var(--foreground))]">{m.repairs}</p>
                </div>
              )}
              {m.tasks !== undefined && (
                <div className="bg-[hsl(var(--muted))] rounded-xl p-2.5">
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Tasks</p>
                  <p className="text-sm font-bold text-[hsl(var(--foreground))]">{m.tasks}</p>
                </div>
              )}
              <div className="bg-[hsl(var(--muted))] rounded-xl p-2.5">
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Revenue</p>
                <p className="text-sm font-bold text-[hsl(var(--foreground))]">{m.revenue}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Pagination page={page} pageCount={totalPages} total={total} pageSize={9} onPageChange={setPage} />
      {member && <MemberModal member={member} onClose={() => setSelected(null)} />}
    </AdminLayout>
  );
}