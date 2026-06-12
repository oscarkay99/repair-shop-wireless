import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDarkMode } from '@/hooks/useDarkMode';
import { roleLabels } from '@/mocks/users';
import { canAccessModule } from '@/utils/access';
import { navGroups, publicItems } from './navigation';

function WirelessLogoMark({ size = 32 }: { size?: number }) {
  return (
    <img
      src="/wireless-logo.png"
      alt="Wireless"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: 'contain', display: 'block' }}
    />
  );
}

function WirelessWordmark({ isDark }: { isDark: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-lg overflow-hidden"
        style={{ width: 30, height: 30, background: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(220,31,31,0.08)' }}
      >
        <WirelessLogoMark size={24} />
      </div>
      <span
        className="text-[18px] font-bold tracking-tight lowercase"
        style={{
          color: isDark ? 'white' : '#0F172A',
          letterSpacing: '-0.03em',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        }}
      >
        wireless
      </span>
    </div>
  );
}

const roleGradients: Record<string, string> = {
  admin:             'linear-gradient(135deg, #991B1B, #DC1F1F)',
  sales_manager:     'linear-gradient(135deg, #D97706, #F59E0B)',
  sales_rep:         'linear-gradient(135deg, #059669, #10B981)',
  technician:        'linear-gradient(135deg, #0E7490, #06B6D4)',
  inventory_manager: 'linear-gradient(135deg, #475569, #64748b)',
};

interface SidebarProps {
  onWidthChange?: (width: number) => void;
}

export default function Sidebar({ onWidthChange }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDark } = useDarkMode();
  const [collapsed, setCollapsed] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    onWidthChange?.(collapsed ? 72 : 260);
  }, [collapsed, onWidthChange]);

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessModule(user?.role, item.module)),
    }))
    .filter((group) => group.items.length > 0);

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const handleLogout = () => { logout(); navigate('/signin'); };

  const avatarGradient = user?.role ? roleGradients[user.role] : roleGradients.admin;

  const dividerColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.07)';
  const inactiveIcon  = isDark ? 'rgba(255,255,255,0.32)' : '#94a3b8';
  const inactiveLabel = isDark ? 'rgba(255,255,255,0.45)' : '#64748b';
  const hoverBg       = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.05)';
  const groupLabelColor = isDark ? 'rgba(200,64,21,0.65)' : 'rgba(220,31,31,0.55)';
  const actionBase    = isDark ? 'rgba(255,255,255,0.28)' : '#94a3b8';

  return (
    <aside
      className={`fixed left-0 top-0 h-full flex flex-col z-40 transition-[width] duration-300 select-none`}
      style={{
        width: collapsed ? 72 : 260,
        background: isDark
          ? 'linear-gradient(170deg, #160403 0%, #240807 55%, #160403 100%)'
          : 'white',
        borderRight: isDark ? 'none' : '1px solid rgba(15,23,42,0.07)',
        boxShadow: isDark ? 'none' : '4px 0 20px rgba(15,23,42,0.04)',
      }}
    >
      {/* Top shimmer — dark only */}
      {isDark && (
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(200,64,21,0.7), rgba(200,64,21,0.3), transparent)' }} />
      )}

      {/* Logo */}
      <div
        className={`flex items-center flex-shrink-0 ${collapsed ? 'justify-center px-3 py-4' : 'px-5 py-4'}`}
        style={{ borderBottom: `1px solid ${dividerColor}` }}
      >
        {collapsed ? (
          <div
            className="flex items-center justify-center rounded-lg overflow-hidden"
            style={{ width: 34, height: 34, background: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(220,31,31,0.08)' }}
          >
            <WirelessLogoMark size={26} />
          </div>
        ) : <WirelessWordmark isDark={isDark} />}
      </div>

      {/* Nav */}
      <nav ref={navRef} className="sidebar-nav flex-1 overflow-y-auto py-3 px-2">
        {visibleGroups.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? 'mt-1' : ''}>
            {!collapsed && (
              <div className="flex items-center gap-2 px-3 pt-4 pb-1.5">
                <span
                  className="text-[9px] font-bold uppercase tracking-[0.14em]"
                  style={{ color: groupLabelColor }}
                >
                  {group.label}
                </span>
                <div className="flex-1 h-px" style={{ background: dividerColor }} />
              </div>
            )}
            {collapsed && gi > 0 && (
              <div className="mx-3 my-2 h-px" style={{ background: dividerColor }} />
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 rounded-xl transition-all duration-150 cursor-pointer group relative overflow-hidden ${
                      collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2'
                    }`}
                    style={active ? { background: '#DC1F1F', boxShadow: '0 4px 16px rgba(220,31,31,0.30)' } : undefined}
                    onMouseEnter={(e) => {
                      if (!active) (e.currentTarget as HTMLElement).style.background = hoverBg;
                    }}
                    onMouseLeave={(e) => {
                      if (!active) (e.currentTarget as HTMLElement).style.background = '';
                    }}
                  >
                    <div className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0">
                      <i
                        className={`${item.icon} text-[15px]`}
                        style={{ color: active ? 'white' : inactiveIcon }}
                      />
                    </div>
                    {!collapsed && (
                      <span
                        className="text-[13px] font-semibold flex-1 text-left leading-none"
                        style={{ color: active ? 'white' : inactiveLabel }}
                      >
                        {item.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Public */}
        <div className="mt-1">
          {!collapsed && (
            <div className="flex items-center gap-2 px-3 pt-4 pb-1.5">
              <span className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: groupLabelColor }}>Public</span>
              <div className="flex-1 h-px" style={{ background: dividerColor }} />
            </div>
          )}
          {collapsed && <div className="mx-3 my-2 h-px" style={{ background: dividerColor }} />}
          {publicItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 rounded-xl transition-all duration-150 cursor-pointer group relative overflow-hidden ${
                  collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2'
                }`}
                style={active ? { background: '#DC1F1F', boxShadow: '0 4px 16px rgba(220,31,31,0.30)' } : undefined}
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = hoverBg; }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = ''; }}
              >
                <div className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0">
                  <i className={`${item.icon} text-[15px]`} style={{ color: active ? 'white' : inactiveIcon }} />
                </div>
                {!collapsed && (
                  <span className="text-[13px] font-semibold flex-1 text-left" style={{ color: active ? 'white' : inactiveLabel }}>
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Bottom — user + actions */}
      <div className="flex-shrink-0 p-3" style={{ borderTop: `1px solid ${dividerColor}` }}>
        {/* Avatar row (expanded only) */}
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-2 py-2 mb-1 rounded-xl">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
              style={{ background: avatarGradient }}
            >
              {user?.avatar ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold leading-tight truncate" style={{ color: isDark ? 'rgba(255,255,255,0.85)' : '#0F172A' }}>{user?.name ?? 'User'}</p>
              <p className="text-[10px] leading-tight mt-0.5 truncate" style={{ color: isDark ? 'rgba(255,255,255,0.35)' : '#94a3b8' }}>
                {user?.role ? roleLabels[user.role] : ''}
              </p>
            </div>
          </div>
        )}

        {/* Action row */}
        <div className={`flex ${collapsed ? 'flex-col items-center gap-1' : 'items-center gap-1'}`}>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className={`flex items-center justify-center gap-1.5 rounded-xl transition-all cursor-pointer ${collapsed ? 'w-10 h-9' : 'flex-1 py-2'}`}
            style={{ color: actionBase }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)';
              (e.currentTarget as HTMLElement).style.color = '#EF4444';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = '';
              (e.currentTarget as HTMLElement).style.color = actionBase;
            }}
          >
            <i className="ri-logout-box-line text-sm" />
            {!collapsed && <span className="text-[11px] font-medium">Sign Out</span>}
          </button>

          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`flex items-center justify-center gap-1.5 rounded-xl transition-all cursor-pointer ${collapsed ? 'w-10 h-9' : 'flex-1 py-2'}`}
            style={{ color: actionBase }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = hoverBg;
              (e.currentTarget as HTMLElement).style.color = isDark ? 'rgba(255,255,255,0.7)' : '#475569';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = '';
              (e.currentTarget as HTMLElement).style.color = actionBase;
            }}
          >
            <i className={`${collapsed ? 'ri-arrow-right-double-line' : 'ri-arrow-left-double-line'} text-sm`} />
            {!collapsed && <span className="text-[11px] font-medium">Collapse</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
