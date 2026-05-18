import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/feature/AdminLayout';
import { useRepairs } from '@/hooks/useRepairs';
import { useAuth } from '@/hooks/useAuth';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  received:      { label: 'Received',       color: '#6366F1', bg: 'rgba(99,102,241,0.12)' },
  diagnosed:     { label: 'Diagnosed',      color: '#F5A623', bg: 'rgba(245,166,35,0.12)' },
  in_progress:   { label: 'In Progress',    color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  parts_pending: { label: 'Parts Pending',  color: '#EF4444', bg: 'rgba(239,68,68,0.12)'  },
  ready:         { label: 'Ready Pickup',   color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  completed:     { label: 'Completed',      color: '#059669', bg: 'rgba(5,150,105,0.12)'  },
};

const DEVICE_COLORS = ['#3B82F6', '#F5A623', '#10B981', '#6366F1', '#EF4444'];

function fmt(n: number) {
  if (n >= 1000) return `GHS ${(n / 1000).toFixed(1)}k`;
  return `GHS ${n.toLocaleString()}`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function lastNDays(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1) + i);
    return {
      label: d.toLocaleDateString('en-GH', { day: 'numeric', month: 'short' }),
      key: d.toISOString().split('T')[0],
    };
  });
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { repairs, loading } = useRepairs();

  const stats = useMemo(() => {
    const active    = repairs.filter(r => !['completed', 'cancelled'].includes(r.status));
    const ready     = repairs.filter(r => r.status === 'ready');
    const completed = repairs.filter(r => r.status === 'completed');
    const revenue   = completed.reduce((s, r) => s + (r.costNum ?? 0), 0);

    // avg turnaround for completed jobs (days between started and completedDate)
    const turnarounds = completed
      .filter(r => r.completedDate && r.started)
      .map(r => {
        const s = new Date(r.started).getTime();
        const e = new Date(r.completedDate!).getTime();
        return (e - s) / 86400000;
      });
    const avgDays = turnarounds.length
      ? (turnarounds.reduce((a, b) => a + b, 0) / turnarounds.length).toFixed(1)
      : '—';

    return { active, ready, completed, revenue, avgDays };
  }, [repairs]);

  const [revPeriod, setRevPeriod] = useState<7 | 14 | 30>(14);

  const revenueData = useMemo(() => {
    return lastNDays(revPeriod).map(({ label, key }) => {
      const dayRepairs = repairs.filter(r => r.completedDate === key);
      return {
        day: label,
        revenue: dayRepairs.reduce((s, r) => s + (r.costNum ?? 0), 0),
        jobs: dayRepairs.length,
      };
    });
  }, [repairs, revPeriod]);

  const revTotal   = revenueData.reduce((s, d) => s + d.revenue, 0);
  const revJobs    = revenueData.reduce((s, d) => s + d.jobs, 0);
  const revAvg     = revJobs > 0 ? Math.round(revTotal / revJobs) : 0;

  // Device type breakdown
  const deviceData = useMemo(() => {
    const counts: Record<string, number> = {};
    repairs.forEach(r => { counts[r.deviceType] = (counts[r.deviceType] ?? 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [repairs]);

  // Pipeline (active jobs by status)
  const pipeline = useMemo(() => {
    const order = ['received', 'diagnosed', 'in_progress', 'parts_pending', 'ready'];
    return order.map(s => ({
      ...STATUS_META[s],
      key: s,
      count: repairs.filter(r => r.status === s).length,
    }));
  }, [repairs]);

  // Technician workload
  const techWorkload = useMemo(() => {
    const map: Record<string, number> = {};
    repairs.filter(r => !['completed', 'cancelled'].includes(r.status))
      .forEach(r => { map[r.technician] = (map[r.technician] ?? 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [repairs]);

  if (loading) return (
    <AdminLayout title="Dashboard" subtitle="">
      <div className="flex items-center justify-center h-64 text-slate-400">
        <i className="ri-loader-4-line animate-spin mr-2" /> Loading…
      </div>
    </AdminLayout>
  );

  const activeRepairs = repairs.filter(r => !['completed', 'cancelled'].includes(r.status));

  return (
    <AdminLayout title="" subtitle="">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          {greeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          {new Date().toLocaleDateString('en-GH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active Jobs',       value: stats.active.length,             icon: 'ri-tools-line',        color: '#3B82F6', sub: 'in the shop'         },
          { label: 'Ready for Pickup',  value: stats.ready.length,              icon: 'ri-check-double-line', color: '#10B981', sub: 'awaiting customer'   },
          { label: 'Completed (Month)', value: stats.completed.length,          icon: 'ri-checkbox-circle-line', color: '#6366F1', sub: 'this month'        },
          { label: 'Revenue (Month)',   value: fmt(stats.revenue),              icon: 'ri-money-cedi-circle-line', color: '#F5A623', sub: 'from repair fees' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{card.label}</span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: card.color + '18' }}>
                <i className={`${card.icon} text-sm`} style={{ color: card.color }} />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-800">{card.value}</div>
            <div className="text-xs text-slate-400 mt-1">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Row 1: Pipeline + Active Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

        {/* Repair Pipeline */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Repair Pipeline</h2>
              <p className="text-xs text-slate-400">Current job distribution by stage</p>
            </div>
            <span className="text-xs font-semibold text-slate-400">{stats.active.length} active</span>
          </div>
          <div className="space-y-3">
            {pipeline.map(stage => {
              const pct = stats.active.length > 0
                ? Math.round((stage.count / stats.active.length) * 100)
                : 0;
              return (
                <div key={stage.key}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                      <span className="text-xs font-medium text-slate-600">{stage.label}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700">{stage.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: stage.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {/* Avg turnaround */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-6">
            <div>
              <div className="text-xs text-slate-400">Avg Turnaround</div>
              <div className="text-lg font-black text-slate-800">{stats.avgDays} <span className="text-sm font-normal text-slate-400">days</span></div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Technicians</div>
              <div className="text-lg font-black text-slate-800">{techWorkload.length}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Parts Waiting</div>
              <div className="text-lg font-black text-slate-800">{repairs.filter(r => r.status === 'parts_pending').length}</div>
            </div>
          </div>
        </div>

        {/* Active Jobs list */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800">Active Jobs</h2>
            <button onClick={() => navigate('/repairs')} className="text-xs font-semibold cursor-pointer" style={{ color: '#F5A623' }}>
              View all
            </button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto max-h-72">
            {activeRepairs.slice(0, 7).map(r => {
              const meta = STATUS_META[r.status] ?? STATUS_META.received;
              return (
                <div
                  key={r.id}
                  onClick={() => navigate('/repairs')}
                  className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: meta.bg }}>
                    <i className="ri-tools-line text-xs" style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-800 truncate">{r.customer}</div>
                    <div className="text-[10px] text-slate-400 truncate">{r.device}</div>
                  </div>
                  <div
                    className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    {meta.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Weekly Chart + Device Breakdown + Technician Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Repair Revenue trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Repair Revenue</h2>
              <p className="text-xs text-slate-400">Payments received from completed jobs</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              {([7, 14, 30] as const).map(n => (
                <button
                  key={n}
                  onClick={() => setRevPeriod(n)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${revPeriod === n ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {n}d
                </button>
              ))}
            </div>
          </div>

          {/* Summary strip */}
          <div className="flex items-center gap-5 mb-4">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wide">Total</div>
              <div className="text-lg font-black text-slate-800">{fmt(revTotal)}</div>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wide">Jobs</div>
              <div className="text-lg font-black text-slate-800">{revJobs}</div>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wide">Avg per Job</div>
              <div className="text-lg font-black text-slate-800">{fmt(revAvg)}</div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={revenueData} barSize={revPeriod === 30 ? 8 : revPeriod === 14 ? 14 : 22}>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                interval={revPeriod === 30 ? 4 : revPeriod === 14 ? 1 : 0}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                width={36}
                tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)}
              />
              <Tooltip
                contentStyle={{ background: '#0D1F4A', border: 'none', borderRadius: 10, fontSize: 12, color: 'white' }}
                formatter={(v: number, name: string) => [
                  name === 'revenue' ? `GHS ${v.toLocaleString()}` : v,
                  name === 'revenue' ? 'Revenue' : 'Jobs',
                ]}
                labelStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}
              />
              <Bar dataKey="revenue" fill="#0D1F4A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Right column: Device types + Technician workload */}
        <div className="flex flex-col gap-5">

          {/* Device type breakdown */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 mb-3">Device Types</h2>
            <div className="flex items-center gap-3">
              <PieChart width={80} height={80}>
                <Pie data={deviceData} cx={35} cy={35} innerRadius={22} outerRadius={38} dataKey="value" stroke="none">
                  {deviceData.map((_, i) => <Cell key={i} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />)}
                </Pie>
              </PieChart>
              <div className="flex-1 space-y-1.5">
                {deviceData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: DEVICE_COLORS[i % DEVICE_COLORS.length] }} />
                      <span className="text-[11px] text-slate-600">{d.name}</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-700">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Technician workload */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 mb-3">Technician Workload</h2>
            <div className="space-y-3">
              {techWorkload.map(([name, count]) => {
                const max = techWorkload[0]?.[1] ?? 1;
                const pct = Math.round((count / max) * 100);
                return (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-600">{name}</span>
                      <span className="text-xs font-bold text-slate-700">{count} jobs</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#0D1F4A' }} />
                    </div>
                  </div>
                );
              })}
              {techWorkload.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-2">No active assignments</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}
