import { useState, useRef, useEffect } from 'react';
import { Calendar, X, ChevronDown } from 'lucide-react';

export interface DateRange {
  from: string;
  to: string;
}

interface Props {
  value: DateRange;
  onChange: (r: DateRange) => void;
  label?: string;
}

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function today() { return toISO(new Date()); }
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISO(d);
}
function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  return toISO(d);
}

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const PRESETS = [
  { label: 'Today',       range: () => ({ from: today(),         to: today() }) },
  { label: 'Yesterday',   range: () => ({ from: daysAgo(1),      to: daysAgo(1) }) },
  { label: 'Last 7 days', range: () => ({ from: daysAgo(6),      to: today() }) },
  { label: 'This month',  range: () => ({ from: startOfMonth(),  to: today() }) },
];

function matchPreset(value: DateRange): string | null {
  const t = today();
  const y = daysAgo(1);
  const w = daysAgo(6);
  const m = startOfMonth();
  if (value.from === t && value.to === t)    return 'Today';
  if (value.from === y && value.to === y)    return 'Yesterday';
  if (value.from === w && value.to === t)    return 'Last 7 days';
  if (value.from === m && value.to === t)    return 'This month';
  return null;
}

export default function DateRangePicker({ value, onChange, label = 'Date range' }: Props) {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const hasRange = !!(value.from || value.to);
  const activePreset = hasRange ? matchPreset(value) : null;
  const isCustom = hasRange && !activePreset;

  const displayLabel = !hasRange
    ? label
    : activePreset
      ? activePreset
      : [value.from ? fmtDate(value.from) : '…', value.to ? fmtDate(value.to) : '…'].join(' – ');

  const applyPreset = (range: DateRange) => {
    onChange(range);
    setShowCustom(false);
    setOpen(false);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ from: '', to: '' });
    setShowCustom(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 h-8 px-3 rounded-full text-xs font-semibold transition-colors"
        style={{
          border: '1px solid hsl(var(--border))',
          background: hasRange ? 'hsl(var(--foreground))' : 'transparent',
          color: hasRange ? 'hsl(var(--background))' : 'hsl(var(--muted-foreground))',
        }}
      >
        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="whitespace-nowrap">{displayLabel}</span>
        {hasRange ? (
          <span onClick={clear} className="ml-0.5 w-4 h-4 flex items-center justify-center rounded-full hover:opacity-70">
            <X className="w-3 h-3" />
          </span>
        ) : (
          <ChevronDown className="w-3.5 h-3.5 opacity-50" />
        )}
      </button>

      {open && (
        <div
          className="absolute top-full mt-2 left-0 z-50 rounded-xl py-2"
          style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
            minWidth: 200,
          }}
        >
          {/* Preset buttons */}
          {PRESETS.map(p => {
            const isActive = activePreset === p.label;
            return (
              <button
                key={p.label}
                onClick={() => applyPreset(p.range())}
                className={`w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-left transition-colors ${isActive ? 'bg-brand-50 text-brand-600' : ''}`}
                style={!isActive ? { color: 'hsl(var(--foreground))' } : undefined}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                {p.label}
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />}
              </button>
            );
          })}

          {/* Divider */}
          <div className="mx-3 my-1.5 border-t" style={{ borderColor: 'hsl(var(--border))' }} />

          {/* Custom toggle */}
          <button
            onClick={() => setShowCustom(s => !s)}
            className={`w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-left transition-colors ${isCustom || showCustom ? 'bg-brand-50 text-brand-600' : ''}`}
            style={!(isCustom || showCustom) ? { color: 'hsl(var(--foreground))' } : undefined}
            onMouseEnter={e => { if (!isCustom && !showCustom) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
            onMouseLeave={e => { if (!isCustom && !showCustom) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            Custom range
            <ChevronDown
              className="w-3.5 h-3.5 transition-transform"
              style={{ transform: showCustom ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>

          {/* Custom date inputs */}
          {showCustom && (
            <div className="px-3 pb-3 pt-1 space-y-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wide block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>From</label>
                <input
                  type="date"
                  value={value.from}
                  max={value.to || undefined}
                  onChange={e => onChange({ ...value, from: e.target.value })}
                  className="w-full h-8 px-2 rounded-lg text-xs outline-none"
                  style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wide block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>To</label>
                <input
                  type="date"
                  value={value.to}
                  min={value.from || undefined}
                  onChange={e => onChange({ ...value, to: e.target.value })}
                  className="w-full h-8 px-2 rounded-lg text-xs outline-none"
                  style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                />
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-full h-7 rounded-lg text-xs font-semibold text-white mt-1 bg-brand-500 hover:bg-brand-600 transition-colors cursor-pointer"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
