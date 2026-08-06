import { useMemo } from 'react';
import type { Repair } from '@/types/repair';
import { etaTier, type EtaTier } from '@/utils/repairStatus';

export interface EtaReminder {
  repair: Repair;
  tier: EtaTier;
}

const TIER_RANK: Record<EtaTier, number> = { overdue: 0, due_soon: 1 };

/** Recomputes off whatever `repairs` the caller already has loaded. */
export function useEtaReminders(repairs: Repair[]): EtaReminder[] {
  return useMemo(() => {
    return repairs
      .map((repair): EtaReminder | null => {
        const tier = etaTier(repair);
        return tier ? { repair, tier } : null;
      })
      .filter((r): r is EtaReminder => r !== null)
      .sort((a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier] || (a.repair.etaDate ?? '').localeCompare(b.repair.etaDate ?? ''));
  }, [repairs]);
}
