import { useState, useEffect, useCallback } from 'react';
import { getWirelessSettings, updateWirelessSettings } from '@/services/wireless/settings';

export interface TaxSettings {
  taxEnabled: boolean;
  vatRate: number;
  nhilGetfundRate: number;
}

const DEFAULTS: TaxSettings = { taxEnabled: true, vatRate: 15, nhilGetfundRate: 5 };

export function useTaxSettings() {
  const [settings, setSettings] = useState<TaxSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWirelessSettings().then(s => {
      setSettings({
        taxEnabled: s.tax_enabled ?? DEFAULTS.taxEnabled,
        vatRate: s.vat_rate ?? DEFAULTS.vatRate,
        nhilGetfundRate: s.nhil_getfund_rate ?? DEFAULTS.nhilGetfundRate,
      });
    }).finally(() => setLoading(false));
  }, []);

  const save = useCallback(async (patch: Partial<TaxSettings>) => {
    await updateWirelessSettings({
      ...(patch.taxEnabled !== undefined && { tax_enabled: patch.taxEnabled }),
      ...(patch.vatRate !== undefined && { vat_rate: patch.vatRate }),
      ...(patch.nhilGetfundRate !== undefined && { nhil_getfund_rate: patch.nhilGetfundRate }),
    });
    setSettings(prev => ({ ...prev, ...patch }));
  }, []);

  return { ...settings, loading, save };
}
