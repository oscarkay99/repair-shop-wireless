import type { TechnicianStatus } from '@/types/wireless';

export interface AvailabilityCheck {
  status: TechnicianStatus;
  unavailable_from?: string | null;
  unavailable_until?: string | null;
}

/** True when the technician is unavailable as of today (inclusive of both ends of the range). */
export function isCurrentlyUnavailable(tech: AvailabilityCheck): boolean {
  if (tech.status !== 'unavailable') return false;
  if (!tech.unavailable_from || !tech.unavailable_until) return true;
  const today = new Date().toISOString().slice(0, 10);
  return today >= tech.unavailable_from && today <= tech.unavailable_until;
}
