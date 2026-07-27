interface LogoSlotProps {
  id: string;
  label: string;
  hint: string;
  previewBg: string;
  logoUrl?: string | null;
  uploading: boolean;
  onChange: (file: File) => void;
}

// The image itself is never distorted here or in generated PDFs — both use
// object-fit: contain / an aspect-ratio-preserving fit, so whatever size and
// shape logo an admin uploads renders the same way it looked on disk.
function LogoSlot({ id, label, hint, previewBg, logoUrl, uploading, onChange }: LogoSlotProps) {
  return (
    <div>
      <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] block mb-2">{label}</label>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl border border-[hsl(var(--border))] flex items-center justify-center overflow-hidden" style={logoUrl ? { background: previewBg } : { background: 'linear-gradient(135deg, #0A1F4A, #1E5FBE)' }}>
          {logoUrl
            ? <img src={logoUrl} alt={label} className="w-full h-full object-contain p-1" />
            : <i className="ri-smartphone-line text-2xl text-white" />}
        </div>
        <div>
          <input
            type="file"
            accept="image/*"
            id={id}
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) onChange(f); e.target.value = ''; }}
          />
          <button
            onClick={() => document.getElementById(id)?.click()}
            disabled={uploading}
            className="px-4 py-2 border border-[hsl(var(--border))] rounded-xl text-xs text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : logoUrl ? 'Change Logo' : 'Upload Logo'}
          </button>
          <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1.5 max-w-[220px]">{hint}</p>
        </div>
      </div>
    </div>
  );
}

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
  logoUrl?: string | null;
  onLogoChange: (file: File) => void;
  logoUploading: boolean;
  logoUrlDark?: string | null;
  onLogoDarkChange: (file: File) => void;
  logoDarkUploading: boolean;
}

export default function BrandingSection({
  businessName, setBusinessName,
  tagline, setTagline,
  phone, setPhone,
  whatsapp, setWhatsapp,
  address, setAddress,
  primaryColor, setPrimaryColor,
  logoUrl, onLogoChange, logoUploading,
  logoUrlDark, onLogoDarkChange, logoDarkUploading,
}: BrandingSectionProps) {
  return (
    <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-6">
      <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-5">Brand Identity</h3>
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <LogoSlot
            id="logo-upload-light"
            label="Logo"
            hint="Used on invoices/receipts and the light-theme sidebar."
            previewBg="#f4f4f5"
            logoUrl={logoUrl}
            uploading={logoUploading}
            onChange={onLogoChange}
          />
          <LogoSlot
            id="logo-upload-dark"
            label="Logo (Dark Mode)"
            hint="Shown in the sidebar when dark mode is on. Falls back to the logo above if not set."
            previewBg="#18181b"
            logoUrl={logoUrlDark}
            uploading={logoDarkUploading}
            onChange={onLogoDarkChange}
          />
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
