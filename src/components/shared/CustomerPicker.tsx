import { useState, useRef, useEffect } from 'react';
import { useCustomers } from '@/hooks/useCustomers';
import type { Customer } from '@/types/customer';

interface Props {
  value: string;
  phone?: string;
  onChange: (name: string, phone: string, customer?: Customer | null) => void;
  required?: boolean;
  label?: string;
  placeholder?: string;
  theme?: 'dark' | 'light';
}

const segmentColor: Record<string, string> = {
  VIP: 'bg-amber-500',
  Repeat: 'bg-cyan-500',
  New: 'bg-emerald-500',
  'At-Risk': 'bg-red-500',
};

export default function CustomerPicker({
  value,
  phone = '',
  onChange,
  required,
  label = 'Customer',
  placeholder = 'Search by name or phone…',
  theme = 'dark',
}: Props) {
  const { customers } = useCustomers();
  const [open, setOpen] = useState(false);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const q = value.trim().toLowerCase();
  const matches = q.length >= 1
    ? customers.filter(c =>
        c.name.toLowerCase().includes(q) || c.phone.includes(q)
      ).slice(0, 6)
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pick = (c: Customer) => {
    setPickedId(c.id);
    onChange(c.name, c.phone, c);
    setOpen(false);
  };

  const clear = () => {
    setPickedId(null);
    onChange('', '', null);
  };

  const isDark = theme === 'dark';
  const inputCls = isDark
    ? 'w-full text-sm rounded-xl px-3 py-2 outline-none pr-8'
    : 'w-full px-4 py-2.5 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 pr-8';
  const inputStyle = isDark
    ? { border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }
    : { background: '#f8fafc', border: '1px solid #e2e8f0' };

  const labelCls = isDark
    ? 'text-[10px] font-bold uppercase tracking-wider mb-1 block'
    : 'text-xs text-slate-500 mb-1 block';
  const labelStyle = isDark ? { color: 'rgba(7,16,31,0.4)' } : undefined;

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
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <i className="ri-close-line text-sm" />
          </button>
        ) : (
          <i className="ri-user-search-line absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
        )}
      </div>

      {pickedId && (
        <p className="text-[10px] text-emerald-600 mt-0.5 flex items-center gap-1">
          <i className="ri-checkbox-circle-fill" /> Existing customer
        </p>
      )}

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-100 z-[200] overflow-hidden">
          {matches.length > 0 ? (
            matches.map(c => (
              <button
                key={c.id}
                type="button"
                onMouseDown={() => pick(c)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 text-left transition-colors"
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${segmentColor[c.segment] ?? 'bg-emerald-500'}`}>
                  {c.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800">{c.name}</p>
                  <p className="text-[10px] text-slate-400">{c.phone}</p>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 flex-shrink-0">
                  {c.segment}
                </span>
              </button>
            ))
          ) : q.length >= 1 ? (
            <div className="px-3 py-3 text-xs text-slate-400 flex items-center gap-2">
              <i className="ri-user-add-line" />
              No match — will save as new contact
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
