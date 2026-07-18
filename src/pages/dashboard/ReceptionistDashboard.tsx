import { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Package, Clock, Users, ChevronRight, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRepairs } from '@/hooks/useRepairs';
import { usePageTitle } from '@/context/PageTitleContext';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/shared/Pagination';
import type { Repair } from '@/types/repair';
import { REPAIR_STATUS_META } from '@/utils/repairStatus';

function KPICard({ label, value, sub, icon: Icon, color }: {
  label: string; value: number | string; sub: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</p>
          <p className="text-[28px] font-bold leading-none" style={{ color: 'hsl(var(--foreground))', letterSpacing: '-0.03em' }}>{value}</p>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}22` }}>
          <Icon className="w-4.5 h-4.5" style={{ color, width: 18, height: 18 }} />
        </div>
      </div>
      <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{sub}</p>
    </div>
  );
}

function RepairRow({ r }: { r: Repair }) {
  const meta = REPAIR_STATUS_META[r.status];
  const received = r.createdAt
    ? new Date(r.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    : '—';
  return (
    <Link
      to="/tickets"
      className="flex items-center gap-4 px-5 py-3.5 transition-colors group"
      style={{ borderBottom: '1px solid hsl(var(--border))' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
    >
      <div className="w-24 flex-shrink-0">
        <span className="text-[11px] font-bold" style={{ color: 'hsl(var(--primary))' }}>{r.id}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>
          {r.customer || 'Unknown Customer'}
        </p>
        <p className="text-[11px] truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {r.device} — {r.issue}
        </p>
      </div>
      <div className="text-[11px] flex-shrink-0 w-20 text-right" style={{ color: 'hsl(var(--muted-foreground))' }}>
        {received}
      </div>
      <div className="flex-shrink-0">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
          style={{ background: `${meta.color}18`, color: meta.color }}>
          {meta.label}
        </span>
      </div>
      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 flex-shrink-0" style={{ color: 'hsl(var(--foreground))' }} />
    </Link>
  );
}

export default function ReceptionistDashboard() {
  const { user } = useAuth();
  const { setPageTitle } = usePageTitle();
  const { repairs, loading } = useRepairs();

  useEffect(() => { setPageTitle({ title: 'Dashboard', hideDefaultAction: false }); }, [setPageTitle]);

  const today = new Date().toISOString().slice(0, 10);

  const todayRepairs  = useMemo(() => repairs.filter(r => (r.createdAt ?? r.started)?.slice(0, 10) === today), [repairs, today]);
  const ready         = useMemo(() => repairs.filter(r => r.status === 'ready'), [repairs]);
  const inProgress    = useMemo(() => repairs.filter(r => r.status === 'in_progress'), [repairs]);
  const notStarted    = useMemo(() => repairs.filter(r => ['received', 'diagnosis_paid'].includes(r.status)), [repairs]);

  // Show today's check-ins + ready for pickup (for handoff)
  const listRepairs = useMemo(() => {
    const readyIds = new Set(ready.map(r => r.id));
    return [...todayRepairs, ...ready.filter(r => !readyIds.has(r.id) || !todayRepairs.find(x => x.id === r.id))]
      .filter((r, i, arr) => arr.findIndex(x => x.id === r.id) === i)
      .sort((a, b) => (b.createdAt ?? b.started).localeCompare(a.createdAt ?? a.started));
  }, [todayRepairs, ready]);

  const { paginated: pagedList, page, setPage, totalPages, total } = usePagination(listRepairs, 8);

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
            Welcome, {firstName}
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Front desk overview — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/customers"
            className="px-4 h-8 flex items-center gap-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', background: 'transparent' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <Users className="w-3.5 h-3.5" />
            Customers
          </Link>
          <Link
            to="/tickets"
            className="px-4 h-8 flex items-center gap-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ background: 'hsl(var(--primary))' }}
          >
            <Plus className="w-3.5 h-3.5" />
            New Repair
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard label="Check-ins Today"   value={todayRepairs.length}  sub="Devices received today"     icon={ClipboardList} color="#06B6D4" />
        <KPICard label="Ready for Pickup"  value={ready.length}         sub="Customers to notify"        icon={Package}       color="#10B981" />
        <KPICard label="In Progress"       value={inProgress.length}    sub="Currently being worked on"  icon={Clock}         color="#F59E0B" />
        <KPICard label="Awaiting Start"    value={notStarted.length}    sub="Not yet assigned"           icon={Users}         color="#8B5CF6" />
      </div>

      {/* Repair list */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-card)' }}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'hsl(var(--border))' }}>
          <div>
            <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Today's Activity</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Check-ins &amp; ready for collection
            </p>
          </div>
          <Link to="/tickets" className="text-[11px] font-semibold transition-opacity hover:opacity-70" style={{ color: 'hsl(var(--primary))' }}>
            All repairs →
          </Link>
        </div>

        {/* Header row */}
        <div className="flex items-center gap-4 px-5 py-2.5" style={{ background: 'hsl(var(--muted))', borderBottom: '1px solid hsl(var(--border))' }}>
          <span className="text-[10px] font-bold uppercase tracking-wider w-24 flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }}>Ref</span>
          <span className="text-[10px] font-bold uppercase tracking-wider flex-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Customer / Device</span>
          <span className="text-[10px] font-bold uppercase tracking-wider w-20 text-right flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }}>Time</span>
          <span className="text-[10px] font-bold uppercase tracking-wider flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }}>Status</span>
          <span className="w-3.5 flex-shrink-0" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'hsl(var(--primary)) transparent transparent' }} />
          </div>
        ) : listRepairs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <ClipboardList className="w-8 h-8 opacity-20" style={{ color: 'hsl(var(--foreground))' }} />
            <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>No check-ins yet today</p>
            <Link to="/tickets" className="text-xs font-semibold" style={{ color: 'hsl(var(--primary))' }}>
              Create the first repair →
            </Link>
          </div>
        ) : (
          <>
            {pagedList.map(r => <RepairRow key={r.id} r={r} />)}
            <div className="px-5 pb-4">
              <Pagination page={page} pageCount={totalPages} total={total} pageSize={8} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
