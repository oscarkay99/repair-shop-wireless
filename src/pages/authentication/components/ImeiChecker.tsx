import { useState } from 'react';

interface ImeiHistoryItem {
  imei: string;
  device: string;
  network: string;
  status: string;
  checkedAt: string;
}

interface Props {
  imeiCheckHistory: ImeiHistoryItem[];
}

export default function ImeiChecker({ imeiCheckHistory }: Props) {
  const [imeiInput, setImeiInput] = useState('');
  const [imeiResult, setImeiResult] = useState<null | { status: string; device: string; network: string }>(null);
  const [checking, setChecking] = useState(false);

  const checkImei = () => {
    if (!imeiInput.trim()) return;
    setChecking(true);
    setTimeout(() => {
      const found = imeiCheckHistory.find(h => h.imei === imeiInput);
      if (found) {
        setImeiResult({ status: found.status, device: found.device, network: found.network });
      } else {
        setImeiResult({ status: 'clean', device: 'Unknown Device', network: 'Unlocked' });
      }
      setChecking(false);
    }, 1800);
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-6 mb-5">
        <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-1">IMEI Verification</h3>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4">Check if a device is clean, blacklisted, or activation-locked before purchase or sale.</p>
        <div className="flex gap-3">
          <input
            value={imeiInput}
            onChange={e => setImeiInput(e.target.value)}
            placeholder="Enter 15-digit IMEI number..."
            className="flex-1 border border-[hsl(var(--border))] rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-400 font-mono"
            maxLength={15}
          />
          <button
            onClick={checkImei}
            disabled={checking}
            className="px-6 py-3 text-white rounded-xl text-sm font-semibold cursor-pointer whitespace-nowrap disabled:opacity-60 hover:opacity-90"
            style={{ background: '#EC0118' }}
          >
            {checking ? <><i className="ri-loader-4-line animate-spin mr-1" />Checking...</> : <><i className="ri-scan-line mr-1" />Check IMEI</>}
          </button>
        </div>

        {imeiResult && (
          <div className={`mt-4 p-4 rounded-xl border ${imeiResult.status === 'clean' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${imeiResult.status === 'clean' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                <i className={`text-xl ${imeiResult.status === 'clean' ? 'ri-shield-check-fill text-emerald-600' : 'ri-shield-cross-fill text-rose-600'}`} />
              </div>
              <div>
                <p className={`text-sm font-bold ${imeiResult.status === 'clean' ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {imeiResult.status === 'clean' ? 'Device is Clean' : 'Device Flagged'}
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{imeiResult.device} · {imeiResult.network}</p>
              </div>
              {imeiResult.status === 'clean' && (
                <div className="ml-auto">
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">Safe to sell</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-5">
        <h4 className="text-sm font-bold text-[hsl(var(--foreground))] mb-3">Recent IMEI Checks</h4>
        <div className="space-y-2">
          {imeiCheckHistory.map((h, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-[hsl(var(--border))] last:border-0">
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${h.status === 'clean' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                  <i className={`text-sm ${h.status === 'clean' ? 'ri-shield-check-line text-emerald-500' : 'ri-shield-cross-line text-rose-500'}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[hsl(var(--foreground))]">{h.device}</p>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono">{h.imei}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${h.status === 'clean' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                  {h.status === 'clean' ? 'Clean' : 'Flagged'}
                </span>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">{h.checkedAt}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
