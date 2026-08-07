import { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

export interface SearchItem {
  id: string;
  primary: string;
  secondary?: string;
  meta?: string;
  badge?: { label: string; bg: string; color: string };
}

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  suggestions: SearchItem[];
  onSelect: (item: SearchItem) => void;
  placeholder?: string;
  width?: number | string;
  maxResults?: number;
  inputRef?: React.Ref<HTMLInputElement>;
  onEnter?: () => void;
}

export default function SearchDropdown({
  query,
  onQueryChange,
  suggestions,
  onSelect,
  placeholder = 'Search…',
  width = 240,
  maxResults = 7,
  inputRef,
  onEnter,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const open = query.trim().length > 0 && suggestions.length > 0;
  const visible = suggestions.slice(0, maxResults);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        // do nothing — query stays, dropdown just closes via `open` condition
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onQueryChange('');
    if (e.key === 'Enter') {
      if (visible.length > 0) onSelect(visible[0]);
      onEnter?.();
    }
  };

  return (
    <div ref={containerRef} className="relative" style={{ width }}>
      {/* Input */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          className="h-9 w-full pl-9 pr-8 rounded-xl text-xs outline-none"
          style={{
            background: 'hsl(var(--card))',
            border: `1px solid ${open ? 'hsl(var(--primary) / 0.5)' : 'hsl(var(--border))'}`,
            color: 'hsl(var(--foreground))',
            borderBottomLeftRadius: open ? 0 : undefined,
            borderBottomRightRadius: open ? 0 : undefined,
          }}
        />
        {query && (
          <button
            onClick={() => onQueryChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full"
            style={{ background: 'hsl(var(--muted))' }}
          >
            <X className="w-2.5 h-2.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 left-0 right-0 overflow-hidden"
          style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--primary) / 0.5)',
            borderTop: 'none',
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          }}
        >
          {visible.map((item, i) => (
            <button
              key={item.id}
              onMouseDown={e => { e.preventDefault(); onSelect(item); }}
              className="w-full text-left flex items-center justify-between gap-3 px-3 py-2.5 transition-colors"
              style={{
                borderTop: i > 0 ? '1px solid hsl(var(--border))' : 'none',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>
                  {item.primary}
                </p>
                {item.secondary && (
                  <p className="text-[10px] truncate mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {item.secondary}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {item.meta && (
                  <span className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{item.meta}</span>
                )}
                {item.badge && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                    style={{ background: item.badge.bg, color: item.badge.color }}
                  >
                    {item.badge.label}
                  </span>
                )}
              </div>
            </button>
          ))}
          {suggestions.length > maxResults && (
            <div className="px-3 py-2 text-[10px]" style={{ color: 'hsl(var(--muted-foreground))', borderTop: '1px solid hsl(var(--border))' }}>
              {suggestions.length - maxResults} more result{suggestions.length - maxResults !== 1 ? 's' : ''}, keep typing to narrow down
            </div>
          )}
        </div>
      )}
    </div>
  );
}
