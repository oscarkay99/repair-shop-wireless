import { useEffect, useSyncExternalStore } from 'react';
import { getWirelessSettings, updateWirelessSettings } from '@/services/wireless/settings';
import type { WirelessSettings } from '@/types/wireless';

interface Store {
  settings: WirelessSettings | null;
  loading: boolean;
}

let store: Store = { settings: null, loading: true };
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

// Every screen that reads Wireless settings (sidebar branding, invoices,
// receipts, etc.) shares this one fetch/cache instead of each mounting its
// own copy via its own useState — otherwise a change made on one screen
// (e.g. uploading a logo in Settings) only updated that screen's local
// state, leaving every other already-mounted consumer (like the sidebar,
// which mounts once for the whole session) showing stale data until a
// hard refresh.
export async function reloadWirelessSettings() {
  setStore({ loading: true });
  try {
    const settings = await getWirelessSettings();
    setStore({ settings, loading: false });
  } catch (e) {
    setStore({ loading: false });
    throw e;
  }
}

export function useWirelessSettings() {
  const { settings, loading } = useSyncExternalStore(subscribe, getSnapshot);

  useEffect(() => {
    if (!started) {
      started = true;
      reloadWirelessSettings();
    }
  }, []);

  const save = async (patch: Partial<WirelessSettings>) => {
    const updated = await updateWirelessSettings(patch);
    setStore({ settings: updated });
    return updated;
  };

  return { settings, loading, save, reload: reloadWirelessSettings };
}
