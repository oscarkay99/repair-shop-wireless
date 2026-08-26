import { useEffect, useSyncExternalStore } from 'react';
import { getTechnicians, createTechnician, updateTechnician, deleteTechnician } from '@/services/wireless/technicians';
import type { Technician } from '@/types/wireless';
import { useToast } from '@/contexts/ToastContext';
import { errMessage } from '@/utils/errors';

interface Store {
  technicians: Technician[];
  loading: boolean;
}

let store: Store = { technicians: [], loading: true };
let started = false;
const listeners = new Set<() => void>();

function setStore(next: Partial<Store>) {
  store = { ...store, ...next };
  listeners.forEach(l => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return store;
}

// Shared across every screen that reads the technician roster (Tickets
// board's assign dropdown, the Technicians page, the tech portal's own
// status toggle) instead of each mounting its own useState copy — otherwise
// a status change made on one screen (e.g. Tech Portal's On Break toggle)
// only updated that screen's local state, leaving every other
// already-mounted consumer (like the admin Tickets board) showing a stale
// "available" until a hard refresh. Mirrors the same fix applied to
// useWirelessSettings.
export async function reloadTechnicians() {
  setStore({ loading: true });
  try {
    const technicians = await getTechnicians();
    setStore({ technicians, loading: false });
  } catch (e) {
    setStore({ loading: false });
    throw e;
  }
}

export function useTechnicians() {
  const { technicians, loading } = useSyncExternalStore(subscribe, getSnapshot);
  const { showToast } = useToast();

  useEffect(() => {
    if (!started) {
      started = true;
      reloadTechnicians();
    }
  }, []);

  const add = async (input: Parameters<typeof createTechnician>[0]) => {
    try {
      const t = await createTechnician(input);
      setStore({ technicians: [t, ...store.technicians] });
      showToast('Technician added');
      return t;
    } catch (e) {
      showToast(errMessage(e, 'Failed to add technician'), 'error');
      throw e;
    }
  };

  const patch = async (id: string, data: Partial<Technician>) => {
    try {
      await updateTechnician(id, data);
      setStore({ technicians: store.technicians.map(t => t.id === id ? { ...t, ...data } : t) });
    } catch (e) {
      showToast(errMessage(e, 'Failed to update technician'), 'error');
      throw e;
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteTechnician(id);
      setStore({ technicians: store.technicians.filter(t => t.id !== id) });
      showToast('Technician removed');
    } catch (e) {
      showToast(errMessage(e, 'Failed to remove technician'), 'error');
      throw e;
    }
  };

  return { technicians, loading, reload: reloadTechnicians, add, patch, remove };
}
