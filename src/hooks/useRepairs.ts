import { useState, useEffect } from 'react';
import { getRepairs, createRepair, updateRepairStatus, updateRepairNotes, addRepairMedia, deleteRepairMedia, updateRepair, deleteRepair, hasConfirmedDiagnosisPayment } from '@/services/repairs';
import type { Repair, RepairStatus, RepairMediaUploadInput } from '@/types/repair';
import { useToast } from '@/contexts/ToastContext';
import { errMessage } from '@/utils/errors';
import { useTaxSettings } from '@/hooks/useTaxSettings';
import { useWirelessSettings } from '@/hooks/useWirelessSettings';
import { ensureTicketInvoice } from '@/services/wireless/autoInvoice';

export function useRepairs() {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { taxEnabled, vatRate, nhilGetfundRate } = useTaxSettings();
  const { settings } = useWirelessSettings();

  useEffect(() => {
    getRepairs().then(setRepairs).finally(() => setLoading(false));
  }, []);

  const add = async (r: Omit<Repair, 'id'>) => {
    try {
      const created = await createRepair(r);
      setRepairs(prev => [created, ...prev]);
      showToast('Repair job created');
      // Every ticket gets an invoice immediately at creation — one with a
      // paid diagnosis fee is invoiced for that; a straight repair (no
      // diagnosis fee at all) gets an unpaid invoice for the quoted cost —
      // not just ones that later reach Ready. Gives staff something to track
      // the ticket by from the moment it's created. Best-effort: a failure
      // here shouldn't undo ticket creation; staff can still create the
      // invoice manually from the ticket panel.
      if (hasConfirmedDiagnosisPayment(created) || created.jobType === 'straight_repair') {
        const depositPaid = (created.payments ?? []).reduce((sum, p) => sum + (p.status === 'paid' ? p.amount : 0), 0);
        ensureTicketInvoice(created, { depositPaid, taxEnabled, vatRate, nhilGetfundRate, warrantyDays: settings?.warranty_days })
          .catch((invoiceError) => {
            console.error('Auto-invoice failed for', created.id, invoiceError);
            showToast(errMessage(invoiceError, `Ticket created, but the invoice couldn't be generated — create it manually from the ticket panel.`), 'error');
          });
      }
      return created;
    } catch (e) {
      showToast(errMessage(e, 'Failed to create repair job'), 'error');
      throw e;
    }
  };

  const setStatus = async (id: string, status: RepairStatus) => {
    try {
      await updateRepairStatus(id, status);
      setRepairs(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      showToast('Status updated');
    } catch (e) {
      showToast(errMessage(e, 'Failed to update status'), 'error');
      throw e;
    }
  };

  const setNotes = async (id: string, notes: string[]) => {
    try {
      await updateRepairNotes(id, notes);
      setRepairs(prev => prev.map(r => r.id === id ? { ...r, notes } : r));
    } catch (e) {
      showToast(errMessage(e, 'Failed to save note'), 'error');
      throw e;
    }
  };

  const updateStatus = async (id: string, status: RepairStatus) => setStatus(id, status);

  const addNote = async (id: string, note: string) => {
    const repair = repairs.find(r => r.id === id);
    if (!repair) return;
    await setNotes(id, [...(repair.notes ?? []), note]);
  };

  const addMedia = async (id: string, input: RepairMediaUploadInput) => {
    try {
      const media = await addRepairMedia(id, input);
      setRepairs(prev => prev.map((repair) => (
        repair.id === id
          ? { ...repair, media: [media, ...(repair.media ?? [])] }
          : repair
      )));
      showToast('Media uploaded');
      return media;
    } catch (e) {
      showToast(errMessage(e, 'Failed to upload media'), 'error');
      throw e;
    }
  };

  const removeMedia = async (id: string, mediaId: string) => {
    try {
      await deleteRepairMedia(id, mediaId);
      setRepairs(prev => prev.map((repair) => (
        repair.id === id
          ? { ...repair, media: (repair.media ?? []).filter((item) => item.id !== mediaId) }
          : repair
      )));
      showToast('Photo removed');
    } catch (e) {
      showToast(errMessage(e, 'Failed to remove photo'), 'error');
      throw e;
    }
  };

  const patchRepair = async (id: string, patch: Partial<Repair>) => {
    try {
      await updateRepair(id, patch);
      setRepairs(prev => prev.map((repair) => (
        repair.id === id ? { ...repair, ...patch } : repair
      )));
      showToast('Repair updated');
    } catch (e) {
      showToast(errMessage(e, 'Failed to update repair'), 'error');
      throw e;
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteRepair(id);
      setRepairs(prev => prev.filter(r => r.id !== id));
      showToast('Repair deleted');
    } catch (e) {
      showToast(errMessage(e, 'Failed to delete repair'), 'error');
      throw e;
    }
  };

  return { repairs, loading, add, setStatus, setNotes, updateStatus, addNote, addMedia, removeMedia, patchRepair, remove };
}
