import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '@/context/PageTitleContext';
import {
  ClipboardList, CheckCircle2, Users, AlertTriangle,
  Plus, UserPlus, Package, ArrowRight,
} from 'lucide-react';

const RECENT_TICKETS = [
  { id: 'TK-005', customer: 'Fiifi Amo', device: 'iPhone 15', issue: 'Face ID not working', status: 'Pending', date: 'Jun 12, 2026' },
  { id: 'TK-001', customer: 'Kwame Mensah', device: 'iPhone 14 Pro', issue: 'Cracked screen', status: 'In Progress', date: 'Jun 10, 2026' },
  { id: 'TK-002', customer: 'Abena Osei', device: 'Samsung S23', issue: 'Battery replacement', status: 'Pending', date: 'Jun 11, 2026' },
  { id: 'TK-003', customer: 'Kofi Agyemang', device: 'iPhone 13', issue: 'Water damage', status: 'Ready', date: 'Jun 9, 2026' },
  { id: 'TK-004', customer: 'Akosua Darko', device: 'Google Pixel 7', issue: 'Charging port', status: 'Completed', date: 'Jun 8, 2026' },
];

const LOW_STOCK_PARTS = [
  { name: 'iPhone 14 Pro Screen', stock: 3, min: 5 },
  { name: 'USB-C Charging Port', stock: 2, min: 10 },
  { name: 'iPhone 15 Screen', stock: 1, min: 5 },
];

const statusStyle: Record<string, { bg: string; color: string }> = {
  'Pending':     { bg: 'hsl(var(--status-pending-bg))',     color: 'hsl(var(--status-pending))' },
  'In Progress': { bg: 'hsl(var(--status-in-progress-bg))', color: 'hsl(var(--status-in-progress))' },
  'Ready':       { bg: 'hsl(var(--status-ready-bg))',       color: 'hsl(var(--status-ready))' },
  'Completed':   { bg: 'hsl(var(--status-completed-bg))',   color: 'hsl(var(--status-completed))' },
};

const KPI_CARDS = [
  {
    label: 'Open Tickets',
    value: '12',
    sub: '3 high priority',
    icon: ClipboardList,
    iconColor: 'hsl(var(--status-in-progress))',
    iconBg: 'hsl(var(--status-in-progress-bg))',
    link: '/tickets',
  },
  {
    label: 'Completed Today',
    value: '7',
    sub: '↑ 2 from yesterday',
    icon: CheckCircle2,
    iconColor: 'hsl(var(--status-ready))',
    iconBg: 'hsl(var(--status-ready-bg))',
    link: '/tickets',
  },
  {
    label: 'Total Customers',
    value: '248',
    sub: '+4 this week',
    icon: Users,
    iconColor: 'hsl(38 90% 65%)',
    iconBg: 'hsl(38 70% 14%)',
    link: '/customers',
  },
  {
    label: 'Low Stock Items',
    value: String(LOW_STOCK_PARTS.length),
    sub: 'Need reorder',
    icon: AlertTriangle,
    iconColor: 'hsl(0 90% 65%)',
    iconBg: 'hsl(0 70% 14%)',
    link: '/inventory-portal',
  },
];

