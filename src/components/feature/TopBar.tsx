import { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Plus, ShoppingBag, Wrench, CreditCard, TriangleAlert, Zap, X, CheckCheck, Cake, Sun, Moon, Menu } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useTheme } from '@/context/ThemeContext';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { useUpcomingBirthdays, type UpcomingBirthday } from '@/hooks/useUpcomingBirthdays';
import { useAuth } from '@/hooks/useAuth';
import { useRepairs } from '@/hooks/useRepairs';
import { useWirelessCustomers } from '@/hooks/useWirelessCustomers';
import { useInventory } from '@/hooks/useInventory';
import { useInvoices } from '@/hooks/useInvoices';
import { canAccessModule } from '@/utils/access';
import SearchDropdown, { type SearchItem } from '@/components/shared/SearchDropdown';

type NavItem = SearchItem & { to: string };

interface TopBarProps {
  title?: string;
  subtitle?: string;
  onMenuClick?: () => void;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFormattedDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

const NOTIF_PREVIEW_COUNT = 5;

const typeIcon: Record<Notification['type'], React.ReactNode> = {
  sale:    <ShoppingBag className="w-3.5 h-3.5" />,
  lead:    <Zap className="w-3.5 h-3.5" />,
  repair:  <Wrench className="w-3.5 h-3.5" />,
  payment: <CreditCard className="w-3.5 h-3.5" />,
  alert:   <TriangleAlert className="w-3.5 h-3.5" />,
};

const typeColor: Record<Notification['type'], string> = {
  sale:    'hsl(142 60% 40%)',
  lead:    'hsl(38 90% 45%)',
  repair:  'hsl(190 80% 40%)',
  payment: 'hsl(220 70% 50%)',
  alert:   'hsl(354 60% 40%)',
};

const typeBg: Record<Notification['type'], string> = {
  sale:    'hsl(142 60% 94%)',
  lead:    'hsl(38 90% 93%)',
  repair:  'hsl(190 80% 93%)',
  payment: 'hsl(220 70% 94%)',
  alert:   'hsl(354 60% 94%)',
};

function NotifRow({ n }: { n: Notification }) {
  return (
    <div
      className="flex items-start gap-3 px-4 py-3 transition-colors"
      style={{ background: n.read ? 'transparent' : 'hsl(354 60% 98.5%)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = n.read ? 'transparent' : 'hsl(354 60% 98.5%)'; }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: typeBg[n.type], color: typeColor[n.type] }}
      >
        {typeIcon[n.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>{n.title}</p>
        <p className="text-[11px] leading-snug mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{n.message}</p>
        {n.amount != null && (
          <p className="text-[11px] font-semibold mt-0.5" style={{ color: typeColor[n.type] }}>
            GH₵ {n.amount.toLocaleString()}
          </p>
        )}
      </div>
      <p className="text-[10px] flex-shrink-0 mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
        {fmtTime(n.time)}
      </p>
      {!n.read && (
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2" style={{ background: 'hsl(354 60% 45%)' }} />
      )}
    </div>
  );
}

function BirthdayRow({ b }: { b: UpcomingBirthday }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 transition-colors"
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold"
        style={{ background: 'hsl(38 85% 55%)' }}>
        {b.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>{b.name}</p>
        <p className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Birthday · {b.label}</p>
      </div>
      <Cake className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'hsl(38 85% 45%)' }} />
    </div>
  );
}

function NotifToast({ n, onDismiss }: { n: Notification; onDismiss: () => void }) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl shadow-lg animate-in slide-in-from-right-4"
      style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        minWidth: 280,
        maxWidth: 320,
      }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: typeBg[n.type], color: typeColor[n.type] }}
      >
        {typeIcon[n.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{n.title}</p>
        <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'hsl(var(--muted-foreground))' }}>{n.message}</p>
        {n.amount != null && (
          <p className="text-[11px] font-semibold mt-0.5" style={{ color: typeColor[n.type] }}>
            GH₵ {n.amount.toLocaleString()}
          </p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded opacity-50 hover:opacity-100 transition-opacity"
        style={{ color: 'hsl(var(--muted-foreground))' }}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function TopBar({ title = 'Dashboard', subtitle, onMenuClick }: TopBarProps) {
  const { pageTitle } = usePageTitle();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [bellOpen, setBellOpen] = useState(false);
  const [showAllNotifs, setShowAllNotifs] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const { notifications, toasts, unreadCount, markAllRead, dismissToast, clearToasts } = useNotifications();
  const upcomingBirthdays = useUpcomingBirthdays();
  const { theme, toggleTheme } = useTheme();

  const { repairs } = useRepairs();
  const { customers } = useWirelessCustomers();
  const { products } = useInventory();
  const { invoices } = useInvoices();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const searchResults = useMemo<NavItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const role = user?.role;
    const results: NavItem[] = [];

    if (canAccessModule(role, 'Tickets')) {
      for (const r of repairs) {
        if (`${r.id} ${r.customer} ${r.device} ${r.issue}`.toLowerCase().includes(q)) {
          results.push({
            id: `repair:${r.id}`, to: '/tickets',
            primary: `${r.device} — ${r.customer || 'Unknown'}`,
            secondary: r.issue,
            meta: r.id,
            badge: { label: 'Ticket', bg: 'hsl(190 80% 93%)', color: 'hsl(190 80% 35%)' },
          });
        }
      }
    }
    if (canAccessModule(role, 'Customers')) {
      for (const c of customers) {
        if (`${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(q)) {
          results.push({
            id: `customer:${c.id}`, to: '/customers',
            primary: c.name,
            secondary: `${c.phone}${c.email ? ' · ' + c.email : ''}`,
            meta: `${c.ticket_count} repair${c.ticket_count !== 1 ? 's' : ''}`,
            badge: { label: 'Customer', bg: 'hsl(262 60% 93%)', color: 'hsl(262 55% 45%)' },
          });
        }
      }
    }
    if (canAccessModule(role, 'Inventory')) {
      for (const p of products) {
        if (`${p.name} ${p.category}`.toLowerCase().includes(q)) {
          results.push({
            id: `product:${p.id}`, to: '/inventory',
            primary: p.name,
            secondary: `${p.category} · ${p.stock} in stock`,
            meta: p.price,
            badge: { label: 'Product', bg: 'hsl(38 90% 93%)', color: 'hsl(38 80% 38%)' },
          });
        }
      }
    }
    if (canAccessModule(role, 'Invoices')) {
      for (const inv of invoices) {
        if (`${inv.invoice_number} ${inv.customer?.name ?? ''}`.toLowerCase().includes(q)) {
          results.push({
            id: `invoice:${inv.id}`, to: '/invoices',
            primary: `Invoice ${inv.invoice_number}`,
            secondary: inv.customer?.name ?? 'Unknown customer',
            meta: `GH₵ ${inv.total.toLocaleString()}`,
            badge: { label: 'Invoice', bg: 'hsl(142 55% 91%)', color: 'hsl(142 55% 28%)' },
          });
        }
      }
    }
    return results.slice(0, 20);
  }, [query, user?.role, repairs, customers, products, invoices]);

  const handleSelect = (item: SearchItem) => {
    const to = (item as NavItem).to;
    setQuery('');
    if (to) navigate(to);
  };

  const displaySubtitle = subtitle ?? `${getGreeting()} · ${getFormattedDate()}`;

  return (
    <>
      <header
        className="h-14 flex items-center justify-between gap-2 px-3 sm:px-6 flex-shrink-0 border-b"
        style={{
          background: 'hsl(var(--card))',
          borderColor: 'hsl(var(--border))',
        }}
      >
        {/* Left: menu toggle + page title */}
        <div className="flex items-center gap-2 min-w-0">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg transition-colors flex-shrink-0"
              style={{ color: 'hsl(var(--muted-foreground))' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
              aria-label="Open menu"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>
          )}
          <div className="min-w-0">
            <h1
              className="text-sm font-bold tracking-wide uppercase truncate"
              style={{ color: 'hsl(var(--foreground))' }}
            >
              {title}
            </h1>
            <p
              className="text-[11px] mt-0.5 truncate hidden sm:block"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              {displaySubtitle}
            </p>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
          {/* Extra outline buttons (e.g. invoice actions) */}
          {pageTitle.extraActions?.map((ea, i) => (
            <button
              key={i}
              onClick={ea.onClick}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold transition-colors"
              style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', background: 'transparent' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              {ea.icon}
              {ea.label}
            </button>
          ))}
          {/* Secondary action (outline) */}
          {pageTitle.secondaryAction && (
            <button
              onClick={pageTitle.secondaryAction.onClick}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold transition-colors"
              style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', background: 'transparent' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              {pageTitle.secondaryAction.label}
            </button>
          )}
          {/* Primary action or default New Repair */}
          {pageTitle.action ? (
            <button
              onClick={pageTitle.action.onClick}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'hsl(var(--primary))' }}
            >
              <Plus className="w-3.5 h-3.5" />
              {pageTitle.action.label}
            </button>
          ) : !pageTitle.hideDefaultAction ? (
            <Link to="/tickets">
              <button
                className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: 'hsl(var(--primary))' }}
              >
                <Plus className="w-3.5 h-3.5" />
                New Ticket
              </button>
            </Link>
          ) : null}

          {/* Search */}
          <div className="hidden md:block">
            <SearchDropdown
              query={query}
              onQueryChange={setQuery}
              suggestions={searchResults}
              onSelect={handleSelect}
              placeholder="Search... ⌘K"
              width={224}
              inputRef={inputRef}
            />
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: 'hsl(var(--muted-foreground))' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Bell */}
          <div ref={bellRef} className="relative">
            <button
              onClick={() => { setBellOpen(o => !o); if (bellOpen) setShowAllNotifs(false); if (!bellOpen) { clearToasts(); if (unreadCount > 0) markAllRead(); } }}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors relative ${bellOpen ? 'text-brand-500' : ''}`}
              style={!bellOpen ? { color: 'hsl(var(--muted-foreground))' } : undefined}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {(unreadCount + upcomingBirthdays.length) > 0 && (
                <span
                  className={`absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 flex items-center justify-center rounded-full text-[9px] font-bold text-white px-0.5 ${upcomingBirthdays.length > 0 && unreadCount === 0 ? '' : 'bg-brand-500'}`}
                  style={upcomingBirthdays.length > 0 && unreadCount === 0 ? { background: 'hsl(38 85% 48%)' } : undefined}
                >
                  {(unreadCount + upcomingBirthdays.length) > 9 ? '9+' : unreadCount + upcomingBirthdays.length}
                </span>
              )}
            </button>

            {/* Dropdown panel */}
            {bellOpen && (
              <div
                className="absolute top-full mt-2 right-0 z-[110] rounded-xl overflow-hidden"
                style={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  width: 340,
                  maxWidth: 'calc(100vw - 2rem)',
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
                  <div>
                    <p className="text-xs font-bold" style={{ color: 'hsl(var(--foreground))' }}>Notifications</p>
                    {unreadCount > 0 && (
                      <p className="text-[10px] mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{unreadCount} unread</p>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={markAllRead}
                      className="flex items-center gap-1 text-[11px] font-medium transition-opacity hover:opacity-70 text-brand-500"
                    >
                      <CheckCheck className="w-3 h-3" />
                      Mark all read
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="overflow-y-auto" style={{ maxHeight: 360 }}>
                  {upcomingBirthdays.length > 0 && (
                    <div style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                      <p className="px-4 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                        style={{ color: 'hsl(38 80% 40%)' }}>
                        <Cake className="w-3 h-3" />Upcoming Birthdays
                      </p>
                      <div className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
                        {upcomingBirthdays.map(b => <BirthdayRow key={b.id} b={b} />)}
                      </div>
                    </div>
                  )}
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                      <Bell className="w-6 h-6 opacity-20" style={{ color: 'hsl(var(--foreground))' }} />
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No notifications yet</p>
                    </div>
                  ) : (
                    <>
                      <div className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
                        {(showAllNotifs ? notifications : notifications.slice(0, NOTIF_PREVIEW_COUNT)).map(n => <NotifRow key={n.id} n={n} />)}
                      </div>
                      {notifications.length > NOTIF_PREVIEW_COUNT && (
                        <button
                          onClick={() => setShowAllNotifs(v => !v)}
                          className="w-full text-center py-2.5 text-[11px] font-semibold transition-opacity hover:opacity-70 text-brand-500"
                          style={{ borderTop: '1px solid hsl(var(--border))' }}
                        >
                          {showAllNotifs ? 'Show less' : `Show all (${notifications.length})`}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Toast stack — bottom-right */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[100] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 'calc(100vw - 2rem)' }}>
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <NotifToast n={t} onDismiss={() => dismissToast(t.id)} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
