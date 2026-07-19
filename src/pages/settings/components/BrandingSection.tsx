interface BrandingSectionProps {
  businessName: string;
  setBusinessName: (v: string) => void;
  tagline: string;
  setTagline: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  whatsapp: string;
  setWhatsapp: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  primaryColor: string;
  setPrimaryColor: (v: string) => void;
}

export default function BrandingSection({
  businessName, setBusinessName,
  tagline, setTagline,
  phone, setPhone,
  whatsapp, setWhatsapp,
  address, setAddress,
  primaryColor, setPrimaryColor,
}: BrandingSectionProps) {
  return (
    <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-6">
      <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-5">Brand Identity</h3>
      <div className="space-y-5">
        <div>
          <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] block mb-2">Logo</label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl border border-[hsl(var(--border))] flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0A1F4A, #1E5FBE)' }}>
              <i className="ri-smartphone-line text-2xl text-white" />
            </div>
            <input type="file" accept="image/*" id="logo-upload" className="hidden" onChange={() => {}} />
            <button onClick={() => document.getElementById('logo-upload')?.click()} className="px-4 py-2 border border-[hsl(var(--border))] rounded-xl text-xs text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] cursor-pointer whitespace-nowrap">Change Logo</button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] block mb-1.5">Business Name</label>
            <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="w-full border border-[hsl(var(--border))] rounded-xl px-3 py-2.5 text-sm text-[hsl(var(--foreground))] outline-none focus:border-[#EC0118] transition-all" />
          </div>
          <div>
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] block mb-1.5">Tagline</label>
            <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} className="w-full border border-[hsl(var(--border))] rounded-xl px-3 py-2.5 text-sm text-[hsl(var(--foreground))] outline-none focus:border-[#EC0118] transition-all" />
          </div>
          <div>
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] block mb-1.5">Phone Number</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-[hsl(var(--border))] rounded-xl px-3 py-2.5 text-sm text-[hsl(var(--foreground))] outline-none focus:border-[#EC0118] transition-all" />
          </div>
          <div>
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] block mb-1.5">WhatsApp Number</label>
            <input type="text" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full border border-[hsl(var(--border))] rounded-xl px-3 py-2.5 text-sm text-[hsl(var(--foreground))] outline-none focus:border-[#EC0118] transition-all" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] block mb-1.5">Business Address</label>
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full border border-[hsl(var(--border))] rounded-xl px-3 py-2.5 text-sm text-[hsl(var(--foreground))] outline-none focus:border-[#EC0118] transition-all" />
        </div>
        <div>
          <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] block mb-2">Brand Color</label>
          <div className="flex items-center gap-3">
            <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded-xl border border-[hsl(var(--border))] cursor-pointer" />
            <div className="flex gap-2">
              {['#1E5FBE', '#0A1F4A', '#F59E0B', '#E05A2B', '#154290'].map((c) => (
                <button key={c} onClick={() => setPrimaryColor(c)} className={`w-7 h-7 rounded-full border-2 cursor-pointer transition-all ${primaryColor === c ? 'border-[hsl(var(--border))] scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
              ))}
            </div>
            <span className="text-xs text-[hsl(var(--muted-foreground))] font-mono">{primaryColor}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
