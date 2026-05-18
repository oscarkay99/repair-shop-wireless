let settingsStore: Record<string, unknown> = {
  businessName: 'FixHub',
  currency: 'GHS',
  monthlyTarget: 50000,
};

export async function getSettings(): Promise<Record<string, unknown>> {
  return { ...settingsStore };
}
export async function updateSettings(updates: Record<string, unknown>): Promise<void> {
  settingsStore = { ...settingsStore, ...updates };
}

export async function getStoreSettings(): Promise<Record<string, unknown>> { return getSettings(); }
export async function saveStoreSettings(updates: Record<string, unknown>): Promise<void> { return updateSettings(updates); }
