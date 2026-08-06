import { useTaxSettings } from '@/hooks/useTaxSettings';

interface OperationsSectionProps {
  warrantyNewLabel: string; setWarrantyNewLabel: (v: string) => void;
  warrantyUsedLabel: string; setWarrantyUsedLabel: (v: string) => void;
  quoteValidityDays: string; setQuoteValidityDays: (v: string) => void;
  repairTurnaroundTarget: string; setRepairTurnaroundTarget: (v: string) => void;
  defaultDeliveryFee: string; setDefaultDeliveryFee: (v: string) => void;
  businessHoursMonFri: string; setBusinessHoursMonFri: (v: string) => void;
  businessHoursSaturday: string; setBusinessHoursSaturday: (v: string) => void;
  businessHoursSunday: string; setBusinessHoursSunday: (v: string) => void;
  currency: string; setCurrency: (v: string) => void;
  termsAndConditions: string; setTermsAndConditions: (v: string) => void;
}

const selectCls = 'w-full border border-[hsl(var(--border))] rounded-xl px-3 py-2.5 text-sm text-[hsl(var(--foreground))] outline-none focus:border-[#EC0118]';
const inputCls = selectCls;

export default function OperationsSection({
  warrantyNewLabel, setWarrantyNewLabel,
  warrantyUsedLabel, setWarrantyUsedLabel,
  quoteValidityDays, setQuoteValidityDays,
  repairTurnaroundTarget, setRepairTurnaroundTarget,
  defaultDeliveryFee, setDefaultDeliveryFee,
  businessHoursMonFri, setBusinessHoursMonFri,
  businessHoursSaturday, setBusinessHoursSaturday,
  businessHoursSunday, setBusinessHoursSunday,
  currency, setCurrency,
  termsAndConditions, setTermsAndConditions,
}: OperationsSectionProps) {
  const { taxEnabled, vatRate, nhilGetfundRate, save } = useTaxSettings();

  const businessHours = [
    { day: 'Mon–Fri', value: businessHoursMonFri, set: setBusinessHoursMonFri },
    { day: 'Saturday', value: businessHoursSaturday, set: setBusinessHoursSaturday },
    { day: 'Sunday', value: businessHoursSunday, set: setBusinessHoursSunday },
  ];

  return (
    <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-6">
      <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-5">Operational Settings</h3>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] block mb-1.5">Default Warranty (New)</label>
            <select value={warrantyNewLabel} onChange={e => setWarrantyNewLabel(e.target.value)} className={selectCls}>
              {['12 Months', '6 Months', '3 Months'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] block mb-1.5">Default Warranty (Used)</label>
            <select value={warrantyUsedLabel} onChange={e => setWarrantyUsedLabel(e.target.value)} className={selectCls}>
              {['3 Months', '6 Months', '1 Month'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] block mb-1.5">Quote Validity (Days)</label>
            <input type="number" min="1" value={quoteValidityDays} onChange={e => setQuoteValidityDays(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] block mb-1.5">Repair Turnaround Target</label>
            <select value={repairTurnaroundTarget} onChange={e => setRepairTurnaroundTarget(e.target.value)} className={selectCls}>
              {['Same Day', '24 Hours', '48 Hours', '3 Days'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] block mb-1.5">Default Delivery Fee (GHS)</label>
            <input type="number" min="0" step="0.01" value={defaultDeliveryFee} onChange={e => setDefaultDeliveryFee(e.target.value)} className={inputCls} />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] block mb-2">Business Hours</label>
          <div className="space-y-2">
            {businessHours.map(row => (
              <div key={row.day} className="flex items-center gap-3">
                <span className="text-xs text-[hsl(var(--muted-foreground))] w-20">{row.day}</span>
                <input type="text" value={row.value} onChange={e => row.set(e.target.value)}
                  className="flex-1 border border-[hsl(var(--border))] rounded-xl px-3 py-2 text-sm text-[hsl(var(--foreground))] outline-none focus:border-[#EC0118]" />
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
              <select value={currency} onChange={e => setCurrency(e.target.value)} className={selectCls}>
                <option value="GHS">GHS — Ghana Cedi</option>
                <option value="USD">USD — US Dollar</option>
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
              <input
                type="number"
                value={nhilGetfundRate}
                disabled={!taxEnabled}
                onChange={e => save({ nhilGetfundRate: parseFloat(e.target.value) || 0 })}
                className="w-full border border-[hsl(var(--border))] rounded-xl px-3 py-2.5 text-sm text-[hsl(var(--foreground))] outline-none focus:border-[#EC0118] disabled:opacity-50 disabled:bg-[hsl(var(--muted))]"
              />
            </div>
          </div>
          <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-2">
            When disabled, no tax is calculated or shown on Invoices or the Sales checkout. VAT/Levy save immediately;
            everything else on this page saves with the button below.
          </p>
        </div>
        <div>
          <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] block mb-1.5">Repair Service Terms</label>
          <textarea
            rows={8}
            value={termsAndConditions}
            onChange={e => setTermsAndConditions(e.target.value)}
            className="w-full border border-[hsl(var(--border))] rounded-xl px-3 py-2.5 text-sm text-[hsl(var(--foreground))] outline-none focus:border-[#EC0118] font-mono"
          />
          <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1.5">
            Shown on the customer portal's Repair Service Terms page, linked from every invoice and pickup receipt.
            Start a line with <code>## </code> to make it a section heading; separate paragraphs with a blank line.
          </p>
        </div>
      </div>
    </div>
  );
}
