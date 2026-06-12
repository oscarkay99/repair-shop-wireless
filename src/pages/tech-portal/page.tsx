import { useEffect } from 'react';
import { usePageTitle } from '@/context/PageTitleContext';
import { Wrench, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const MY_TICKETS = [
  { id: 'TK-001', device: 'iPhone 14 Pro', issue: 'Cracked screen', customer: 'Kwame Mensah', priority: 'High', eta: 'Today 3PM' },
  { id: 'TK-002', device: 'Samsung S23', issue: 'Battery replacement', customer: 'Abena Osei', priority: 'Normal', eta: 'Tomorrow' },
  { id: 'TK-003', device: 'iPhone 13', issue: 'Water damage', customer: 'Kofi Agyemang', priority: 'High', eta: 'Today 5PM' },
];

const priorityStyle: Record<string, { bg: string; color: string }> = {
  High:   { bg: 'hsl(0 70% 14%)', color: 'hsl(0 90% 65%)' },
  Normal: { bg: 'hsl(var(--status-in-progress-bg))', color: 'hsl(var(--status-in-progress))' },
};

export default function TechPortalPage() {
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle({ title: 'Tech Portal', subtitle: 'Technician workspace and ticket queue' });
    return () => setPageTitle({ title: 'Dashboard' });
  }, [setPageTitle]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Clock,         label: 'Active Tickets', value: '3', color: 'hsl(var(--status-in-progress))' },
          { icon: CheckCircle2,  label: 'Completed Today', value: '7', color: 'hsl(var(--status-ready))' },
          { icon: AlertCircle,   label: 'Overdue',         value: '1', color: 'hsl(0 90% 60%)' },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border p-4 flex items-center gap-3"
            style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${item.color}20` }}
            >
              <item.icon className="w-5 h-5" style={{ color: item.color }} />
            </div>
            <div>
              <p className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{item.value}</p>
              <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
      >
        <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'hsl(var(--border))' }}>
          <Wrench className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
          <span className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>My Assigned Tickets</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
              {['Ticket', 'Device', 'Issue', 'Customer', 'Priority', 'ETA', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MY_TICKETS.map((t, i) => {
              const p = priorityStyle[t.priority] ?? priorityStyle['Normal'];
              return (
                <tr
                  key={t.id}
                  className="transition-colors cursor-pointer"
                  style={{ borderBottom: i < MY_TICKETS.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
                >
                  <td className="px-4 py-3 text-xs font-mono font-bold" style={{ color: 'hsl(var(--primary))' }}>{t.id}</td>
                  <td className="px-4 py-3 text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>{t.device}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{t.issue}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--foreground))' }}>{t.customer}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: p.bg, color: p.color }}>{t.priority}</span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{t.eta}</td>
                  <td className="px-4 py-3">
                    <button className="h-7 px-3 rounded-lg text-[11px] font-semibold text-white" style={{ background: 'hsl(var(--primary))' }}>
                      Update
                    </button>
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
