import { useState, useEffect, useCallback } from 'react';
import { getParts, createPart, updatePart, deletePart, adjustStock, adjustDefectiveStock } from '@/services/wireless/parts';
import type { Part } from '@/types/wireless';
import { useToast } from '@/contexts/ToastContext';
import { errMessage } from '@/utils/errors';

export function useParts() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const reload = useCallback(async () => {
    setLoading(true);
    try { setParts(await getParts()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const add = async (input: Parameters<typeof createPart>[0]) => {
    try {
      const p = await createPart(input);
      setParts(prev => [p, ...prev]);
      showToast('Part added');
      return p;
    } catch (e) {
      showToast(errMessage(e, 'Failed to add part'), 'error');
      throw e;
    }
  };

  const patch = async (id: string, data: Partial<Part>) => {
    try {
      await updatePart(id, data);
      setParts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    } catch (e) {
      showToast(errMessage(e, 'Failed to update part'), 'error');
      throw e;
    }
  };

  const remove = async (id: string) => {
    try {
      await deletePart(id);
      setParts(prev => prev.filter(p => p.id !== id));
      showToast('Part removed');
    } catch (e) {
      showToast(errMessage(e, 'Failed to remove part'), 'error');
      throw e;
    }
  };

  const adjust = async (id: string, delta: number) => {
    try {
      const newStock = await adjustStock(id, delta);
      setParts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p));
    } catch (e) {
      showToast(errMessage(e, 'Failed to adjust stock'), 'error');
      throw e;
    }
  };

  const adjustDefective = async (id: string, delta: number) => {
    try {
      const newDefective = await adjustDefectiveStock(id, delta);
      setParts(prev => prev.map(p => p.id === id ? { ...p, defective_stock: newDefective } : p));
    } catch (e) {
      showToast(errMessage(e, 'Failed to adjust defective stock'), 'error');
      throw e;
    }
  };

  const lowStock = parts.filter(p => p.stock < p.min_stock);

  return { parts, loading, reload, add, patch, remove, adjust, adjustDefective, lowStock };
}
