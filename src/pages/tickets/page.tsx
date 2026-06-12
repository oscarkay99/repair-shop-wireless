import { useEffect } from 'react';
import { usePageTitle } from '@/context/PageTitleContext';
import { ClipboardList, Plus, Search, Filter } from 'lucide-react';

const MOCK_TICKETS = [
  { id: 'TK-001', customer: 'Kwame Mensah', device: 'iPhone 14 Pro', issue: 'Cracked screen', status: 'In Progress', date: 'Jun 10, 2026', tech: 'Ama Boateng' },
  { id: 'TK-002', customer: 'Abena Osei', device: 'Samsung S23', issue: 'Battery replacement', status: 'Pending', date: 'Jun 11, 2026', tech: 'Joe Asante' },
  { id: 'TK-003', customer: 'Kofi Agyemang', device: 'iPhone 13', issue: 'Water damage', status: 'Ready', date: 'Jun 9, 2026', tech: 'Ama Boateng' },
  { id: 'TK-004', customer: 'Akosua Darko', device: 'Google Pixel 7', issue: 'Charging port', status: 'Completed', date: 'Jun 8, 2026', tech: 'Yaw Frimpong' },
  { id: 'TK-005', customer: 'Fiifi Amo', device: 'iPhone 15', issue: 'Face ID not working', status: 'Pending', date: 'Jun 12, 2026', tech: 'Unassigned' },
];

const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
  'Pending':     { bg: 'hsl(var(--status-pending-bg))',     color: 'hsl(var(--status-pending))',     label: 'Pending' },
  'In Progress': { bg: 'hsl(var(--status-in-progress-bg))', color: 'hsl(var(--status-in-progress))', label: 'In Progress' },
  'Ready':       { bg: 'hsl(var(--status-ready-bg))',       color: 'hsl(var(--status-ready))',       label: 'Ready' },
  'Completed':   { bg: 'hsl(var(--status-completed-bg))',   color: 'hsl(var(--status-completed))',   label: 'Completed' },
};

export default function TicketsPage() {
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle({ title: 'Tickets', subtitle: 'Manage all repair tickets' });
    return () => setPageTitle({ title: 'Dashboard' });
  }, [setPageTitle]);

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {MOCK_TICKETS.length} tickets total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <input
              type="text"
              placeholder="Search tickets..."
              className="h-8 pl-8 pr-3 w-48 rounded-lg text-xs outline-none"
              style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            />
          </div>
          <button
            className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
          >
            <Filter className="w-3.5 h-3.5" /> Filter
          </button>
          <button
            className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ background: 'hsl(var(--primary))' }}
          >
            <Plus className="w-3.5 h-3.5" /> New Ticket
          </button>
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
              {['Ticket', 'Customer', 'Device', 'Issue', 'Technician', 'Status', 'Date'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_TICKETS.map((t, i) => {
              const s = statusStyle[t.status] ?? statusStyle['Pending'];
              return (
                <tr
                  key={t.id}
                  className="transition-colors cursor-pointer"
                  style={{ borderBottom: i < MOCK_TICKETS.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
                >
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono font-bold" style={{ color: 'hsl(var(--primary))' }}>{t.id}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>{t.customer}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs" style={{ color: 'hsl(var(--foreground))' }}>{t.device}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{t.issue}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{t.tech}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ background: s.bg, color: s.color }}
                    >
                      {s.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{t.date}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
