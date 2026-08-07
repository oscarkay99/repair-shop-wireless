const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function daysInMonth(month?: number): number {
  if (!month) return 31;
  return new Date(2000, month, 0).getDate(); // 2000 is a leap year, so Feb gets all 29
}

interface Props {
  month?: number;
  day?: number;
  onChange: (month: number | undefined, day: number | undefined) => void;
  required?: boolean;
  label?: string;
}

/** Month + day only, deliberately no year field — this is for greeting
 *  customers on their birthday, not recording a date of birth or age. */
export default function BirthdayInput({ month, day, onChange, required, label = 'Birthday' }: Props) {
  const maxDay = daysInMonth(month);
  const dayValue = day && day > maxDay ? maxDay : day;

  return (
    <div>
      <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
        {label}{required ? ' *' : ''}
      </label>
      <div className="flex gap-2">
        <select
          required={required}
          value={month ?? ''}
          onChange={e => onChange(e.target.value ? Number(e.target.value) : undefined, dayValue)}
          className="flex-1 h-9 px-3 rounded-lg text-sm outline-none"
          style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
        >
          <option value="">Month</option>
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select
          required={required}
          value={dayValue ?? ''}
          onChange={e => onChange(month, e.target.value ? Number(e.target.value) : undefined)}
          className="w-24 h-9 px-3 rounded-lg text-sm outline-none"
          style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
        >
          <option value="">Day</option>
          {Array.from({ length: maxDay }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
    </div>
  );
}
