export default function GenerateCertificate() {
  return (
    <div className="max-w-2xl">
      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-6">
        <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-4">Generate Authenticity Certificate</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1 block">Device Name</label>
              <input className="w-full border border-[hsl(var(--border))] rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-400" placeholder="e.g. iPhone 15 Pro Max" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1 block">Storage / Variant</label>
              <input className="w-full border border-[hsl(var(--border))] rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-400" placeholder="e.g. 256GB Natural Titanium" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1 block">IMEI 1</label>
              <input className="w-full border border-[hsl(var(--border))] rounded-xl px-3 py-2 text-sm font-mono outline-none focus:border-emerald-400" placeholder="15-digit IMEI" maxLength={15} />
            </div>
            <div>
              <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1 block">Serial Number</label>
              <input className="w-full border border-[hsl(var(--border))] rounded-xl px-3 py-2 text-sm font-mono outline-none focus:border-emerald-400" placeholder="Serial number" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1 block">Condition</label>
              <select className="w-full border border-[hsl(var(--border))] rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-400">
                <option>New</option>
                <option>Refurbished</option>
                <option>Used - Excellent</option>
                <option>Used - Good</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1 block">Battery Health (%)</label>
              <input type="number" min={0} max={100} className="w-full border border-[hsl(var(--border))] rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-400" placeholder="100" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1 block">Customer Name</label>
            <input className="w-full border border-[hsl(var(--border))] rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-400" placeholder="Customer full name" />
          </div>
          <div className="flex gap-3 pt-2">
            <button className="flex-1 py-3 rounded-xl border border-[hsl(var(--border))] text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] cursor-pointer whitespace-nowrap">
              <i className="ri-eye-line mr-1" />Preview
            </button>
            <button className="flex-1 py-3 rounded-xl text-white text-sm font-semibold cursor-pointer whitespace-nowrap hover:opacity-90" style={{ background: '#EC0118' }}>
              <i className="ri-shield-check-line mr-1" />Generate Certificate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
