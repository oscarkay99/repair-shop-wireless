import { useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useNewVersionAvailable } from '@/hooks/useNewVersionAvailable';

export default function NewVersionBanner() {
  const available = useNewVersionAvailable();
  const [dismissed, setDismissed] = useState(false);

  if (!available || dismissed) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 rounded-full pl-4 pr-2 py-2 shadow-lg"
      style={{ background: 'hsl(var(--primary))', color: 'white' }}>
      <p className="text-xs font-semibold whitespace-nowrap">A new version is available</p>
      <button
        onClick={() => window.location.reload()}
        className="h-7 px-3 inline-flex items-center gap-1.5 rounded-full text-xs font-bold cursor-pointer flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.2)' }}
      >
        <RefreshCw className="w-3 h-3" /> Refresh
      </button>
      <button
        onClick={() => setDismissed(true)}
        title="Dismiss"
        className="w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0 cursor-pointer"
        style={{ background: 'rgba(255,255,255,0.15)' }}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
