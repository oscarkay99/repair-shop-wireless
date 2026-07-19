import { useState } from 'react';
import AdminLayout from '@/components/feature/AdminLayout';
import { authCertificates, imeiCheckHistory } from '@/mocks/authentication';
import ImeiChecker from './components/ImeiChecker';
import GenerateCertificate from './components/GenerateCertificate';
import CertificatePreview from './components/CertificatePreview';

type Tab = 'certificates' | 'imei' | 'generate';

export default function AuthenticationPage() {
  const [tab, setTab] = useState<Tab>('certificates');
  const [selectedCert, setSelectedCert] = useState(authCertificates[0] ?? null);
  const [certDetailOpen, setCertDetailOpen] = useState(false);

  return (
    <AdminLayout title="Gadget Authentication" subtitle="Digital certificates, IMEI verification & trust system">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Certificates Issued', value: '0', icon: 'ri-shield-check-line', iconColor: '#EC0118', bg: 'rgba(236,1,24,0.08)' },
          { label: 'IMEI Checks Today', value: '0', icon: 'ri-scan-line', iconColor: '#06B6D4', bg: 'rgba(6,182,212,0.10)' },
          { label: 'Clean Devices', value: '0%', icon: 'ri-checkbox-circle-line', iconColor: '#F59E0B', bg: '#FEF3C7' },
          { label: 'Flagged Devices', value: '0', icon: 'ri-alert-line', iconColor: '#E05A2B', bg: '#FEE2E2' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 border border-white" style={{ background: s.bg }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-[hsl(var(--card))] rounded-xl">
                <i className={`${s.icon} text-base`} style={{ color: s.iconColor }} />
              </div>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-[hsl(var(--muted))] rounded-xl p-1 w-fit mb-5">
        {(['certificates', 'imei', 'generate'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${tab === t ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}
          >
            {t === 'certificates' && <><i className="ri-shield-check-line mr-1.5" />Certificates</>}
            {t === 'imei' && <><i className="ri-scan-line mr-1.5" />IMEI Checker</>}
            {t === 'generate' && <><i className="ri-file-add-line mr-1.5" />Generate Certificate</>}
          </button>
        ))}
      </div>

      {tab === 'certificates' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-3">
            {authCertificates.length === 0 ? (
              <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-10 flex flex-col items-center text-center">
                <i className="ri-shield-check-line text-3xl text-[hsl(var(--muted-foreground))] mb-3" />
                <p className="text-sm font-semibold text-[hsl(var(--muted-foreground))] mb-1">No certificates yet</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Generate your first certificate to verify a device's authenticity.</p>
              </div>
            ) : authCertificates.map(cert => (
              <button
                key={cert.id}
                onClick={() => { setSelectedCert(cert); setCertDetailOpen(true); }}
                className={`w-full bg-[hsl(var(--card))] rounded-2xl border p-4 text-left transition-all cursor-pointer`}
                style={{ borderColor: selectedCert?.id === cert.id ? '#EC0118' : 'hsl(var(--border))' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(236,1,24,0.08)' }}>
                      <i className="ri-shield-check-line text-lg" style={{ color: '#EC0118' }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[hsl(var(--foreground))]">{cert.device}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{cert.id} · {cert.purchaseDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cert.condition === 'New' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-600'}`}>
                      {cert.condition}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(236,1,24,0.08)', color: '#EC0118' }}>
                      <i className="ri-checkbox-circle-line mr-0.5" />Verified
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-[hsl(var(--border))]">
                  <div>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Customer</p>
                    <p className="text-xs font-semibold text-[hsl(var(--foreground))]">{cert.customer}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">IMEI Status</p>
                    <p className="text-xs font-semibold" style={{ color: '#EC0118' }}><i className="ri-checkbox-circle-fill mr-0.5" />Clean</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Warranty</p>
                    <p className="text-xs font-semibold text-[hsl(var(--foreground))]">{cert.warrantyExpiry}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Certificate Preview */}
          {selectedCert && <CertificatePreview cert={selectedCert} />}
        </div>
      )}

      {tab === 'imei' && <ImeiChecker imeiCheckHistory={imeiCheckHistory} />}

      {tab === 'generate' && <GenerateCertificate />}
    </AdminLayout>
  );
}
