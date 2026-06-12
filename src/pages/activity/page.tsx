import { useEffect } from 'react';
import { usePageTitle } from '@/context/PageTitleContext';
import { Activity, User, ClipboardList, Package, Settings, LogIn } from 'lucide-react';

const ACTIVITY_LOG = [
  { id: 'L001', user: 'Kwame Asante', action: 'Created ticket TK-005', module: 'Tickets', time: '2 min ago', icon: ClipboardList, color: 'hsl(var(--status-in-progress))' },
  { id: 'L002', user: 'Ama Boateng', action: 'Updated ticket TK-001 status to In Progress', module: 'Tickets', time: '18 min ago', icon: ClipboardList, color: 'hsl(var(--status-in-progress))' },
  { id: 'L003', user: 'Joe Asante', action: 'Added 10 units of iPhone 14 Pro Screen', module: 'Inventory', time: '1 hr ago', icon: Package, color: 'hsl(var(--status-ready))' },
  { id: 'L004', user: 'Kwame Asante', action: 'Added new customer: Fiifi Amo', module: 'Customers', time: '2 hrs ago', icon: User, color: 'hsl(38 90% 65%)' },
  { id: 'L005', user: 'Adjoa Mensah', action: 'Signed in', module: 'Auth', time: '3 hrs ago', icon: LogIn, color: 'hsl(var(--muted-foreground))' },
  { id: 'L006', user: 'Kwame Asante', action: 'Updated monthly target to GH₵ 15,000', module: 'Settings', time: '5 hrs ago', icon: Settings, color: 'hsl(var(--muted-foreground))' },
  { id: 'L007', user: 'Joe Asante', action: 'Completed ticket TK-004 (Samsung Galaxy S23)', module: 'Tickets', time: 'Yesterday', icon: ClipboardList, color: 'hsl(var(--status-ready))' },
];

export default function ActivityPage() {
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle({ title: 'Activity Log', subtitle: 'Complete audit trail of all system actions' });
    return () => setPageTitle({ title: 'Dashboard' });
  }, [setPageTitle]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Showing {ACTIVITY_LOG.length} recent events
        </p>
      </div>

      <div
        className="rounded-xl border overflow-hidden divide-y"
        style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', '--tw-divide-opacity': 1 } as React.CSSProperties}
      >
        {ACTIVITY_LOG.map((entry) => (
          <div
            key={entry.id}
            className="flex items-start gap-4 px-4 py-3.5 transition-colors"
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: `${entry.color}20` }}
            >
              <entry.icon className="w-3.5 h-3.5" style={{ color: entry.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs" style={{ color: 'hsl(var(--foreground))' }}>
                <span className="font-semibold">{entry.user}</span>{' '}
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>{entry.action}</span>
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                  style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
                >
                  {entry.module}
                </span>
                <Activity className="w-2.5 h-2.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                <span className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{entry.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
