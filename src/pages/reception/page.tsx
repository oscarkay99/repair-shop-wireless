import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '@/context/PageTitleContext';
import { useRepairs } from '@/hooks/useRepairs';
import { ConciergeBell, Plus, Phone } from 'lucide-react';

const typeStyle: Record<string, { bg: string; color: string }> = {
  'Drop-off': { bg: 'hsl(var(--status-in-progress-bg))', color: 'hsl(var(--status-in-progress))' },
  'Pick-up':  { bg: 'hsl(var(--status-ready-bg))',       color: 'hsl(var(--status-ready))' },
};

export default function ReceptionPortalPage() {
  const { setPageTitle } = usePageTitle();
  const { repairs, loading } = useRepairs();

  useEffect(() => {
    setPageTitle({ title: 'Reception Portal', subtitle: 'Walk-in management and customer queue' });
    return () => setPageTitle({ title: 'Dashboard' });
  }, [setPageTitle]);

  const today = new Date().toDateString();

  // "Needs reception's attention right now": just dropped off (not yet routed
  // to a technician) or ready for the customer to collect.
  const dropOffs = useMemo(() => repairs.filter(r => r.status === 'received' || r.status === 'diagnosis_paid'), [repairs]);
  const pickUps  = useMemo(() => repairs.filter(r => r.status === 'ready'), [repairs]);
  const queue = useMemo(() =>
    [...dropOffs.map(r => ({ ...r, kind: 'Drop-off' as const })), ...pickUps.map(r => ({ ...r, kind: 'Pick-up' as const }))]
      .sort((a, b) => (b.createdAt ?? b.started).localeCompare(a.createdAt ?? a.started)),
  [dropOffs, pickUps]);

  const droppedToday  = repairs.filter(r => (r.createdAt ?? r.started)?.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;
  const pickedUpToday = repairs.filter(r => r.completedDate && new Date(r.completedDate).toDateString() === today).length;

  const stats = [
    { label: 'In Queue', value: String(queue.length), sub: 'Need attention now' },
    { label: 'Drop-offs Today', value: String(droppedToday), sub: 'Devices received' },
    { label: 'Pick-ups Today', value: String(pickedUpToday), sub: 'Devices collected' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {stats.map((card) => (
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
        <Link to="/tickets">
          <button className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer" style={{ background: 'hsl(var(--primary))' }}>
            <Plus className="w-3.5 h-3.5" /> Check In Customer
          </button>
        </Link>
      </div>

      <div className="space-y-2">
        {loading ? (
          <p className="py-16 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</p>
        ) : queue.length === 0 ? (
          <p className="py-16 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No one waiting right now.</p>
        ) : queue.map((entry) => {
          const t = typeStyle[entry.kind];
          return (
            <Link to="/tickets" key={entry.id}>
              <div
                className="rounded-xl border p-4 flex items-center gap-4 cursor-pointer transition-colors"
                style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--primary) / 0.3)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border))'; }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 text-white"
                  style={{ background: 'hsl(0 80% 18%)' }}
                >
                  {(entry.customer || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{entry.customer || 'Unknown customer'}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Phone className="w-3 h-3" style={{ color: 'hsl(var(--muted-foreground))' }} />
                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{entry.customerPhone || '—'}</span>
                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>·</span>
                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{entry.device}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: t.bg, color: t.color }}>
                    {entry.kind}
                  </span>
                  <div className="text-right">
                    <p className="text-xs font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{entry.id}</p>
                  </div>
                  <button className="h-8 px-3 rounded-lg text-xs font-semibold text-white cursor-pointer" style={{ background: 'hsl(var(--primary))' }}>
                    Serve
                  </button>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
