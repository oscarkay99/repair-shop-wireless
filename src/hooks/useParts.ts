import { useState, useEffect, useCallback } from 'react';
import { getParts, createPart, updatePart, deletePart, adjustStock } from '@/services/wireless/parts';
import type { Part } from '@/types/wireless';
import { useToast } from '@/contexts/ToastContext';

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
      showToast(e instanceof Error ? e.message : 'Failed to add part', 'error');
      throw e;
    }
  };

  const patch = async (id: string, data: Partial<Part>) => {
    try {
      await updatePart(id, data);
      setParts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to update part', 'error');
      throw e;
    }
  };

  const remove = async (id: string) => {
    try {
      await deletePart(id);
      setParts(prev => prev.filter(p => p.id !== id));
      showToast('Part removed');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to remove part', 'error');
      throw e;
    }
  };

  const adjust = async (id: string, delta: number) => {
    try {
      await adjustStock(id, delta);
      setParts(prev => prev.map(p => p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p));
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to adjust stock', 'error');
      throw e;
    }
  };

  const lowStock = parts.filter(p => p.stock < p.min_stock);

  return { parts, loading, reload, add, patch, remove, adjust, lowStock };
}
