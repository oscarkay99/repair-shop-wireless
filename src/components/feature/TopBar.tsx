import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Bell, Plus } from 'lucide-react';

interface TopBarProps {
  title?: string;
  subtitle?: string;
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

export default function TopBar({ title = 'Dashboard', subtitle }: TopBarProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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

  const displaySubtitle = subtitle ?? `${getGreeting()} · ${getFormattedDate()}`;

  return (
    <header
      className="h-14 flex items-center justify-between px-6 flex-shrink-0 border-b"
      style={{
        background: 'hsl(var(--card))',
        borderColor: 'hsl(var(--border))',
      }}
    >
      {/* Left: page title */}
      <div>
        <h1
          className="text-sm font-bold tracking-wide uppercase"
          style={{ color: 'hsl(var(--foreground))' }}
        >
          {title}
        </h1>
        <p
          className="text-[11px] mt-0.5"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          {displaySubtitle}
        </p>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        {/* New Ticket button */}
        <Link to="/tickets/new">
          <button
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'hsl(var(--primary))' }}
          >
            <Plus className="w-3.5 h-3.5" />
            New Ticket
          </button>
        </Link>

        {/* Search */}
        <div className="relative hidden md:block">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search... ⌘K"
            className="h-8 pl-8 pr-3 w-48 rounded-lg text-xs outline-none transition-[width] duration-200 focus:w-64"
            style={{
              background: 'hsl(var(--muted))',
              border: '1px solid hsl(var(--border))',
              color: 'hsl(var(--foreground))',
            }}
          />
        </div>

        {/* Bell */}
        <button
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
          style={{ color: 'hsl(var(--muted-foreground))' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = '';
          }}
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
