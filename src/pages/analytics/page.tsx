import { useState, useMemo } from 'react';
import AdminLayout from '@/components/feature/AdminLayout';
import { useRepairs } from '@/hooks/useRepairs';
import { useExpenses } from '@/hooks/useExpenses';
import { useWirelessCustomers } from '@/hooks/useWirelessCustomers';
import RevenueVsTarget from './components/RevenueVsTarget';
import RepairAnalytics from './components/RepairAnalytics';
import CustomerSegments from './components/CustomerSegments';

const tabs = [
  { id: 'overview',    label: 'Overview',    icon: 'ri-dashboard-3-line'     },
  { id: 'repairs',     label: 'Tickets',     icon: 'ri-tools-line'           },
  { id: 'revenue',     label: 'Revenue',     icon: 'ri-money-cedi-circle-line' },
  { id: 'customers',   label: 'Customers',   icon: 'ri-group-line'           },
  { id: 'operations',  label: 'Operations',  icon: 'ri-settings-3-line'      },
];

const fmtGHS = (n: number) => n >= 1000 ? `GHS ${(n / 1000).toFixed(1)}K` : `GHS ${Math.round(n)}`;

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState('6M');
  const { repairs } = useRepairs();
  const { expenses } = useExpenses();
  const { customers } = useWirelessCustomers();

  const kpis = useMemo(() => {
    const completed  = repairs.filter(r => r.status === 'completed');
    const revenue    = completed.reduce((s, r) => s + (r.costNum ?? 0), 0);
    const avgJob     = completed.length > 0 ? revenue / completed.length : 0;
    const active     = repairs.filter(r => !['completed', 'cancelled'].includes(r.status)).length;
    const turnarounds = completed
      .filter(r => r.completedDate && r.started)
      .map(r => (new Date(r.completedDate!).getTime() - new Date(r.started).getTime()) / 86400000);
    const avgDays = turnarounds.length
      ? (turnarounds.reduce((a, b) => a + b, 0) / turnarounds.length).toFixed(1)
      : '—';
    return [
      { label: 'Total Revenue',     value: fmtGHS(revenue),        change: `${completed.length} jobs done`,   icon: 'ri-money-cedi-circle-line', accent: 'bg-emerald-500', iconBg: 'bg-emerald-50',  iconText: 'text-emerald-500', sub: 'From completed repairs'   },
      { label: 'Jobs Completed',    value: `${completed.length}`,  change: `${active} still active`,          icon: 'ri-checkbox-circle-line',   accent: 'bg-[#DC1F1F]',  iconBg: 'bg-[rgba(220,31,31,0.08)]', iconText: 'text-[#DC1F1F]', sub: 'All-time finished'        },
      { label: 'Avg Job Value',     value: fmtGHS(avgJob),         change: `${repairs.length} total jobs`,    icon: 'ri-bar-chart-box-line',     accent: 'bg-slate-500',  iconBg: 'bg-[hsl(var(--muted))]',   iconText: 'text-[hsl(var(--muted-foreground))]',   sub: 'Per completed repair'     },
      { label: 'Avg Turnaround',    value: `${avgDays} days`,      change: `${customers.length} customers`,   icon: 'ri-time-line',              accent: 'bg-amber-500',  iconBg: 'bg-amber-50',    iconText: 'text-amber-500',   sub: 'Days to complete a job'   },
    ];
  }, [repairs, customers]);

  return (
    <AdminLayout title="Analytics" subtitle="Repair performance, revenue and customer insights">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-1 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-1.5 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id ? 'bg-[#DC1F1F] text-white shadow-sm' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
              }`}
            >
              <i className={`${tab.icon} text-sm`} />
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-1">
          {['1M', '3M', '6M', '1Y'].map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${period === p ? 'bg-[#DC1F1F] text-white' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--muted-foreground))]'}`}
            >{p}</button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-[hsl(var(--card))] rounded-2xl p-5 border border-[hsl(var(--border))] hover:shadow-lg transition-all duration-300 relative overflow-hidden">
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${kpi.accent} rounded-l-2xl`} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))] font-semibold uppercase tracking-widest">{kpi.label}</p>
                <p className="text-[26px] font-bold text-[hsl(var(--foreground))] mt-1 tracking-tight leading-none">{kpi.value}</p>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">{kpi.sub}</p>
                <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                  <i className="ri-arrow-up-line text-xs" />{kpi.change}
                </div>
              </div>
              <div className={`w-11 h-11 flex items-center justify-center rounded-2xl ${kpi.iconBg} ${kpi.iconText} flex-shrink-0`}>
                <i className={`${kpi.icon} text-xl`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[rgba(220,31,31,0.05)] rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#DC1F1F] to-[#B81616] flex-shrink-0">
                <i className="ri-sparkling-2-fill text-white text-base" />
              </div>
              <div>
                <p className="text-[hsl(var(--foreground))] font-bold text-sm mb-1">AI Performance Summary</p>
                <p className="text-[hsl(var(--muted-foreground))] text-xs leading-relaxed">
                  Log more repairs and expenses to unlock AI-powered insights on technician efficiency, common faults, and revenue trends.
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2"><RevenueVsTarget /></div>
            <div><CustomerSegments /></div>
          </div>
          <RepairAnalytics />
        </div>
      )}

      {/* Repairs Tab */}
      {activeTab === 'repairs' && (
        <div className="space-y-5">
          <RepairAnalytics />
          {/* Device type breakdown */}
          <div className="bg-[hsl(var(--card))] rounded-2xl p-6 border border-[hsl(var(--border))]">
            <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-5">Repairs by Device Type</h3>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {(() => {
                const counts: Record<string, number> = {};
                repairs.forEach(r => { counts[r.deviceType ?? 'Other'] = (counts[r.deviceType ?? 'Other'] ?? 0) + 1; });
                const colors = ['#3B82F6','#F59E0B','#10B981','#6366F1','#EF4444'];
                return Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([type, count], i) => (
                  <div key={type} className="bg-[hsl(var(--muted))] rounded-2xl p-4 text-center">
                    <div className="text-2xl font-black" style={{ color: colors[i % colors.length] }}>{count}</div>
                    <div className="text-xs font-semibold text-[hsl(var(--muted-foreground))] mt-1">{type}</div>
                    <div className="text-[10px] text-[hsl(var(--muted-foreground))]">{Math.round(count / repairs.length * 100)}% of jobs</div>
                  </div>
                ));
              })()}
            </div>
          </div>
          {/* Common issues */}
          <div className="bg-[hsl(var(--card))] rounded-2xl p-6 border border-[hsl(var(--border))]">
            <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-4">Most Common Issues</h3>
            <div className="space-y-2">
              {(() => {
                const issues: Record<string, number> = {};
                repairs.forEach(r => {
                  const key = r.issue.split(/[\+\/,]/)[0].trim().toLowerCase();
                  issues[key] = (issues[key] ?? 0) + 1;
                });
                return Object.entries(issues).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([issue, count]) => (
                  <div key={issue} className="flex items-center justify-between py-2 border-b border-[hsl(var(--border))] last:border-0">
                    <span className="text-xs text-[hsl(var(--muted-foreground))] capitalize">{issue}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                        <div className="h-full rounded-full bg-[#DC1F1F]" style={{ width: `${(count / repairs.length) * 100}%` }} />
                      </div>
                      <span className="text-xs font-bold text-[hsl(var(--foreground))] w-4 text-right">{count}</span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <div className="space-y-5">
          <RevenueVsTarget />
          <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
            <div className="px-5 py-4 border-b border-[hsl(var(--border))]">
              <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">Revenue from Repairs — Monthly</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))]">
                    {['Month','Jobs Completed','Revenue','Avg per Job','Parts Cost','Net'].map(h => (
                      <th key={h} className="text-left text-[10px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { month: 'Jan', jobs: 18, revenue: 12400, parts: 3100 },
                    { month: 'Feb', jobs: 22, revenue: 15800, parts: 4200 },
                    { month: 'Mar', jobs: 19, revenue: 13200, parts: 3600 },
                    { month: 'Apr', jobs: 24, revenue: 18600, parts: 4800 },
                  ].map((d, i) => (
                    <tr key={d.month} className={`border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/60 ${i%2===0?'':'bg-[hsl(var(--muted))]/20'}`}>
                      <td className="px-4 py-3 text-xs font-semibold text-[hsl(var(--foreground))]">{d.month} 2026</td>
                      <td className="px-4 py-3 text-xs text-[hsl(var(--foreground))]">{d.jobs}</td>
                      <td className="px-4 py-3 text-xs font-bold text-[hsl(var(--foreground))]">GHS {d.revenue.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-[hsl(var(--foreground))]">GHS {Math.round(d.revenue/d.jobs).toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-[hsl(var(--foreground))]">GHS {d.parts.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs font-bold text-emerald-600">GHS {(d.revenue - d.parts).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Customers Tab */}
      {activeTab === 'customers' && (
        <div className="space-y-5">
          <CustomerSegments />
          <div className="bg-[hsl(var(--card))] rounded-2xl p-6 border border-[hsl(var(--border))]">
            <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-5">Customer Retention</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Repeat Customers', value: '41%',    change: '+6%',    icon: 'ri-refresh-line',      color: 'text-emerald-600' },
                { label: 'Avg Days Between Repairs', value: '52 days', change: '-4 days', icon: 'ri-calendar-line', color: 'text-[hsl(var(--muted-foreground))]' },
                { label: 'NPS Score',         value: '76',     change: '+8',     icon: 'ri-star-line',         color: 'text-amber-600'   },
                { label: 'Satisfaction Rate', value: '94%',    change: '+2%',    icon: 'ri-heart-pulse-line',  color: 'text-[hsl(var(--muted-foreground))]'   },
              ].map((m) => (
                <div key={m.label} className="bg-[hsl(var(--muted))] rounded-2xl p-4">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-xl bg-[hsl(var(--card))] mb-3 ${m.color}`}>
                    <i className={`${m.icon} text-base`} />
                  </div>
                  <p className="text-xl font-bold text-[hsl(var(--foreground))]">{m.value}</p>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">{m.label}</p>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1">{m.change}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Operations Tab */}
      {activeTab === 'operations' && (
        <div className="space-y-5">
          <RepairAnalytics />
          <div className="bg-[hsl(var(--card))] rounded-2xl p-6 border border-[hsl(var(--border))]">
            <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-5">Technician Performance</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { name: 'Ama Owusu',   role: 'Lead Technician',   metric: '38 repairs', sub: '96% satisfaction', avatar: 'AO', color: '#D97706' },
                { name: 'Yaw Darko',   role: 'Technician',        metric: '29 repairs', sub: '94% satisfaction', avatar: 'YD', color: '#DC2626' },
                { name: 'Kwame Asante',role: 'Workshop Manager',  metric: '—',          sub: 'Operations lead',   avatar: 'KA', color: '#DC1F1F' },
              ].map((m) => (
                <div key={m.name} className="flex items-center gap-3 p-4 bg-[hsl(var(--muted))] rounded-2xl">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: m.color }}>
                    {m.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[hsl(var(--foreground))]">{m.name}</p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{m.role}</p>
                    <p className="text-xs font-semibold text-emerald-600 mt-0.5">{m.metric}</p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{m.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