export default function DashboardPage() {
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle({ title: 'Dashboard' });
  }, [setPageTitle]);

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((card) => (
          <Link key={card.label} to={card.link} className="block group">
            <div
              className="rounded-xl border p-4 flex items-start gap-3 transition-colors group-hover:border-opacity-60"
              style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = card.iconColor + '66'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border))'; }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: card.iconBg }}
              >
                <card.icon className="w-5 h-5" style={{ color: card.iconColor }} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold leading-tight" style={{ color: 'hsl(var(--foreground))' }}>
                  {card.value}
                </p>
                <p className="text-[11px] font-semibold mt-0.5 uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {card.label}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {card.sub}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Low stock alert */}
      {LOW_STOCK_PARTS.length > 0 && (
        <div
          className="flex items-start justify-between gap-4 p-4 rounded-xl border"
          style={{ background: 'hsl(38 70% 8%)', borderColor: 'hsl(38 60% 20%)' }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'hsl(var(--status-pending))' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'hsl(var(--status-pending))' }}>
                Low Stock Alert — {LOW_STOCK_PARTS.length} item{LOW_STOCK_PARTS.length > 1 ? 's' : ''} need reordering
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'hsl(38 60% 50%)' }}>
                {LOW_STOCK_PARTS.map(p => `${p.name} (${p.stock} left)`).join(' · ')}
              </p>
            </div>
          </div>
          <Link to="/inventory-portal">
            <button
              className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-3 h-7 rounded-lg whitespace-nowrap"
              style={{ background: 'hsl(38 70% 14%)', color: 'hsl(var(--status-pending))' }}
            >
              View Inventory <ArrowRight className="w-3 h-3" />
            </button>
          </Link>
        </div>
      )}

      {/* Main grid: recent tickets + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent tickets table */}
        <div
          className="lg:col-span-2 rounded-xl border overflow-hidden"
          style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
        >
          <div
            className="px-4 py-3 border-b flex items-center justify-between"
            style={{ borderColor: 'hsl(var(--border))' }}
          >
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
              <span className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Recent Tickets</span>
            </div>
            <Link to="/tickets">
              <button
                className="flex items-center gap-1 text-xs font-medium"
                style={{ color: 'hsl(var(--primary))' }}
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                {['Ticket', 'Customer', 'Device', 'Issue', 'Status', 'Date'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECENT_TICKETS.map((t, i) => {
                const s = statusStyle[t.status] ?? statusStyle['Pending'];
                return (
                  <tr
                    key={t.id}
                    className="transition-colors cursor-pointer"
                    style={{ borderBottom: i < RECENT_TICKETS.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
                  >
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-mono font-bold" style={{ color: 'hsl(var(--primary))' }}>{t.id}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>{t.customer}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{t.device}</td>
                    <td className="px-4 py-2.5 text-xs max-w-[120px] truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{t.issue}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
                        style={{ background: s.bg, color: s.color }}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{t.date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Quick actions */}
        <div
          className="rounded-xl border p-4 space-y-3"
          style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Quick Actions</p>
          <div className="space-y-2">
            {[
              { label: 'New Ticket', desc: 'Create a repair ticket', icon: Plus, to: '/tickets/new', primary: true },
              { label: 'Add Customer', desc: 'Register a new customer', icon: UserPlus, to: '/customers' },
              { label: 'Add Part', desc: 'Add inventory part', icon: Package, to: '/inventory-portal' },
            ].map((action) => (
              <Link key={action.label} to={action.to}>
                <div
                  className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
                  style={{ borderColor: action.primary ? 'hsl(0 90% 35% / 0.4)' : 'hsl(var(--border))', background: action.primary ? 'hsl(0 80% 10%)' : 'transparent' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = action.primary ? 'hsl(0 80% 12%)' : 'hsl(var(--muted))';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = action.primary ? 'hsl(0 80% 10%)' : 'transparent';
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: action.primary ? 'hsl(0 80% 18%)' : 'hsl(var(--muted))' }}
                  >
                    <action.icon
                      className="w-4 h-4"
                      style={{ color: action.primary ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}
                    />
                  </div>
                  <div>
                    <p
                      className="text-xs font-semibold"
                      style={{ color: action.primary ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}
                    >
                      {action.label}
                    </p>
                    <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{action.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'hsl(var(--border))' }} />

          {/* Summary */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Today at a Glance
            </p>
            {[
              { label: 'Revenue', value: 'GH₵ 1,240' },
              { label: 'Tickets Opened', value: '3' },
              { label: 'Tickets Closed', value: '7' },
              { label: 'Avg Repair Time', value: '2.4 hrs' },
            ].map((stat) => (
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
