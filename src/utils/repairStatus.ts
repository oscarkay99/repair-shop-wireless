import type { Repair, RepairStatus } from '@/types/repair';

export interface RepairStatusMeta {
  label: string;
  dot: string;
  bg: string;
  color: string;
  filterKey: string;
}

export const REPAIR_STATUS_META: Record<RepairStatus, RepairStatusMeta> = {
  received:              { label: 'Received',      dot: '#94a3b8', bg: 'rgba(148,163,184,0.15)', color: '#94a3b8', filterKey: 'received' },
  diagnosis_paid:        { label: 'Received',      dot: '#94a3b8', bg: 'rgba(148,163,184,0.15)', color: '#94a3b8', filterKey: 'received' },
  diagnosing:            { label: 'Diagnosed',     dot: '#6366f1', bg: 'rgba(99,102,241,0.15)',  color: '#6366f1', filterKey: 'diagnosed' },
  awaiting_approval:     { label: 'Diagnosed',     dot: '#6366f1', bg: 'rgba(99,102,241,0.15)',  color: '#6366f1', filterKey: 'diagnosed' },
  parts_pending:         { label: 'Parts Pending', dot: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b', filterKey: 'parts_pending' },
  in_progress:           { label: 'In Progress',   dot: '#6366f1', bg: 'rgba(99,102,241,0.15)',  color: '#6366f1', filterKey: 'in_progress' },
  ready:                 { label: 'Ready',         dot: '#22c55e', bg: 'rgba(34,197,94,0.15)',   color: '#22c55e', filterKey: 'ready' },
  completed:             { label: 'Completed',     dot: '#22c55e', bg: 'rgba(34,197,94,0.08)',   color: '#22c55e', filterKey: 'completed' },
  diagnosis_only_closed: { label: 'Completed',     dot: '#64748b', bg: 'rgba(100,116,139,0.1)',  color: '#64748b', filterKey: 'completed' },
  cancelled:             { label: 'Cancelled',     dot: '#ef4444', bg: 'rgba(239,68,68,0.15)',   color: '#ef4444', filterKey: 'completed' },
};

export const PIPELINE_FULL = ['Received', 'Diagnosed', 'Parts Pending', 'In Progress', 'Quality Check', 'Ready'];
export const PIPELINE_DX   = ['Received', 'Diagnosed', 'Report Sent', 'Closed'];

const PIPELINE_FULL_STEP: Partial<Record<RepairStatus, number>> = {
  received: 0, diagnosis_paid: 0,
  diagnosing: 1, awaiting_approval: 1,
  parts_pending: 2,
  in_progress: 3,
  ready: 5,
  completed: 5,
  diagnosis_only_closed: 5,
};

export function pipelineStep(status: RepairStatus, isDxOnly: boolean): number {
  if (!isDxOnly) return PIPELINE_FULL_STEP[status] ?? 0;
  if (['received', 'diagnosis_paid'].includes(status))         return 0;
  if (status === 'diagnosing')                                 return 1;
  if (status === 'awaiting_approval')                          return 2;
  if (['diagnosis_only_closed', 'completed'].includes(status)) return 3;
  return 0;
}

export function nextAction(status: RepairStatus, isDxOnly: boolean): string {
  if (['received', 'diagnosis_paid'].includes(status))      return 'Mark Diagnosed';
  if (isDxOnly) {
    if (status === 'diagnosing')        return 'Send Report to Customer';
    if (status === 'awaiting_approval') return 'Close Diagnosis';
    return 'Close';
  }
  if (['diagnosing', 'awaiting_approval'].includes(status)) return 'Mark Parts Pending';
  if (status === 'parts_pending')                           return 'Mark In Progress';
  if (status === 'in_progress')                             return 'Mark Ready';
  if (status === 'ready')                                   return 'Mark Collected';
  return 'Close';
}

export function nextStatus(status: RepairStatus, isDxOnly: boolean): RepairStatus {
  if (['received', 'diagnosis_paid'].includes(status))      return 'diagnosing';
  if (isDxOnly) {
    if (status === 'diagnosing')        return 'awaiting_approval';
    if (status === 'awaiting_approval') return 'diagnosis_only_closed';
    return 'diagnosis_only_closed';
  }
  if (['diagnosing', 'awaiting_approval'].includes(status)) return 'parts_pending';
  if (status === 'parts_pending')                           return 'in_progress';
  if (status === 'in_progress')                             return 'ready';
  return 'completed';
}

/** Terminal/closed statuses — a repair in one of these is done, not part of the active queue. */
export function isActiveRepairStatus(status: RepairStatus): boolean {
  return !['completed', 'cancelled', 'diagnosis_only_closed'].includes(status);
}

const DIAGNOSIS_STAGE_STATUSES = new Set<RepairStatus>([
  'received', 'diagnosis_paid', 'diagnosing', 'awaiting_approval', 'diagnosis_only_closed',
]);

/**
 * Splits the Diagnosis module from the Repairs module. `cancelled` has no stage-at-cancellation
 * field to key off, so it buckets by jobType instead (diagnosis-only cancellations stay in
 * Diagnosis, everything else counts as a cancelled Repair).
 */
export function isDiagnosisStage(repair: Pick<Repair, 'status' | 'jobType'>): boolean {
  if (repair.status === 'cancelled') return repair.jobType === 'diagnosis_only';
  return DIAGNOSIS_STAGE_STATUSES.has(repair.status);
}
