import { useMemo } from 'react';
import type { Repair } from '@/types/repair';
import { staleTier, type StaleTier } from '@/utils/repairStatus';

export interface StaleTicket {
  repair: Repair;
  tier: StaleTier;
  hoursSinceUpdate: number;
}

const TIER_RANK: Record<StaleTier, number> = { urgent: 0, warning: 1 };

/** Recomputes off whatever `repairs` the caller already has loaded — no extra
 *  query, since `staleTier` only needs fields already on the Repair list. */
export function useStaleTickets(repairs: Repair[]): StaleTicket[] {
  return useMemo(() => {
    return repairs
      .map((repair): StaleTicket | null => {
        const tier = staleTier(repair);
        if (!tier || !repair.updatedAt) return null;
        const hoursSinceUpdate = (Date.now() - new Date(repair.updatedAt).getTime()) / 3_600_000;
        return { repair, tier, hoursSinceUpdate };
      })
      .filter((t): t is StaleTicket => t !== null)
      .sort((a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier] || b.hoursSinceUpdate - a.hoursSinceUpdate);
  }, [repairs]);
}
