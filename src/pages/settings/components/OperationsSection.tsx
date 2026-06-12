export default function OperationsSection() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <h3 className="text-sm font-bold text-slate-800 mb-5">Operational Settings</h3>
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
              <label className="text-xs font-medium text-slate-600 block mb-1.5">{field.label}</label>
              {field.type === 'select' ? (
                <select className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#DC1F1F]">
                  {field.options?.map(o => <option key={o}>{o}</option>)}
                </select>
              ) : (
                <input type="number" defaultValue={field.default as number} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#DC1F1F]" />
              )}
            </div>
          ))}
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-2">Business Hours</label>
          <div className="space-y-2">
            {[{ day: 'Mon–Fri', hours: '8:00 AM – 8:00 PM' }, { day: 'Saturday', hours: '9:00 AM – 7:00 PM' }, { day: 'Sunday', hours: '10:00 AM – 6:00 PM' }].map((row) => (
              <div key={row.day} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-20">{row.day}</span>
                <input type="text" defaultValue={row.hours} className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#DC1F1F]" />
              </div>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-2">Currency & Tax</label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Currency</label>
              <select className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#DC1F1F]">
                <option>GHS — Ghana Cedi</option>
                <option>USD — US Dollar</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">VAT Rate (%)</label>
              <input type="number" defaultValue={15} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#DC1F1F]" />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">NHIL Rate (%)</label>
              <input type="number" defaultValue={2.5} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#DC1F1F]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
