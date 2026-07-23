import { useState, useEffect, useCallback } from 'react';
import { getTechnicians, createTechnician, updateTechnician, deleteTechnician } from '@/services/wireless/technicians';
import type { Technician } from '@/types/wireless';
import { useToast } from '@/contexts/ToastContext';

export function useTechnicians() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const reload = useCallback(async () => {
    setLoading(true);
    try { setTechnicians(await getTechnicians()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const add = async (input: Parameters<typeof createTechnician>[0]) => {
    try {
      const t = await createTechnician(input);
      setTechnicians(prev => [t, ...prev]);
      showToast('Technician added');
      return t;
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to add technician', 'error');
      throw e;
    }
  };

  const patch = async (id: string, data: Partial<Technician>) => {
    try {
      await updateTechnician(id, data);
      setTechnicians(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to update technician', 'error');
      throw e;
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteTechnician(id);
      setTechnicians(prev => prev.filter(t => t.id !== id));
      showToast('Technician removed');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to remove technician', 'error');
      throw e;
    }
  };

  return { technicians, loading, reload, add, patch, remove };
}
