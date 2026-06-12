import { useEffect, useState } from 'react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useTickets } from '@/hooks/useTickets';
import { useTechnicians } from '@/hooks/useTechnicians';
import { ClipboardList, Plus, Search, Filter } from 'lucide-react';
import type { TicketStatus } from '@/types/wireless';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending', in_progress: 'In Progress', waiting_parts: 'Waiting Parts',
  ready: 'Ready', completed: 'Completed', cancelled: 'Cancelled',
};
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:       { bg: 'hsl(var(--status-pending-bg))',     color: 'hsl(var(--status-pending))' },
  in_progress:   { bg: 'hsl(var(--status-in-progress-bg))', color: 'hsl(var(--status-in-progress))' },
  waiting_parts: { bg: 'hsl(38 70% 14%)', color: 'hsl(38 90% 65%)' },
  ready:         { bg: 'hsl(var(--status-ready-bg))',       color: 'hsl(var(--status-ready))' },
  completed:     { bg: 'hsl(var(--status-completed-bg))',   color: 'hsl(var(--status-completed))' },
  cancelled:     { bg: 'hsl(0 0% 10%)', color: 'hsl(0 0% 45%)' },
};
const PRIORITY_STYLE: Record<string, { color: string }> = {
  low: { color: 'hsl(var(--muted-foreground))' }, normal: { color: 'hsl(var(--foreground))' },
  high: { color: 'hsl(38 90% 65%)' }, urgent: { color: 'hsl(0 90% 65%)' },
};

const STATUSES = ['all', 'pending', 'in_progress', 'waiting_parts', 'ready', 'completed'] as const;

export default function TicketsPage() {
  const { setPageTitle } = usePageTitle();
  const { tickets, loading } = useTickets();
  const { technicians } = useTechnicians();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    setPageTitle({ title: 'Tickets', subtitle: 'Manage all repair tickets' });
    return () => setPageTitle({ title: 'Dashboard' });
  }, [setPageTitle]);

  const techName = (id?: string) => technicians.find(t => t.id === id)?.name ?? 'Unassigned';

  const filtered = tickets.filter(t => {
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const q = query.toLowerCase();
    const matchQ = !q || t.ticket_number.toLowerCase().includes(q)
      || t.device.toLowerCase().includes(q) || t.issue.toLowerCase().includes(q);
    return matchStatus && matchQ;
  });

  return (
    <div className="space-y-5">
      {/* Filter + actions row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="px-3 h-7 rounded-full text-xs font-semibold transition-colors"
              style={statusFilter === s
                ? { background: 'hsl(var(--primary))', color: 'white' }
                : { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
            >
              {s === 'all' ? 'All' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search tickets..."
              className="h-8 pl-8 pr-3 w-44 rounded-lg text-xs outline-none"
              style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
          </div>
          <button className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: 'hsl(var(--primary))' }}>
            <Plus className="w-3.5 h-3.5" /> New Ticket
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
        {loading ? (
          <div className="px-4 py-12 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading tickets…</div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <ClipboardList className="w-8 h-8 mx-auto mb-2" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No tickets found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                {['Ticket', 'Customer', 'Device', 'Issue', 'Priority', 'Technician', 'Status', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => {
                const s = STATUS_STYLE[t.status] ?? STATUS_STYLE.pending;
                const p = PRIORITY_STYLE[t.priority] ?? PRIORITY_STYLE.normal;
                const customerName = t.customer?.name ?? '—';
                return (
                  <tr key={t.id} className="transition-colors cursor-pointer"
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                    <td className="px-4 py-3"><span className="text-xs font-mono font-bold" style={{ color: 'hsl(var(--primary))' }}>{t.ticket_number}</span></td>
                    <td className="px-4 py-3 text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>{customerName}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--foreground))' }}>{t.brand} {t.model || t.device}</td>
                    <td className="px-4 py-3 text-xs max-w-[140px] truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{t.issue}</td>
                    <td className="px-4 py-3 text-xs font-semibold capitalize" style={{ color: p.color }}>{t.priority}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{techName(t.technician_id)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap" style={{ background: s.bg, color: s.color }}>
                        {STATUS_LABEL[t.status] ?? t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {new Date(t.received_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
        {filtered.length} of {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
