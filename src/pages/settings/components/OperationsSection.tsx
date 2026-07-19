import { useTaxSettings } from '@/hooks/useTaxSettings';

export default function OperationsSection() {
  const { taxEnabled, vatRate, save } = useTaxSettings();

  return (
    <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-6">
      <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-5">Operational Settings</h3>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Default Warranty (New)', type: 'select', options: ['12 Months', '6 Months', '3 Months'], default: '12 Months' },
            { label: 'Default Warranty (Used)', type: 'select', options: ['3 Months', '6 Months', '1 Month'], default: '3 Months' },
            { label: 'Quote Validity (Days)', type: 'number', default: 7 },
            { label: 'Low Stock Threshold', type: 'number', default: 2 },
            { label: 'Repair Turnaround Target', type: 'select', options: ['Same Day', '24 Hours', '48 Hours', '3 Days'], default: '48 Hours' },
            { label: 'Default Delivery Fee (GHS)', type: 'number', default: 50 },
          ].map((field) => (
            <div key={field.label}>
              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] block mb-1.5">{field.label}</label>
              {field.type === 'select' ? (
                <select className="w-full border border-[hsl(var(--border))] rounded-xl px-3 py-2.5 text-sm text-[hsl(var(--foreground))] outline-none focus:border-[#EC0118]">
                  {field.options?.map(o => <option key={o}>{o}</option>)}
                </select>
              ) : (
                <input type="number" defaultValue={field.default as number} className="w-full border border-[hsl(var(--border))] rounded-xl px-3 py-2.5 text-sm text-[hsl(var(--foreground))] outline-none focus:border-[#EC0118]" />
              )}
            </div>
          ))}
        </div>
        <div>
          <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] block mb-2">Business Hours</label>
          <div className="space-y-2">
            {[{ day: 'Mon–Fri', hours: '8:00 AM – 8:00 PM' }, { day: 'Saturday', hours: '9:00 AM – 7:00 PM' }, { day: 'Sunday', hours: '10:00 AM – 6:00 PM' }].map((row) => (
              <div key={row.day} className="flex items-center gap-3">
                <span className="text-xs text-[hsl(var(--muted-foreground))] w-20">{row.day}</span>
                <input type="text" defaultValue={row.hours} className="flex-1 border border-[hsl(var(--border))] rounded-xl px-3 py-2 text-sm text-[hsl(var(--foreground))] outline-none focus:border-[#EC0118]" />
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Currency & Tax</label>
            <button
              type="button"
              onClick={() => save({ taxEnabled: !taxEnabled })}
              className="relative w-9 h-5 rounded-full transition-colors shrink-0"
              style={{ background: taxEnabled ? '#EC0118' : 'hsl(var(--border))' }}
              title={taxEnabled ? 'Tax is applied on Invoices and Sales checkout' : 'Tax is disabled everywhere'}
            >
              <span className="text-[9px] font-semibold text-[hsl(var(--muted-foreground))] absolute -top-4 right-0 whitespace-nowrap">
                {taxEnabled ? 'Tax Enabled' : 'Tax Disabled'}
              </span>
              <span
                className="absolute top-0.5 w-4 h-4 rounded-full bg-[hsl(var(--card))] transition-transform"
                style={{ transform: taxEnabled ? 'translateX(18px)' : 'translateX(2px)' }}
              />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-[hsl(var(--muted-foreground))] block mb-1">Currency</label>
              <select className="w-full border border-[hsl(var(--border))] rounded-xl px-3 py-2.5 text-sm text-[hsl(var(--foreground))] outline-none focus:border-[#EC0118]">
                <option>GHS — Ghana Cedi</option>
                <option>USD — US Dollar</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[hsl(var(--muted-foreground))] block mb-1">VAT Rate (%)</label>
              <input
                type="number"
                value={vatRate}
                disabled={!taxEnabled}
                onChange={e => save({ vatRate: parseFloat(e.target.value) || 0 })}
                className="w-full border border-[hsl(var(--border))] rounded-xl px-3 py-2.5 text-sm text-[hsl(var(--foreground))] outline-none focus:border-[#EC0118] disabled:opacity-50 disabled:bg-[hsl(var(--muted))]"
              />
            </div>
            <div>
              <label className="text-[10px] text-[hsl(var(--muted-foreground))] block mb-1">NHIL + GETFund (%)</label>
              <input type="number" defaultValue={5} disabled className="w-full border border-[hsl(var(--border))] rounded-xl px-3 py-2.5 text-sm text-[hsl(var(--muted-foreground))] outline-none bg-[hsl(var(--muted))]" />
            </div>
          </div>
          <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-2">
            When disabled, no tax is calculated or shown on Invoices or the Sales checkout.
          </p>
        </div>
      </div>
    </div>
  );
}
