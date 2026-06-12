import { useEffect } from 'react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useTechnicians } from '@/hooks/useTechnicians';
import { useTickets } from '@/hooks/useTickets';
import { Plus, Star, CheckCircle2, Clock } from 'lucide-react';

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  available: { bg: 'hsl(var(--status-ready-bg))',       color: 'hsl(var(--status-ready))' },
  busy:      { bg: 'hsl(var(--status-in-progress-bg))', color: 'hsl(var(--status-in-progress))' },
  off_duty:  { bg: 'hsl(var(--status-completed-bg))',   color: 'hsl(var(--status-completed))' },
};
const STATUS_LABEL: Record<string, string> = { available: 'Available', busy: 'Busy', off_duty: 'Off Duty' };

export default function TechniciansPage() {
  const { setPageTitle } = usePageTitle();
  const { technicians, loading } = useTechnicians();
  const { tickets } = useTickets();

  useEffect(() => {
    setPageTitle({ title: 'Technicians', subtitle: 'Manage repair technicians and workloads' });
    return () => setPageTitle({ title: 'Dashboard' });
  }, [setPageTitle]);

  const activeTicketCount = (techId: string) =>
    tickets.filter(t => t.technician_id === techId && !['completed', 'cancelled'].includes(t.status)).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {loading ? '…' : `${technicians.length} technicians`}
        </p>
        <button className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: 'hsl(var(--primary))' }}>
          <Plus className="w-3.5 h-3.5" /> Add Technician
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {technicians.map(tech => {
            const s = STATUS_STYLE[tech.status] ?? STATUS_STYLE.available;
            const active = activeTicketCount(tech.id);
            return (
              <div key={tech.id}
                className="rounded-xl border p-4 space-y-3 cursor-pointer transition-colors"
                style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--primary) / 0.4)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border))'; }}>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ background: 'hsl(0 80% 20%)' }}>
                    {tech.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: s.bg, color: s.color }}>
                    {STATUS_LABEL[tech.status] ?? tech.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{tech.name}</p>
                  <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{tech.specialty || 'General'}</p>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" style={{ color: 'hsl(var(--muted-foreground))' }} />
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>{active} active</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3" style={{ color: 'hsl(38 90% 65%)' }} />
                    <span style={{ color: 'hsl(var(--foreground))' }}>{tech.rating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="pt-2 border-t text-xs flex items-center gap-1" style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
                  <CheckCircle2 className="w-3 h-3" style={{ color: 'hsl(var(--status-ready))' }} />
                  {tech.total_completed} completed all-time
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
