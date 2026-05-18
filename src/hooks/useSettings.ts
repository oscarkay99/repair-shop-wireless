import { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '@/services/settings';

export function useSettings() {
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings().then(setSettings).finally(() => setLoading(false));
  }, []);

  const save = async (updates: Record<string, unknown>) => {
    await updateSettings(updates);
    setSettings(prev => ({ ...prev, ...updates }));
  };

  return { settings, loading, save };
}

export function useMonthlyTarget() {
  return { target: 100000, loading: false };
}
