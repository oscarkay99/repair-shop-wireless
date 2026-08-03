import { useEffect, useMemo, useState } from 'react';
import type { Technician } from '@/types/wireless';
import type { Repair } from '@/types/repair';
import { getPaymentsWithTechnicians } from '@/services/wireless/payments';
import { formatGHS } from '@/utils/currency';
import { avatarColor, initials, TIMELINE_FILTERS, filterHours, type TimelineFilter } from '../shared';

interface Props {
  technicians: Technician[];
  repairs: Repair[];
}

export default function PerformanceTab({ technicians, repairs }: Props) {
  const [timeline, setTimeline] = useState<TimelineFilter>('24hrs');
  const [payments, setPayments] = useState<{ amount: number; created_at: string; technicianIds: string[] }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPaymentsWithTechnicians().then(setPayments).catch(() => setPayments([])).finally(() => setLoading(false));
  }, []);

  const doneHours = filterHours(timeline);
  const doneLabel = timeline === 'All' ? 'Done (all)' : `Done (${timeline})`;

  const stats = useMemo(() => {
    const cutoff = doneHours ? new Date(Date.now() - doneHours * 3_600_000) : null;
    return technicians.map(tech => {
      const myRepairs = repairs.filter(r => r.technicians.some(t => t.id === tech.id));
      const doneRepairs = myRepairs.filter(r =>
        (r.status === 'completed' || r.status === 'diagnosis_only_closed') && r.completedDate &&
        (!cutoff || new Date(r.completedDate) >= cutoff)
      );
      const completedAll = myRepairs.filter(r => (r.status === 'completed' || r.status === 'diagnosis_only_closed') && r.completedDate);
      const avgCompletionHrs = completedAll.length
        ? completedAll.reduce((s, r) => s + (new Date(r.completedDate!).getTime() - new Date(r.createdAt ?? r.started).getTime()), 0)
          / completedAll.length / 3_600_000
        : null;
      const revenue = payments
        .filter(p => p.technicianIds.includes(tech.id) && (!cutoff || new Date(p.created_at) >= cutoff))
        .reduce((s, p) => s + p.amount, 0);

      return { tech, done: doneRepairs.length, avgCompletionHrs, revenue };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [technicians, repairs, payments, doneHours]);

  return (
    <div className="space-y-5">
      {/* Timeline filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Completed in
        </span>
        {TIMELINE_FILTERS.map(f => (
          <button key={f} onClick={() => setTimeline(f)}
            className="px-3 h-7 rounded-full text-xs font-semibold transition-colors"
            style={timeline === f
              ? { background: 'hsl(var(--foreground))', color: 'hsl(var(--background))' }
              : { background: 'transparent', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</div>
      ) : (
        <div className="space-y-3">
          {stats.map(({ tech, done, avgCompletionHrs, revenue }) => {
            const avgLabel = avgCompletionHrs !== null
              ? avgCompletionHrs < 24 ? `${Math.round(avgCompletionHrs)}h` : `${(avgCompletionHrs / 24).toFixed(1)}d`
              : '—';
            return (
              <div key={tech.id} className="rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: avatarColor(tech.name) }}>
                    {initials(tech.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate" style={{ color: 'hsl(var(--foreground))' }}>{tech.name}</p>
                    <p className="text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{tech.specialty || 'General'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 sm:gap-8 text-left sm:text-right">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Revenue (paid)</p>
                    <p className="text-sm font-bold" style={{ color: 'hsl(142 60% 45%)' }}>{formatGHS(revenue)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>{doneLabel}</p>
                    <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>{done}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Avg Turnaround</p>
                    <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>{avgLabel}</p>
                  </div>
                </div>
              </div>
            );
          })}

          {stats.length === 0 && (
            <div className="rounded-xl border py-16 text-center" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>No technicians yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
