import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  HardHat,
  ShoppingBag,
  Package,
  FileText,
  ExternalLink,
  Wrench,
  Boxes,
  ConciergeBell,
  Activity,
  Settings,
} from 'lucide-react';

const mainNav = [
  { label: 'Dashboard',         icon: LayoutDashboard, path: '/' },
  { label: 'Tickets',           icon: ClipboardList,   path: '/tickets' },
  { label: 'Customers',         icon: Users,           path: '/customers' },
  { label: 'Technicians',       icon: HardHat,         path: '/technicians' },
  { label: 'Accessories Sales', icon: ShoppingBag,     path: '/sales' },
  { label: 'Inventory',         icon: Package,         path: '/inventory' },
  { label: 'Invoices',          icon: FileText,        path: '/invoices' },
];

const portalNav = [
  { label: 'Customer Portal',  icon: ExternalLink,   path: '/portal' },
  { label: 'Tech Portal',      icon: Wrench,         path: '/tech-portal' },
  { label: 'Inventory Portal', icon: Boxes,          path: '/inventory-portal' },
  { label: 'Reception Portal', icon: ConciergeBell,  path: '/reception' },
];

const bottomNav = [
  { label: 'Activity Log', icon: Activity, path: '/activity' },
  { label: 'Settings',     icon: Settings,  path: '/settings' },
];

function NavLink({
  item,
  active,
}: {
  item: { label: string; icon: React.ElementType; path: string };
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      className={[
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
        active
          ? 'text-white border'
          : 'border border-transparent hover:text-white',
      ].join(' ')}
      style={
        active
          ? {
              background: 'hsl(0 80% 12%)',
              borderColor: 'hsl(0 90% 35% / 0.4)',
              boxShadow: 'rgba(242,13,13,0.08) 0px 0px 12px inset',
              color: 'white',
            }
          : {
              color: 'hsl(var(--sidebar-foreground))',
            }
      }
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = 'hsl(var(--sidebar-accent))';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = '';
        }
      }}
    >
      <Icon
        className="w-4 h-4 flex-shrink-0"
        style={{ color: active ? 'hsl(0,90%,55%)' : undefined }}
        aria-hidden="true"
      />
      {item.label}
      {active && (
        <span
          className="ml-auto w-1 h-1 rounded-full"
          style={{
            background: 'hsl(0,90%,55%)',
            boxShadow: 'rgba(244,37,37,0.8) 0px 0px 4px',
          }}
        />
      )}
    </Link>
  );
}

export default function Sidebar() {
  const location = useLocation();

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <aside
      className="w-60 flex-shrink-0 h-full flex flex-col border-r"
      style={{
        background: 'hsl(var(--sidebar-background))',
        borderColor: 'hsl(var(--sidebar-border))',
      }}
    >
      {/* Logo */}
      <div
        className="px-6 py-5 border-b"
        style={{ borderColor: 'hsl(var(--sidebar-border))' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="rounded-xl flex-shrink-0 overflow-hidden"
            style={{
              width: 40,
              height: 40,
              background: 'rgb(15,15,15)',
              boxShadow:
                'rgba(255,0,0,0.7) 0px 0px 12px 3px, rgba(255,0,0,0.4) 0px 0px 28px 6px, rgba(255,0,0,0.2) 0px 0px 50px 10px',
            }}
          >
            <img
              src="/wireless-logo.png"
              alt="WIRELESS logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: '63% 70%',
                filter: 'invert(1) hue-rotate(180deg)',
              }}
            />
          </div>
          <div>
            <p className="text-sm font-black tracking-[0.12em] text-white uppercase">
              WIRELESS
            </p>
            <p
              className="text-[9px] leading-tight tracking-widest uppercase"
              style={{ color: 'hsl(var(--sidebar-foreground))' }}
            >
              Repair &amp; Service
            </p>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p
          className="px-3 py-2 text-[9px] font-bold uppercase tracking-[0.15em] opacity-50"
          style={{ color: 'hsl(var(--sidebar-foreground))' }}
        >
          Main Menu
        </p>
        {mainNav.map((item) => (
          <NavLink key={item.path} item={item} active={isActive(item.path)} />
        ))}
      </nav>

      {/* Bottom section */}
      <div
        className="px-3 py-4 border-t space-y-0.5"
        style={{ borderColor: 'hsl(var(--sidebar-border))' }}
      >
        {portalNav.map((item) => (
          <NavLink key={item.path} item={item} active={isActive(item.path)} />
        ))}

        <div
          className="my-1"
          style={{ height: 1, background: 'hsl(var(--sidebar-border))' }}
        />

        {bottomNav.map((item) => (
          <NavLink key={item.path} item={item} active={isActive(item.path)} />
        ))}

        <p
          className="px-3 pt-2 text-[9px] tracking-widest uppercase opacity-30"
          style={{ color: 'hsl(var(--sidebar-foreground))' }}
        >
          v1.0.0 · WIRELESS
        </p>
      </div>
    </aside>
  );
}
