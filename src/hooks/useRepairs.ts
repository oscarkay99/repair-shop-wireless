import { useState, useEffect } from 'react';
import { getRepairs, createRepair, updateRepairStatus, updateRepairNotes, addRepairMedia, updateRepair } from '@/services/repairs';
import type { Repair, RepairStatus, RepairMediaUploadInput } from '@/types/repair';
import { useToast } from '@/contexts/ToastContext';

export function useRepairs() {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    getRepairs().then(setRepairs).finally(() => setLoading(false));
  }, []);

  const add = async (r: Omit<Repair, 'id'>) => {
    const created = await createRepair(r);
    setRepairs(prev => [created, ...prev]);
    showToast('Repair job created');
    return created;
  };

  const setStatus = async (id: string, status: RepairStatus) => {
    await updateRepairStatus(id, status);
    setRepairs(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    showToast('Status updated');
  };

  const setNotes = async (id: string, notes: string[]) => {
    await updateRepairNotes(id, notes);
    setRepairs(prev => prev.map(r => r.id === id ? { ...r, notes } : r));
  };

  const updateStatus = async (id: string, status: RepairStatus) => setStatus(id, status);

  const addNote = async (id: string, note: string) => {
    const repair = repairs.find(r => r.id === id);
    if (!repair) return;
    await setNotes(id, [...(repair.notes ?? []), note]);
  };

  const addMedia = async (id: string, input: RepairMediaUploadInput) => {
    const media = await addRepairMedia(id, input);
    setRepairs(prev => prev.map((repair) => (
      repair.id === id
        ? { ...repair, media: [media, ...(repair.media ?? [])] }
        : repair
    )));
    showToast('Media uploaded');
    return media;
  };

  const patchRepair = async (id: string, patch: Partial<Repair>) => {
    await updateRepair(id, patch);
    setRepairs(prev => prev.map((repair) => (
      repair.id === id ? { ...repair, ...patch } : repair
    )));
    showToast('Repair updated');
  };

  return { repairs, loading, add, setStatus, setNotes, updateStatus, addNote, addMedia, patchRepair };
}
