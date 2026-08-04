import { useState, useEffect } from 'react';
import { getFixedAssets, createFixedAsset, updateFixedAsset, deleteFixedAsset } from '@/services/wireless/assets';
import type { FixedAsset } from '@/services/wireless/assets';
import { useToast } from '@/contexts/ToastContext';
import { errMessage } from '@/utils/errors';

export function useAssets() {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    getFixedAssets().then(setAssets).finally(() => setLoading(false));
  }, []);

  const add = async (input: Omit<FixedAsset, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    try {
      const created = await createFixedAsset(input);
      setAssets(prev => [created, ...prev]);
      showToast('Asset added');
      return created;
    } catch (err) {
      showToast(errMessage(err, 'Failed to add asset'), 'error');
      throw err;
    }
  };

  const update = async (id: string, patch: Partial<Omit<FixedAsset, 'id' | 'created_at' | 'updated_at' | 'created_by'>>) => {
    try {
      const updated = await updateFixedAsset(id, patch);
      setAssets(prev => prev.map(a => a.id === id ? updated : a));
      showToast('Asset updated');
    } catch (err) {
      showToast(errMessage(err, 'Failed to update asset'), 'error');
      throw err;
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteFixedAsset(id);
      setAssets(prev => prev.filter(a => a.id !== id));
      showToast('Asset deleted');
    } catch (err) {
      showToast(errMessage(err, 'Failed to delete asset'), 'error');
      throw err;
    }
  };

  return { assets, loading, add, update, remove };
}
