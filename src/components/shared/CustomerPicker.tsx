import { useState, useRef, useEffect } from 'react';
import { useWirelessCustomers } from '@/hooks/useWirelessCustomers';
import type { WCustomer } from '@/types/wireless';

interface Props {
  value: string;
  phone?: string;
  onChange: (name: string, phone: string, customer?: WCustomer | null) => void;
  required?: boolean;
  label?: string;
  placeholder?: string;
  theme?: 'dark' | 'light';
  /** Typing a brand-new name is the expected outcome here, not an error — the
   *  caller creates the customer itself when the form is submitted. The
   *  dropdown still searches, so an already-registered walk-in gets linked
   *  instead of duplicated, but nothing gets cleared or created inline. */
  createMode?: boolean;
}

export default function CustomerPicker({
  value,
  phone = '',
  onChange,
  required,
  label = 'Customer',
  placeholder = 'Search by name or phone…',
  theme = 'dark',
  createMode = false,
}: Props) {
  const { customers, add } = useWirelessCustomers();
  const [open, setOpen] = useState(false);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const q = value.trim().toLowerCase();
  const matches = q.length >= 1
    ? customers.filter(c =>
        c.name.toLowerCase().includes(q) || c.phone.includes(q)
      ).slice(0, 6)
    : [];

  // A typed name that never got linked to a real customer (picked or created)
  // gets cleared on blur — you can't leave a customer's name floating around
  // without a real customer record behind it. `dirty` only becomes true once
  // the user actually types here, so pre-filled values (editing an existing
  // ticket/sale) are left alone.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        if (!createMode && dirty && !pickedId && value.trim()) onChange('', phone, null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [createMode, dirty, pickedId, value, phone, onChange]);

  const pick = (c: WCustomer) => {
    setPickedId(c.id);
    setDirty(false);
    onChange(c.name, c.phone, c);
    setOpen(false);
  };

  const clear = () => {
    setPickedId(null);
    setDirty(false);
    onChange('', '', null);
  };

  const createNew = async () => {
    const name = value.trim();
    if (!name || !phone.trim() || creating) return;
    setCreating(true);
    try {
      const c = await add({ name, phone: phone.trim(), email: '', address: '' });
      pick(c);
    } finally {
      setCreating(false);
    }
  };

  const isDark = theme === 'dark';
  const inputCls = isDark
    ? 'w-full text-sm rounded-xl px-3 py-2 outline-none pr-8'
    : 'w-full px-4 py-2.5 rounded-xl text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--border))] pr-8';
  const inputStyle = isDark
    ? { border: '1px solid hsl(var(--border))', background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }
    : { background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' };

  const labelCls = isDark
    ? 'text-[10px] font-bold uppercase tracking-wider mb-1 block'
    : 'text-xs text-[hsl(var(--muted-foreground))] mb-1 block';
  const labelStyle = isDark ? { color: 'hsl(var(--muted-foreground))' } : undefined;

  return (
    <div ref={ref} className="relative">
      {label && (
        <label className={labelCls} style={labelStyle}>
          {label}{required ? ' *' : ''}
        </label>
      )}
      <div className="relative">
        <input
          required={required}
          value={value}
          onChange={e => {
            setPickedId(null);
            setDirty(true);
            onChange(e.target.value, phone, null);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className={inputCls}
          style={inputStyle}
          placeholder={placeholder}
          autoComplete="off"
        />
        {pickedId ? (
          <button
            type="button"
            onClick={clear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--muted-foreground))]"
          >
            <i className="ri-close-line text-sm" />
          </button>
        ) : (
          <i className="ri-user-search-line absolute right-2.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] text-sm pointer-events-none" />
        )}
      </div>

      {pickedId && (
        <p className="text-[10px] text-emerald-600 mt-0.5 flex items-center gap-1">
          <i className="ri-checkbox-circle-fill" /> Existing customer
        </p>
      )}

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-[hsl(var(--card))] rounded-xl shadow-xl border border-[hsl(var(--border))] z-[200] overflow-hidden">
          {matches.length > 0 ? (
            matches.map(c => (
              <button
                key={c.id}
                type="button"
                onMouseDown={() => pick(c)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[hsl(var(--muted))] text-left transition-colors"
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 bg-emerald-500">
                  {c.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[hsl(var(--foreground))]">{c.name}</p>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{c.phone}</p>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] flex-shrink-0">
                  {c.ticket_count} ticket{c.ticket_count !== 1 ? 's' : ''}
                </span>
              </button>
            ))
          ) : q.length >= 1 ? (
            createMode ? (
              <div className="px-3 py-3 text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-2">
                <i className="ri-user-add-line" />
                New customer — created when you save this ticket.
              </div>
            ) : phone.trim() ? (
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); createNew(); }}
                disabled={creating}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs font-medium hover:bg-[hsl(var(--muted))] transition-colors disabled:opacity-60"
                style={{ color: 'hsl(var(--primary))' }}
              >
                <i className="ri-user-add-line" />
                {creating ? 'Creating…' : `Create "${value.trim()}" as new customer`}
              </button>
            ) : (
              <div className="px-3 py-3 text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-2">
                <i className="ri-information-line" />
                Enter a phone number to create this customer
              </div>
            )
          ) : null}
        </div>
      )}
    </div>
  );
}
