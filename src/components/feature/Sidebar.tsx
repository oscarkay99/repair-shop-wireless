import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCog,
  ShoppingBag,
  Package,
  FileText,
  Activity,
  Settings,
  Hammer,
  LogOut,
  Receipt,
  CreditCard,
  Clock,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { useWirelessSettings } from '@/hooks/useWirelessSettings';
import { roleLabels, roleColors } from '@/mocks/users';
import { canAccessModule, type AppModule } from '@/utils/access';

type NavItem = { label: string; icon: React.ElementType; path: string; module: AppModule };

const mainNav: NavItem[] = [
  { label: 'Dashboard',         icon: LayoutDashboard, path: '/',            module: 'Dashboard' },
  { label: 'Tickets',           icon: Hammer,          path: '/tickets',     module: 'Tickets' },
  { label: 'Customers',         icon: Users,           path: '/customers',   module: 'Customers' },
  { label: 'Technicians',       icon: UserCog,         path: '/technicians', module: 'Technicians' },
  { label: 'Attendance',        icon: Clock,           path: '/attendance',  module: 'Attendance' },
  { label: 'Accessories Sales', icon: ShoppingBag,     path: '/sales',       module: 'Sales' },
  { label: 'Inventory',         icon: Package,         path: '/inventory',   module: 'Inventory' },
  { label: 'Invoices',          icon: FileText,        path: '/invoices',    module: 'Invoices' },
  { label: 'Payments',          icon: CreditCard,      path: '/payments',    module: 'Payments' },
  { label: 'Expenses & P&L',   icon: Receipt,         path: '/expenses',    module: 'Expenses' },
];

const bottomNav: NavItem[] = [
  { label: 'Activity Log', icon: Activity, path: '/activity', module: 'Activity' },
  { label: 'Settings',     icon: Settings, path: '/settings', module: 'Settings' },
];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      className={[
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
        active ? 'border' : 'border border-transparent',
      ].join(' ')}
      style={
        active
          ? {
              background: 'hsl(354 60% 94%)',
              borderColor: 'hsl(354 60% 76%)',
              boxShadow: 'rgba(142,29,49,0.08) 0px 0px 10px inset',
              color: 'hsl(354 60% 25%)',
            }
          : { color: 'hsl(var(--foreground))' }
      }
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = 'hsl(var(--sidebar-accent))';
          (e.currentTarget as HTMLElement).style.color = 'hsl(354 60% 25%)';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = '';
          (e.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))';
        }
      }}
    >
      <Icon
        className="w-4 h-4 flex-shrink-0"
        style={{ color: active ? 'hsl(354 60% 40%)' : undefined }}
        aria-hidden="true"
      />
      {item.label}
      {active && (
        <span
          className="ml-auto w-1.5 h-1.5 rounded-full"
          style={{ background: 'hsl(354 60% 45%)', boxShadow: 'rgba(142,29,49,0.6) 0px 0px 4px' }}
        />
      )}
    </Link>
  );
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const { settings } = useWirelessSettings();

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const canSee = (module: AppModule) => canAccessModule(user, module);

  const handleLogout = async () => {
    await logout();
    navigate('/signin', { replace: true });
  };

  return (
    <aside
      className={`w-60 flex-shrink-0 h-full flex flex-col border-r fixed inset-y-0 left-0 z-40 transition-transform duration-200 lg:relative lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      style={{ background: 'hsl(var(--sidebar-background))', borderColor: 'hsl(var(--sidebar-border))' }}
    >
      {/* Logo */}
      <div className="px-6 py-5 border-b flex items-start justify-between" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
        <div>
          <div className="flex items-center gap-3">
            <img
              src={
                theme === 'dark'
                  ? settings?.logo_url_dark || settings?.logo_url || '/wireless-logo-dark.png'
                  : settings?.logo_url || '/wireless-logo-light.png'
              }
              alt={settings?.business_name || 'WIRELESS'}
              style={{ height: 22, width: 'auto', objectFit: 'contain' }}
            />
          </div>
          <p className="text-[9px] leading-tight tracking-widest uppercase mt-1.5" style={{ color: 'hsl(var(--sidebar-foreground))' }}>Repair &amp; Service</p>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 cursor-pointer transition-colors hover:bg-[hsl(var(--sidebar-accent))]"
          style={{ color: 'hsl(var(--sidebar-foreground))' }}
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 py-2 text-[9px] font-bold uppercase tracking-[0.15em] opacity-50" style={{ color: 'hsl(var(--sidebar-foreground))' }}>
          Main Menu
        </p>
        {mainNav.filter(item => canSee(item.module)).map(item => (
          <NavLink key={item.path} item={item} active={isActive(item.path)} />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4 border-t space-y-0.5" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
        {bottomNav.filter(item => canSee(item.module)).map(item => (
          <NavLink key={item.path} item={item} active={isActive(item.path)} />
        ))}

        {/* User card + sign out */}
        {user && (
          <div
            className="mt-3 rounded-xl p-3 flex items-center gap-2.5"
            style={{ background: 'hsl(220 14% 94%)', border: '1px solid hsl(220 13% 88%)' }}
          >
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
              onClick={handleLogout}
              title="Sign out"
              className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 cursor-pointer transition-colors hover:bg-red-50 hover:text-red-500"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
