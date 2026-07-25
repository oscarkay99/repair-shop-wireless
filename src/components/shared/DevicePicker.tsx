import { useState, useRef, useEffect } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
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
    ? suggestions.filter(d => d.toLowerCase().includes(q)).slice(0, 6)
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
      <input
        required={required}
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        className="w-full text-sm rounded-xl px-3 py-2 outline-none"
        style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && matches.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-[200]"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
          {matches.map(d => (
            <button
              key={d}
              type="button"
              onMouseDown={e => { e.preventDefault(); onChange(d); setOpen(false); }}
              className="w-full text-left px-3 py-2.5 text-xs font-medium transition-colors"
              style={{ color: 'hsl(var(--foreground))' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
            >
              {d}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
