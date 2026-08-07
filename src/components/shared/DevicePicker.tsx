import { useState, useRef, useEffect } from 'react';

export interface DeviceSuggestion {
  name: string;
  /** Selling price of the matching inventory entry, when there is one — shown
   *  in the row so it's obvious that picking this device sets the quote. */
  price?: number;
  /** Set only when another inventory entry shares this exact name at a
   *  different price (e.g. an OEM vs. compatible screen both just called
   *  "iPhone 13 Screen") — shown so the two rows are told apart by more than
   *  price alone, since picking the wrong one silently would defeat the
   *  point of listing both. */
  sku?: string;
}

interface Props {
  value: string;
  onChange: (value: string, price?: number) => void;
  suggestions: DeviceSuggestion[];
  required?: boolean;
  label?: string;
  placeholder?: string;
}

/** Same search-then-pick UX as CustomerPicker, but simpler — a device name
 *  isn't a real linked record, just free text, so there's no "create new"
 *  step: typing something not in `suggestions` is always valid as-is. */
export default function DevicePicker({
  value,
  onChange,
  suggestions,
  required,
  label = 'Device',
  placeholder = 'e.g. Galaxy S24, MacBook Air…',
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const q = value.trim().toLowerCase();
  const matches = q.length >= 1
    ? suggestions.filter(d => d.name.toLowerCase().includes(q)).slice(0, 6)
    : suggestions.slice(0, 6);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {label && (
        <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {label}{required ? ' *' : ''}
        </label>
      )}
      <div className="relative">
        <input
          required={required}
          value={value}
          onChange={e => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="w-full text-sm rounded-xl px-3 py-2 outline-none pr-8"
          style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
          placeholder={placeholder}
          autoComplete="off"
        />
        <i className="ri-search-line absolute right-2.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] text-sm pointer-events-none" />
      </div>
      {/* Rendered whenever the field is focused, even with nothing to show —
          silently collapsing to nothing reads as "there is no dropdown here",
          when the real answer is that inventory has no such device yet. */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-[200]"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
          {matches.length > 0 ? matches.map(d => (
            <button
              key={d.name}
              type="button"
              onMouseDown={e => { e.preventDefault(); onChange(d.name, d.price); setOpen(false); }}
              className="w-full text-left px-3 py-2.5 text-xs font-medium transition-colors flex items-center justify-between gap-2"
              style={{ color: 'hsl(var(--foreground))' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
            >
              <span className="truncate">{d.name}{d.sku && <span className="opacity-60"> · {d.sku}</span>}</span>
              {d.price !== undefined && (
                <span className="flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }}>GHS {d.price}</span>
              )}
            </button>
          )) : (
            <div className="px-3 py-2.5 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {suggestions.length === 0
                ? 'No devices in inventory yet. Type the device name.'
                : 'Not in inventory. Saved as typed, quote it manually.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
