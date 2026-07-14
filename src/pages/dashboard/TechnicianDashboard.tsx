import { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, CheckCircle2, Clock, Trophy, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRepairs } from '@/hooks/useRepairs';
import { usePageTitle } from '@/context/PageTitleContext';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/shared/Pagination';
import type { Repair } from '@/types/repair';

const statusLabel: Record<string, string> = {
  in_progress: 'In Progress',
  ready: 'Ready',
  completed: 'Done',
  cancelled: 'Cancelled',
  received: 'Received',
  diagnosis_paid: 'Received',
  diagnosing: 'Diagnosing',
  parts_pending: 'Parts Pending',
  awaiting_approval: 'Awaiting Approval',
  diagnosis_only_closed: 'Done',
};

const statusColor: Record<string, string> = {
  in_progress: '#06B6D4',
  parts_pending: '#F59E0B',
  ready: '#10B981',
  received: '#94A3B8',
  diagnosis_paid: '#94A3B8',
  diagnosing: '#8B5CF6',
  awaiting_approval: '#F59E0B',
  diagnosis_only_closed: '#94A3B8',
};

function KPICard({ label, value, sub, icon: Icon, color }: {
  label: string; value: number | string; sub: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: 'white', border: '1px solid rgba(7,16,31,0.07)', boxShadow: '0 1px 3px rgba(7,16,31,0.04)' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: 'rgba(10,31,74,0.38)' }}>{label}</p>
          <p className="text-[28px] font-bold leading-none" style={{ color: '#0F172A', letterSpacing: '-0.03em' }}>{value}</p>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}22` }}>
          <Icon className="w-4.5 h-4.5" style={{ color, width: 18, height: 18 }} />
        </div>
      </div>
      <p className="text-[11px]" style={{ color: 'rgba(10,31,74,0.45)' }}>{sub}</p>
    </div>
  );
}

function RepairRow({ r }: { r: Repair }) {
  const color = statusColor[r.status] ?? '#94A3B8';
  return (
    <Link to={`/repairs`} className="flex items-center gap-4 px-5 py-3.5 transition-colors group"
      style={{ borderBottom: '1px solid hsl(var(--border))' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 opacity-0" />
      <div className="w-20 flex-shrink-0">
        <span className="text-[11px] font-bold truncate block" style={{ color: 'hsl(350 60% 40%)' }}>{r.id}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>{r.device}</p>
        <p className="text-[11px] truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{r.issue}</p>
      </div>
      <div className="text-[11px] truncate w-28 flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }}>
        {r.customer}
      </div>
      <div className="flex-shrink-0">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
          style={{ background: `${color}18`, color }}>
          {statusLabel[r.status] ?? r.status}
        </span>
      </div>
      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 flex-shrink-0" style={{ color: 'hsl(var(--foreground))' }} />
    </Link>
  );
}

export default function TechnicianDashboard() {
  const { user } = useAuth();
  const { setPageTitle } = usePageTitle();

  useEffect(() => { setPageTitle({ title: 'Dashboard', hideDefaultAction: true }); }, [setPageTitle]);
  const { repairs, loading } = useRepairs();

  const todayStr = new Date().toISOString().slice(0, 10);

  const myRepairs = useMemo(() =>
    repairs.filter(r => r.technician === user?.name),
    [repairs, user]);

  const activeRepairs = myRepairs.filter(r => !['completed', 'cancelled', 'diagnosis_only_closed'].includes(r.status));
  const readyRepairs  = myRepairs.filter(r => r.status === 'ready');
  const partsPendingR = myRepairs.filter(r => r.status === 'parts_pending');
  const doneTodayR    = myRepairs.filter(r => r.completedDate?.slice(0, 10) === todayStr);

  const totalActive    = activeRepairs.length;
  const totalReady     = readyRepairs.length;
  const totalParts     = partsPendingR.length;
  const totalDoneToday = doneTodayR.length;

  const { paginated: pagedActive, page, setPage, totalPages, total } = usePagination(activeRepairs, 8);

  const firstName = user?.name?.split(' ')[0] ?? 'Tech';

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
            Hello, {firstName}
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Here's your repair queue for today
          </p>
        </div>
        <Link
          to="/repairs"
          className="px-4 h-8 flex items-center gap-1.5 rounded-lg text-xs font-semibold text-white"
          style={{ background: 'hsl(var(--primary))' }}
        >
          <Wrench className="w-3.5 h-3.5" />
          View All Repairs
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard label="Active Work"      value={totalActive}    sub="In your queue right now"   icon={Wrench}       color="#06B6D4" />
        <KPICard label="Ready for Pickup" value={totalReady}     sub="Awaiting customer"          icon={CheckCircle2} color="#10B981" />
        <KPICard label="Parts Pending"    value={totalParts}     sub="Waiting on parts"           icon={Clock}        color="#F59E0B" />
        <KPICard label="Completed Today"  value={totalDoneToday} sub={totalDoneToday > 0 ? 'Great work!' : 'Complete your first today'} icon={Trophy} color="#8B5CF6" />
      </div>

      {/* Queue */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid rgba(7,16,31,0.07)', boxShadow: '0 1px 3px rgba(7,16,31,0.04)' }}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'hsl(var(--border))' }}>
          <div>
            <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>My Queue</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {activeRepairs.length} repair job{activeRepairs.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Table header */}
        <div className="flex items-center gap-4 px-5 py-2.5" style={{ background: 'hsl(var(--muted))', borderBottom: '1px solid hsl(var(--border))' }}>
          <span className="w-1.5 flex-shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-wider w-20 flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }}>Ref</span>
          <span className="text-[10px] font-bold uppercase tracking-wider flex-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Device / Issue</span>
          <span className="text-[10px] font-bold uppercase tracking-wider w-28 flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }}>Customer</span>
          <span className="text-[10px] font-bold uppercase tracking-wider flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }}>Status</span>
          <span className="w-3.5 flex-shrink-0" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'hsl(350 60% 40%) transparent transparent' }} />
          </div>
        ) : activeRepairs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <CheckCircle2 className="w-8 h-8" style={{ color: 'hsl(142 60% 50%)' }} />
            <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Queue is clear!</p>
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No active repairs assigned to you</p>
          </div>
        ) : (
          <>
            {pagedActive.map(r => <RepairRow key={r.id} r={r} />)}
            <div className="px-5 pb-4">
              <Pagination page={page} pageCount={totalPages} total={total} pageSize={8} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
