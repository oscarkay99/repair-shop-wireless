import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sun, Moon, Plus, ClipboardList, LogOut,
  FileText, ShoppingCart, Package, UserCog, Cake, Wallet, ArrowLeftRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { useWirelessSettings } from '@/hooks/useWirelessSettings';
import { useInvoices } from '@/hooks/useInvoices';
import { useUpcomingBirthdays } from '@/hooks/useUpcomingBirthdays';
import { roleColors, roleLabels } from '@/mocks/users';
import ClockInOutButton from '@/components/shared/ClockInOutButton';
import TicketsPanel from './components/TicketsPanel';
import InvoicesPanel from './components/InvoicesPanel';
import SalesPanel from './components/SalesPanel';
import InventoryPanel from './components/InventoryPanel';
import TechniciansPanel from './components/TechniciansPanel';
import BirthdaysPanel from './components/BirthdaysPanel';
import BirthdayBanner from '@/components/shared/BirthdayBanner';
import CustomerBirthdayBanner from '@/components/shared/CustomerBirthdayBanner';
import PaymentStats from '@/pages/payments/components/PaymentStats';
import TransactionTable from '@/pages/payments/components/TransactionTable';

type TabKey = 'tickets' | 'invoices' | 'payments' | 'sales' | 'inventory' | 'technicians' | 'birthdays';

const NAV_TABS: { key: TabKey; label: string; icon: typeof ClipboardList }[] = [
  { key: 'tickets',     label: 'Tickets',     icon: ClipboardList },
  { key: 'invoices',    label: 'Invoices',    icon: FileText },
  { key: 'payments',    label: 'Payments',    icon: Wallet },
  { key: 'sales',       label: 'Sales',       icon: ShoppingCart },
  { key: 'inventory',   label: 'Inventory',   icon: Package },
  { key: 'technicians', label: 'Technicians', icon: UserCog },
  { key: 'birthdays',   label: 'Birthdays',   icon: Cake },
];

export default function ReceptionPortalPage() {
  const { user, logout, switchRole } = useAuth();
  const [switching, setSwitching] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { settings } = useWirelessSettings();
  const { invoices } = useInvoices();
  const todaysBirthdays = useUpcomingBirthdays(0);

  const [activeTab, setActiveTab] = useState<TabKey>('tickets');

  const invoicesNeedingAttention = invoices.filter(i => i.status === 'unpaid' || i.status === 'overdue').length;

  const handleSignOut = async () => {
    await logout();
    navigate('/signin', { replace: true });
  };

  const handleSwitchRole = async () => {
    setSwitching(true);
    try { await switchRole(); navigate('/'); }
    finally { setSwitching(false); }
  };

  return (
    <div className="h-screen flex flex-col" style={{ background: 'hsl(var(--background))' }}>
      {/* Header */}
      <header className="border-b flex-shrink-0" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={
                theme === 'dark'
                  ? settings?.logo_url_dark || settings?.logo_url || '/wireless-logo-dark.png'
                  : settings?.logo_url || '/wireless-logo-light.png'
              }
              alt={settings?.business_name || 'WIRELESS'}
              style={{ height: 34, width: 'auto', objectFit: 'contain' }}
            />
            <p className="text-[9px] tracking-widest uppercase leading-none" style={{ color: 'hsl(var(--muted-foreground))' }}>Reception</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Set only by an admin (20260826030000_dual_role_switch.sql) —
                lets whoever covers both jobs (e.g. Esther) swap into their
                other role's dashboard without a second account. */}
            {user?.altRole && (
              <button
                onClick={handleSwitchRole}
                disabled={switching}
                className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0 disabled:opacity-50"
                style={{ color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}
                title={`Switch to ${user.altRoleName ?? 'other role'}`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" /> {switching ? 'Switching…' : (user.altRoleName ?? 'Switch Role')}
              </button>
            )}
            <ClockInOutButton />
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors flex-shrink-0"
              style={{ color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <Link to="/tickets">
              <button
                className="h-8 px-3 flex items-center gap-1.5 rounded-md text-xs font-semibold text-white cursor-pointer transition-shadow"
                style={{ background: 'hsl(var(--primary))' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 16px hsl(0 90% 50% / 0.5)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
              >
                <Plus className="w-3.5 h-3.5" /> New Ticket
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Tabs — all render inline below, nothing here navigates away */}
      <nav className="border-b flex-shrink-0" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto">
          {NAV_TABS.map(tab => {
            const active = activeTab === tab.key;
            const badge = tab.key === 'invoices' ? invoicesNeedingAttention
              : tab.key === 'birthdays' ? todaysBirthdays.length
              : 0;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors cursor-pointer"
                style={{
                  color: active ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                  borderColor: active ? 'hsl(var(--primary))' : 'transparent',
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {badge > 0 && (
                  <span
                    className="w-4 h-4 rounded-full text-[8px] font-black flex items-center justify-center flex-shrink-0"
                    style={tab.key === 'birthdays'
                      ? { background: 'hsl(45,90%,55%)', color: 'black' }
                      : { background: 'hsl(var(--status-pending))', color: 'white' }}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-4xl mx-auto w-full px-4 py-6">
          <BirthdayBanner />
          <CustomerBirthdayBanner />
          {activeTab === 'tickets' && <TicketsPanel />}
          {activeTab === 'invoices' && <InvoicesPanel />}
          {activeTab === 'payments' && (
            <div className="space-y-5">
              <PaymentStats />
              <TransactionTable />
            </div>
          )}
          {activeTab === 'sales' && <SalesPanel />}
          {activeTab === 'inventory' && <InventoryPanel />}
          {activeTab === 'technicians' && <TechniciansPanel />}
          {activeTab === 'birthdays' && <BirthdaysPanel />}
        </div>

        <footer className="border-t mt-6" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="max-w-4xl mx-auto px-4 py-4 text-center">
            <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>© {new Date().getFullYear()} WIRELESS · Reception Portal</p>
          </div>
        </footer>
      </div>

      {/* User card + sign out — bottom-left, matching the sidebar's convention in every other role */}
      {user && (
        <div className="fixed bottom-4 left-4 z-40 rounded-xl p-3 flex items-center gap-2.5 max-w-[calc(100vw-2rem)]"
          style={{ background: 'hsl(220 14% 94%)', border: '1px solid hsl(220 13% 88%)' }}>
          <Link
            to="/profile"
            title="View profile"
            className="flex items-center gap-2.5 flex-1 min-w-0 rounded-lg -m-1 p-1 transition-colors cursor-pointer"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(220 13% 88%)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
              style={{ background: user.roleColor ?? (user.role ? roleColors[user.role] : undefined) ?? 'hsl(354 60% 35%)' }}
            >
              {user.avatar || user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'hsl(220 20% 12%)' }}>{user.name}</p>
              <p className="text-[10px] truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {user.roleName ?? (user.role ? (roleLabels[user.role] ?? user.role) : user.role)}
              </p>
            </div>
          </Link>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 cursor-pointer transition-colors hover:bg-red-50 hover:text-red-500"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
