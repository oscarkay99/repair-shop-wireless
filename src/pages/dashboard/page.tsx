import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '@/context/PageTitleContext';
import { useTickets } from '@/hooks/useTickets';
import { useWirelessCustomers } from '@/hooks/useWirelessCustomers';
import { useParts } from '@/hooks/useParts';
import { ClipboardList, CheckCircle2, Users, AlertTriangle, Plus, UserPlus, Package, ArrowRight } from 'lucide-react';

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending:       { bg: 'hsl(var(--status-pending-bg))',     color: 'hsl(var(--status-pending))',     label: 'Pending' },
  in_progress:   { bg: 'hsl(var(--status-in-progress-bg))', color: 'hsl(var(--status-in-progress))', label: 'In Progress' },
  waiting_parts: { bg: 'hsl(38 70% 14%)', color: 'hsl(38 90% 65%)',                                  label: 'Waiting Parts' },
  ready:         { bg: 'hsl(var(--status-ready-bg))',       color: 'hsl(var(--status-ready))',       label: 'Ready' },
  completed:     { bg: 'hsl(var(--status-completed-bg))',   color: 'hsl(var(--status-completed))',   label: 'Completed' },
  cancelled:     { bg: 'hsl(0 0% 10%)', color: 'hsl(0 0% 45%)',                                      label: 'Cancelled' },
};

