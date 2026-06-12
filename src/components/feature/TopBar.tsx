import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDarkMode } from '@/hooks/useDarkMode';
import { roleLabels } from '@/mocks/users';
import { inventoryProducts } from '@/mocks/inventory';

interface TopBarProps {
  title: string;
  subtitle?: string;
}

interface DeviceSearchItem {
  id: string;
  name: string;
  category: string;
  color?: string;
  condition: string;
  imei?: string;
  stock: number;
}

const roleGradients: Record<string, string> = {
  admin:             'linear-gradient(135deg, #991B1B, #DC1F1F)',
  sales_manager:     'linear-gradient(135deg, #D97706, #F59E0B)',
  sales_rep:         'linear-gradient(135deg, #059669, #10B981)',
  technician:        'linear-gradient(135deg, #0E7490, #06B6D4)',
  inventory_manager: 'linear-gradient(135deg, #475569, #64748b)',
};

export default function TopBar({
  title, subtitle,
}: TopBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const avatarGradient = user?.role ? roleGradients[user.role] : roleGradients.admin;
  const searchableItems = useMemo<DeviceSearchItem[]>(() => inventoryProducts, []);

  const filteredItems = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery) return searchableItems.slice(0, 8);

    return searchableItems
      .map((device) => {
        const nameScore = device.name.toLowerCase().includes(trimmedQuery) ? 3 : 0;
        const imeiScore = device.imei?.toLowerCase().includes(trimmedQuery) ? 3 : 0;
        const colorScore = device.color?.toLowerCase().includes(trimmedQuery) ? 2 : 0;
        const categoryScore = device.category.toLowerCase().includes(trimmedQuery) ? 1 : 0;
        return { item: device, score: nameScore + imeiScore + colorScore + categoryScore };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
      .map(({ item }) => item)
      .slice(0, 8);
  }, [query, searchableItems]);

  useEffect(() => {
    setIsOpen(false);
    setQuery('');
    setActiveIndex(0);
  }, [location.pathname]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!searchWrapRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleShortcut);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleShortcut);
    };
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const openResult = (item: DeviceSearchItem) => {
    const lookup = item.imei && item.imei !== '—' ? item.imei : item.name;
    navigate(`/inventory?search=${encodeURIComponent(lookup)}&selected=${encodeURIComponent(item.id)}`);
    setIsOpen(false);
    setQuery('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && ['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) {
      setIsOpen(true);
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % Math.max(filteredItems.length, 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + Math.max(filteredItems.length, 1)) % Math.max(filteredItems.length, 1));
      return;
    }

    if (event.key === 'Enter' && filteredItems[activeIndex]) {
      event.preventDefault();
      openResult(filteredItems[activeIndex]);
      return;
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <header
      className="h-16 flex items-center justify-between px-6 sticky top-0 z-30"
      style={{
        background: 'var(--topbar-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--topbar-border)',
        boxShadow: '0 1px 0 rgba(0,0,0,0.03), 0 4px 24px rgba(15,23,42,0.05)',
      }}
    >
      {/* Page title */}
      <div>
        <h1 className="text-[15px] font-bold leading-tight" style={{ color: 'var(--text-ink)' }}>{title}</h1>
        {subtitle && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-ink-40)' }}>{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div
          ref={searchWrapRef}
          className="hidden md:flex relative items-center gap-2 rounded-2xl px-3.5 py-2 w-60 transition-all duration-200"
          style={{
            background: 'var(--surface-raised, rgba(15,23,42,0.06))',
            border: '1px solid var(--topbar-border)',
          }}
        >
          <i className="ri-search-line text-sm flex-shrink-0" style={{ color: 'var(--text-ink-40)' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            placeholder="Search devices…"
            className="bg-transparent text-[13px] outline-none flex-1 min-w-0"
            style={{ color: 'var(--text-ink)' }}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
          />
          <div
            className="hidden md:flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md flex-shrink-0"
            style={{ background: 'rgba(15,23,42,0.07)', color: 'var(--text-ink-40)' }}
          >
            <i className="ri-command-line text-[9px]" />K
          </div>

          {isOpen && (
            <div
              className="absolute left-0 top-full mt-2 w-80 rounded-2xl overflow-hidden z-50"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--topbar-border)',
                boxShadow: '0 12px 40px rgba(15,23,42,0.14)',
                backdropFilter: 'blur(24px)',
              }}
            >
              <div className="px-3 py-2 border-b border-slate-100 text-[11px]" style={{ color: 'var(--text-ink-40)' }}>
                {query.trim() ? `Devices matching "${query.trim()}"` : 'Recent device index'}
              </div>
              <div className="py-1">
                {filteredItems.length > 0 ? filteredItems.map((item, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => openResult(item)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                      style={{ background: isActive ? 'rgba(15,23,42,0.05)' : 'transparent' }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--text-ink)' }}>{item.name}</p>
                        <p className="text-[10px] truncate" style={{ color: 'var(--text-ink-40)' }}>
                          {item.category}{item.color ? ` · ${item.color}` : ''} · {item.condition} · Stock {item.stock}
                        </p>
                        <p className="text-[10px] truncate" style={{ color: 'var(--text-ink-40)' }}>
                          {item.imei && item.imei !== '—' ? `IMEI/Serial: ${item.imei}` : `Record: ${item.id}`}
                        </p>
                      </div>
                    </button>
                  );
                }) : (
                  <div className="px-3 py-4 text-center">
                    <p className="text-[12px] font-semibold" style={{ color: 'var(--text-ink)' }}>No matching devices</p>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--text-ink-40)' }}>Try a model, color, or IMEI/serial number.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors cursor-pointer"
          style={{ color: 'var(--text-ink-40)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(15,23,42,0.06)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
        >
          <i className={isDark ? 'ri-sun-line text-base' : 'ri-moon-line text-base'} />
        </button>

        {/* Divider */}
        <div className="w-px h-6 mx-1" style={{ background: 'rgba(15,23,42,0.10)' }} />

        {/* Profile */}
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2.5 cursor-pointer transition-opacity hover:opacity-80 rounded-2xl px-2 py-1.5"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(15,23,42,0.05)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
            style={{
              background: avatarGradient,
              boxShadow: '0 2px 8px rgba(15,23,42,0.15)',
            }}
          >
            {user?.avatar ?? 'U'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-[12px] font-bold leading-tight" style={{ color: 'var(--text-ink)' }}>{user?.name ?? 'User'}</p>
            <p className="text-[10px] leading-tight mt-0.5" style={{ color: 'var(--text-ink-40)' }}>
              {user?.role ? roleLabels[user.role] : ''}
            </p>
          </div>
          <i className="ri-arrow-down-s-line text-sm hidden md:block" style={{ color: 'var(--text-ink-30)' }} />
        </button>
      </div>
    </header>
  );
}
