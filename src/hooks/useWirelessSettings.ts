import { useState, useEffect, useCallback } from 'react';
import { getWirelessSettings, updateWirelessSettings } from '@/services/wireless/settings';
import type { WirelessSettings } from '@/types/wireless';

export function useWirelessSettings() {
  const [settings, setSettings] = useState<WirelessSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try { setSettings(await getWirelessSettings()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const save = async (patch: Partial<WirelessSettings>) => {
    const updated = await updateWirelessSettings(patch);
    setSettings(updated);
    return updated;
  };

  return { settings, loading, save, reload };
}