export default function DashboardPage() {
  const { setPageTitle } = usePageTitle();
  const { tickets, loading: ticketsLoading } = useTickets();
  const { customers, loading: customersLoading } = useWirelessCustomers();
  const { lowStock } = useParts();

  useEffect(() => {
    setPageTitle({ title: 'Dashboard' });
  }, [setPageTitle]);

  const today = new Date().toDateString();
  const openTickets = tickets.filter(t => !['completed', 'cancelled'].includes(t.status));
  const completedToday = tickets.filter(t => t.status === 'completed' && t.completed_at && new Date(t.completed_at).toDateString() === today);
  const recentTickets = tickets.slice(0, 5);

  const kpiCards = [
    { label: 'Open Tickets',    value: ticketsLoading  ? '…' : String(openTickets.length),    sub: `${tickets.filter(t => t.priority === 'high' || t.priority === 'urgent').length} high priority`, icon: ClipboardList, iconColor: 'hsl(var(--status-in-progress))', iconBg: 'hsl(var(--status-in-progress-bg))', link: '/tickets' },
    { label: 'Completed Today', value: ticketsLoading  ? '…' : String(completedToday.length), sub: 'repairs closed today',   icon: CheckCircle2,  iconColor: 'hsl(var(--status-ready))',       iconBg: 'hsl(var(--status-ready-bg))',       link: '/tickets' },
    { label: 'Total Customers', value: customersLoading ? '…' : String(customers.length),     sub: 'registered customers',  icon: Users,         iconColor: 'hsl(38 90% 65%)',                iconBg: 'hsl(38 70% 14%)',                   link: '/customers' },
    { label: 'Low Stock Items', value: String(lowStock.length),                                sub: lowStock.length > 0 ? 'need reorder' : 'all stocked', icon: AlertTriangle, iconColor: lowStock.length > 0 ? 'hsl(0 90% 65%)' : 'hsl(var(--status-ready))', iconBg: lowStock.length > 0 ? 'hsl(0 70% 14%)' : 'hsl(var(--status-ready-bg))', link: '/inventory-portal' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(card => (
          <Link key={card.label} to={card.link} className="block group">
            <div className="rounded-xl border p-4 flex items-start gap-3 transition-colors"
              style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = card.iconColor + '66'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border))'; }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: card.iconBg }}>
                <card.icon className="w-5 h-5" style={{ color: card.iconColor }} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold leading-tight" style={{ color: 'hsl(var(--foreground))' }}>{card.value}</p>
                <p className="text-[11px] font-semibold mt-0.5 uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>{card.label}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{card.sub}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="flex items-start justify-between gap-4 p-4 rounded-xl border"
          style={{ background: 'hsl(38 70% 8%)', borderColor: 'hsl(38 60% 20%)' }}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'hsl(var(--status-pending))' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'hsl(var(--status-pending))' }}>
                Low Stock Alert — {lowStock.length} item{lowStock.length > 1 ? 's' : ''} need reordering
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'hsl(38 60% 50%)' }}>
                {lowStock.map(p => `${p.name} (${p.stock} left)`).join(' · ')}
              </p>
            </div>
          </div>
          <Link to="/inventory-portal">
            <button className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-3 h-7 rounded-lg whitespace-nowrap"
              style={{ background: 'hsl(38 70% 14%)', color: 'hsl(var(--status-pending))' }}>
              View Inventory <ArrowRight className="w-3 h-3" />
            </button>
          </Link>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent tickets */}
        <div className="lg:col-span-2 rounded-xl border overflow-hidden" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'hsl(var(--border))' }}>
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
              <span className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Recent Tickets</span>
            </div>
            <Link to="/tickets">
              <button className="flex items-center gap-1 text-xs font-medium" style={{ color: 'hsl(var(--primary))' }}>
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </Link>
          </div>
          {ticketsLoading ? (
            <div className="py-8 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</div>
          ) : recentTickets.length === 0 ? (
            <div className="py-8 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No tickets yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  {['Ticket', 'Customer', 'Device', 'Issue', 'Status', 'Date'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentTickets.map((t, i) => {
                  const s = STATUS_STYLE[t.status] ?? STATUS_STYLE.pending;
                  return (
                    <tr key={t.id} className="transition-colors cursor-pointer"
                      style={{ borderBottom: i < recentTickets.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                      <td className="px-4 py-2.5"><span className="text-xs font-mono font-bold" style={{ color: 'hsl(var(--primary))' }}>{t.ticket_number}</span></td>
                      <td className="px-4 py-2.5 text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>{t.customer?.name ?? '—'}</td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{t.brand} {t.model || t.device}</td>
                      <td className="px-4 py-2.5 text-xs max-w-[120px] truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{t.issue}</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {new Date(t.received_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Quick actions + today at a glance */}
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Quick Actions</p>
          <div className="space-y-2">
            {[
              { label: 'New Ticket',    desc: 'Create a repair ticket',  icon: Plus,      to: '/tickets/new', primary: true },
              { label: 'Add Customer',  desc: 'Register a new customer', icon: UserPlus,  to: '/customers' },
              { label: 'Add Part',      desc: 'Add inventory part',      icon: Package,   to: '/inventory-portal' },
            ].map(action => (
              <Link key={action.label} to={action.to}>
                <div className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
                  style={{ borderColor: action.primary ? 'hsl(0 90% 35% / 0.4)' : 'hsl(var(--border))', background: action.primary ? 'hsl(0 80% 10%)' : 'transparent' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = action.primary ? 'hsl(0 80% 12%)' : 'hsl(var(--muted))'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = action.primary ? 'hsl(0 80% 10%)' : 'transparent'; }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: action.primary ? 'hsl(0 80% 18%)' : 'hsl(var(--muted))' }}>
                    <action.icon className="w-4 h-4" style={{ color: action.primary ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: action.primary ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>{action.label}</p>
                    <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{action.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div style={{ height: 1, background: 'hsl(var(--border))' }} />
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Today at a Glance</p>
            {[
              { label: 'Open Tickets',    value: ticketsLoading ? '…' : String(openTickets.length) },
              { label: 'Closed Today',    value: ticketsLoading ? '…' : String(completedToday.length) },
              { label: 'Low Stock Parts', value: String(lowStock.length) },
              { label: 'Customers',       value: customersLoading ? '…' : String(customers.length) },
            ].map(stat => (
              <div key={stat.label} className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{stat.label}</span>
                <span className="text-xs font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
