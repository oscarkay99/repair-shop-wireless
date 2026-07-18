import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '@/context/PageTitleContext';
import { useAuth } from '@/hooks/useAuth';
import { useRepairs } from '@/hooks/useRepairs';
import { Wrench, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { REPAIR_STATUS_META, isActiveRepairStatus } from '@/utils/repairStatus';

export default function TechPortalPage() {
  const { setPageTitle } = usePageTitle();
  const { user } = useAuth();
  const { repairs, loading } = useRepairs();

  useEffect(() => {
    setPageTitle({ title: 'Tech Portal', subtitle: 'Technician workspace and ticket queue' });
    return () => setPageTitle({ title: 'Dashboard' });
  }, [setPageTitle]);

  const myRepairs = useMemo(() => repairs.filter(r => r.technician === user?.name), [repairs, user]);
  const active = myRepairs.filter(r => isActiveRepairStatus(r.status));
  const partsPending = active.filter(r => r.status === 'parts_pending');
  const today = new Date().toDateString();
  const completedToday = myRepairs.filter(r => r.completedDate && new Date(r.completedDate).toDateString() === today);

  const stats = [
    { icon: Clock,        label: 'Active Tickets',   value: String(active.length),         color: 'hsl(var(--status-in-progress))' },
    { icon: CheckCircle2, label: 'Completed Today',  value: String(completedToday.length),  color: 'hsl(var(--status-ready))' },
    { icon: AlertCircle,  label: 'Parts Pending',    value: String(partsPending.length),    color: 'hsl(38 90% 55%)' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {stats.map((item) => (
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
              {['Ticket', 'Device', 'Issue', 'Customer', 'Status', 'ETA', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</td></tr>
            ) : active.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No active tickets assigned to you</td></tr>
            ) : active.map((t, i) => {
              const s = REPAIR_STATUS_META[t.status];
              return (
                <tr
                  key={t.id}
                  className="transition-colors cursor-pointer"
                  style={{ borderBottom: i < active.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
                >
                  <td className="px-4 py-3 text-xs font-mono font-bold" style={{ color: 'hsl(var(--primary))' }}>{t.id}</td>
                  <td className="px-4 py-3 text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>{t.device}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{t.issue}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--foreground))' }}>{t.customer || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{t.eta || '—'}</td>
                  <td className="px-4 py-3">
                    <Link to="/tickets">
                      <button className="h-7 px-3 rounded-lg text-[11px] font-semibold text-white cursor-pointer" style={{ background: 'hsl(var(--primary))' }}>
                        Update
                      </button>
                    </Link>
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
