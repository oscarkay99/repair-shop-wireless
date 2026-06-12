import { useEffect } from 'react';
import { usePageTitle } from '@/context/PageTitleContext';
import { ConciergeBell, Plus, Phone, ClipboardList } from 'lucide-react';

const QUEUE = [
  { id: 'Q-001', customer: 'Mensah Kweku', phone: '+233 24 111 2233', device: 'iPhone 14', type: 'Drop-off', time: '9:02 AM', wait: '12 min' },
  { id: 'Q-002', customer: 'Ama Serwah', phone: '+233 20 555 6677', device: 'Samsung A54', type: 'Pick-up', time: '9:18 AM', wait: '4 min' },
  { id: 'Q-003', customer: 'Kofi Darko', phone: '+233 27 888 9900', device: 'iPhone 13 Pro', type: 'Drop-off', time: '9:25 AM', wait: 'Waiting' },
];

const typeStyle: Record<string, { bg: string; color: string }> = {
  'Drop-off': { bg: 'hsl(var(--status-in-progress-bg))', color: 'hsl(var(--status-in-progress))' },
  'Pick-up':  { bg: 'hsl(var(--status-ready-bg))',       color: 'hsl(var(--status-ready))' },
};

export default function ReceptionPortalPage() {
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle({ title: 'Reception Portal', subtitle: 'Walk-in management and customer queue' });
    return () => setPageTitle({ title: 'Dashboard' });
  }, [setPageTitle]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'In Queue', value: QUEUE.length.toString(), sub: 'Customers waiting' },
          { label: 'Drop-offs Today', value: '8', sub: 'Devices received' },
          { label: 'Pick-ups Today', value: '5', sub: 'Devices collected' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border p-4" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <p className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>{card.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'hsl(var(--foreground))' }}>{card.value}</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
          <ConciergeBell className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
          <span className="text-sm font-semibold">Customer Queue</span>
        </div>
        <button className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: 'hsl(var(--primary))' }}>
          <Plus className="w-3.5 h-3.5" /> Check In Customer
        </button>
      </div>

      <div className="space-y-2">
        {QUEUE.map((entry) => {
          const t = typeStyle[entry.type] ?? typeStyle['Drop-off'];
          return (
            <div
              key={entry.id}
              className="rounded-xl border p-4 flex items-center gap-4 cursor-pointer transition-colors"
              style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--primary) / 0.3)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border))'; }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 text-white"
                style={{ background: 'hsl(0 80% 18%)' }}
              >
                {entry.customer.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{entry.customer}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Phone className="w-3 h-3" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{entry.phone}</span>
                  <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>·</span>
                  <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{entry.device}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: t.bg, color: t.color }}>
                  {entry.type}
                </span>
                <div className="text-right">
                  <p className="text-xs font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{entry.time}</p>
                  <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{entry.wait}</p>
                </div>
                <button className="h-8 px-3 rounded-lg text-xs font-semibold text-white" style={{ background: 'hsl(var(--primary))' }}>
                  Serve
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
