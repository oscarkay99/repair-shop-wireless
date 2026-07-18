import { useState, useEffect, useCallback } from 'react';
import { getWirelessSettings, updateWirelessSettings } from '@/services/wireless/settings';

export interface TaxSettings {
  taxEnabled: boolean;
  vatRate: number;
}

const DEFAULTS: TaxSettings = { taxEnabled: true, vatRate: 15 };

export function useTaxSettings() {
  const [settings, setSettings] = useState<TaxSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWirelessSettings().then(s => {
      setSettings({ taxEnabled: s.tax_enabled, vatRate: s.vat_rate });
    }).finally(() => setLoading(false));
  }, []);

  const save = useCallback(async (patch: Partial<TaxSettings>) => {
    setSettings(prev => ({ ...prev, ...patch }));
    await updateWirelessSettings({
      ...(patch.taxEnabled !== undefined && { tax_enabled: patch.taxEnabled }),
      ...(patch.vatRate !== undefined && { vat_rate: patch.vatRate }),
    });
  }, []);

  return { ...settings, loading, save };
}
