import { RefreshCw } from 'lucide-react';
import { useNewVersionAvailable } from '@/hooks/useNewVersionAvailable';

// Deliberately not dismissible — a dismissed banner used to vanish for the
// rest of the tab's life with no way back short of already knowing to
// reload, which is exactly how stale-bundle sessions kept running into
// already-fixed bugs (see useNewVersionAvailable's comment). Staying up
// until they actually refresh is the whole point.
export default function NewVersionBanner() {
  const available = useNewVersionAvailable();

  if (!available) return null;

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
    </div>
  );
}
