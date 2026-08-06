import { useEffect, useState } from 'react';

const CHECK_INTERVAL_MS = 5 * 60 * 1000;

// Polls the version.json emitted alongside the build (see vite.config.ts)
// and flags when it no longer matches the build id baked into this running
// bundle — the giveaway that a deploy landed while this tab stayed open,
// which is exactly what caused the reassignment/photo bugs to look broken
// during today's training even after they'd already shipped.
export function useNewVersionAvailable(): boolean {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch(`${__BASE_PATH__}version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data?.buildId && data.buildId !== __BUILD_ID__) {
          setAvailable(true);
        }
      } catch {
        // Offline or transient network issue — next interval retries.
      }
    };

    check();
    const intervalId = setInterval(check, CHECK_INTERVAL_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return available;
}
