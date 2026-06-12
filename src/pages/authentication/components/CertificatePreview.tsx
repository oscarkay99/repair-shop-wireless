interface AuthCert {
  id: string;
  device: string;
  color: string;
  storage: string;
  serialNumber: string;
  condition: string;
  imei: string;
  batteryHealth: number;
  customer: string;
  purchaseDate: string;
  warrantyExpiry: string;
}

interface Props {
  cert: AuthCert;
}

export default function CertificatePreview({ cert }: Props) {
  return (
    <div className="rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(180deg, #0F172A 0%, #DC1F1F 100%)' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ background: 'rgba(220,31,31,0.2)' }}>
          <i className="ri-shield-check-line" style={{ color: '#DC1F1F' }} />
        </div>
        <div>
          <p className="text-xs font-bold text-white">Wireless</p>
          <p className="text-[10px] text-white/40">Authenticity Certificate</p>
        </div>
        <div className="ml-auto">
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
            <i className="ri-qr-code-line text-white/60 text-xl" />
          </div>
        </div>
      </div>

      <div className="bg-white/5 rounded-xl p-3 mb-3">
        <p className="text-[10px] text-white/40 mb-0.5">Device</p>
        <p className="text-sm font-bold text-white">{cert.device}</p>
        <p className="text-xs text-white/50">{cert.color} · {cert.storage}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-white/5 rounded-xl p-3">
          <p className="text-[10px] text-white/40 mb-0.5">Serial No.</p>
          <p className="text-xs font-mono font-bold text-white">{cert.serialNumber}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3">
          <p className="text-[10px] text-white/40 mb-0.5">Condition</p>
          <p className="text-xs font-bold text-amber-400">{cert.condition}</p>
        </div>
      </div>

      {cert.imei !== 'N/A' && (
        <div className="bg-white/5 rounded-xl p-3 mb-3">
          <p className="text-[10px] text-white/40 mb-0.5">IMEI 1</p>
          <p className="text-xs font-mono text-white">{cert.imei}</p>
        </div>
      )}

      {cert.batteryHealth < 100 && (
        <div className="bg-white/5 rounded-xl p-3 mb-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-white/40">Battery Health</p>
            <p className="text-xs font-bold text-amber-400">{cert.batteryHealth}%</p>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full">
            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${cert.batteryHealth}%` }} />
          </div>
        </div>
      )}

      <div className="bg-white/5 rounded-xl p-3 mb-4">
        <p className="text-[10px] text-white/40 mb-0.5">Customer</p>
        <p className="text-xs font-bold text-white">{cert.customer}</p>
        <p className="text-[10px] text-white/40 mt-1">Purchased {cert.purchaseDate}</p>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-xl border" style={{ background: 'rgba(220,31,31,0.15)', borderColor: 'rgba(220,31,31,0.3)' }}>
        <div className="w-5 h-5 flex items-center justify-center">
          <i className="ri-shield-check-fill text-sm" style={{ color: '#DC1F1F' }} />
        </div>
        <div>
          <p className="text-[10px] font-bold" style={{ color: '#DC1F1F' }}>Verified Authentic</p>
          <p className="text-[10px] text-white/40">fixhub.com/verify/{cert.id}</p>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white cursor-pointer whitespace-nowrap">
          <i className="ri-download-line mr-1" />Download PDF
        </button>
        <button className="flex-1 py-2 rounded-xl text-xs text-white cursor-pointer whitespace-nowrap hover:opacity-90" style={{ background: '#25D366' }}>
          <i className="ri-whatsapp-line mr-1" />Send via WA
        </button>
      </div>
    </div>
  );
}
