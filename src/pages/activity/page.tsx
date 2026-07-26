import { useEffect, useMemo, useState } from 'react';
import { usePageTitle } from '@/context/PageTitleContext';
import { Activity, User, ClipboardList, Package, Settings, Receipt, FileText, HardHat, LogIn, LogOut } from 'lucide-react';
import { getAuditLogs, SYSTEM_ACTOR, type AuditLogRecord } from '@/services/wireless/auditLogs';
import { getWirelessUsers } from '@/services/wireless/users';
import Pagination from '@/components/shared/Pagination';

const PAGE_SIZE = 20;

const MODULE_ICON: Record<string, { icon: typeof Activity; color: string }> = {
  tickets:          { icon: ClipboardList, color: 'hsl(var(--status-in-progress))' },
  ticket_media:     { icon: ClipboardList, color: 'hsl(var(--status-in-progress))' },
  customers:        { icon: User,          color: 'hsl(38 90% 65%)' },
  parts:            { icon: Package,       color: 'hsl(var(--status-ready))' },
  technicians:      { icon: HardHat,       color: 'hsl(190 70% 55%)' },
  invoices:         { icon: FileText,      color: 'hsl(262 55% 60%)' },
  invoice_items:    { icon: FileText,      color: 'hsl(262 55% 60%)' },
  accessory_sales:  { icon: Package,       color: 'hsl(var(--status-ready))' },
  sale_items:       { icon: Package,       color: 'hsl(var(--status-ready))' },
  expenses:         { icon: Receipt,       color: 'hsl(0 70% 60%)' },
  settings:         { icon: Settings,      color: 'hsl(var(--muted-foreground))' },
  security:         { icon: LogIn,         color: 'hsl(142 70% 45%)' },
};

function moduleLabel(entityType: string) {
  return entityType.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr${hr !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hr / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function exactTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function ActivityPage() {
  const { setPageTitle } = usePageTitle();
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [userNames, setUserNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userFilter, setUserFilter] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPageTitle({ title: 'Activity Log', subtitle: 'Real-time audit trail of all system actions' });
    return () => setPageTitle({ title: 'Dashboard' });
  }, [setPageTitle]);

  useEffect(() => { setPage(1); }, [userFilter]);

  useEffect(() => {
    setLoading(true);
    getAuditLogs({ page, pageSize: PAGE_SIZE, actorName: userFilter === 'all' ? undefined : userFilter })
      .then(({ logs: records, total: count }) => { setLogs(records); setTotal(count); })
      .finally(() => setLoading(false));
  }, [page, userFilter]);

  useEffect(() => {
    // The filter list is every registered user, not just ones who've already
    // logged an action — a brand-new user with no activity yet still needs
    // to show up so staff can confirm "yep, nothing from them."
    getWirelessUsers().then(rows => setUserNames(rows.map(u => u.name))).catch(() => setUserNames([]));
  }, []);

  const users = useMemo(() => [...userNames].sort((a, b) => a.localeCompare(b)), [userNames]);
  const pagedLogs = logs;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {loading ? 'Loading…' : `${total} recent event${total !== 1 ? 's' : ''}`}
        </p>
        {!loading && users.length > 0 && (
          <select value={userFilter} onChange={e => setUserFilter(e.target.value)}
            className="h-8 px-3 rounded-lg text-xs outline-none"
            style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
            <option value="all">All Users</option>
            <option value={SYSTEM_ACTOR}>System</option>
            {users.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        )}
      </div>

      <div
        className="rounded-xl border overflow-hidden divide-y"
        style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', '--tw-divide-opacity': 1 } as React.CSSProperties}
      >
        {loading ? (
          <p className="py-16 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</p>
        ) : total === 0 ? (
          <p className="py-16 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {userFilter === 'all' ? 'No activity recorded yet.' : `No activity from ${userFilter === SYSTEM_ACTOR ? 'System' : userFilter}.`}
          </p>
        ) : pagedLogs.map((entry) => {
          const meta = entry.entityType === 'security' && entry.action === 'signed out'
            ? { icon: LogOut, color: 'hsl(0 70% 60%)' }
            : MODULE_ICON[entry.entityType] ?? { icon: Activity, color: 'hsl(var(--muted-foreground))' };
          return (
            <div
              key={entry.id}
              className="flex items-start gap-4 px-4 py-3.5 transition-colors"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: `${meta.color}20` }}
              >
                <meta.icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs" style={{ color: 'hsl(var(--foreground))' }}>
                  <span className="font-semibold">{entry.actorName || 'System'}</span>{' '}
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>{entry.summary}</span>
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                    style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
                  >
                    {moduleLabel(entry.entityType)}
                  </span>
                  <Activity className="w-2.5 h-2.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <span className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }} title={new Date(entry.createdAt).toLocaleString()}>
                    {entry.entityType === 'security' ? exactTime(entry.createdAt) : timeAgo(entry.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && total > 0 && (
        <Pagination page={page} pageCount={totalPages} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
      )}
    </div>
  );
}
