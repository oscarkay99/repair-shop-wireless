import type { Repair, RepairStatus, RepairMediaStage, RepairJobType, RepairServiceStage } from '@/types/repair';

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

export const PIPELINE_FULL     = ['Received', 'Diagnosed', 'Parts Pending', 'In Progress', 'Quality Check', 'Ready'];
export const PIPELINE_CLOSED   = ['Received', 'Diagnosed', 'Closed'];
export const PIPELINE_STRAIGHT = ['Received', 'In Progress', 'Ready', 'Completed'];

/**
 * A ticket's status transitions are unified (the decision to close or continue to repair
 * happens at `awaiting_approval`, not at intake) — but the pipeline *preview* shown to staff
 * should still reflect the job's declared intent: a "Diagnosis Only" ticket shows the short
 * Received → Diagnosed → Closed path, not the full 6-step repair pipeline, until it's actually
 * converted to a repair (at which point jobType flips to 'diagnosis_to_repair'). A "Straight
 * Repair" ticket skips diagnosis entirely and shows its own short pipeline.
 */
export function activePipeline(status: RepairStatus, jobType?: RepairJobType): string[] {
  if (jobType === 'straight_repair') return PIPELINE_STRAIGHT;
  if (status === 'diagnosis_only_closed' || jobType === 'diagnosis_only') return PIPELINE_CLOSED;
  return PIPELINE_FULL;
}

export function pipelineStep(status: RepairStatus, jobType?: RepairJobType): number {
  if (jobType === 'straight_repair') {
    switch (status) {
      case 'received':      return 0;
      case 'parts_pending':
      case 'in_progress':   return 1;
      case 'ready':         return 2;
      case 'completed':     return 3;
      default:              return 0;
    }
  }
  if (status === 'diagnosis_only_closed' || jobType === 'diagnosis_only') {
    switch (status) {
      case 'received':
      case 'diagnosis_paid':        return 0;
      case 'diagnosing':
      case 'awaiting_approval':     return 1;
      case 'diagnosis_only_closed': return 2;
      default:                      return 1;
    }
  }
  switch (status) {
    case 'received':
    case 'diagnosis_paid':       return 0;
    case 'diagnosing':
    case 'awaiting_approval':    return 1;
    case 'parts_pending':        return 2;
    case 'in_progress':          return 3;
    case 'ready':
    case 'completed':            return 5;
    default:                     return 0;
  }
}

/**
 * Status advance for the single-button "next step" flow. `awaiting_approval` is deliberately
 * excluded — that's a decision point with two explicit outcomes (proceed to repair or close),
 * handled separately in the UI rather than as a single "next" action. A "Straight Repair" job
 * never enters `diagnosing`/`awaiting_approval` at all — it goes straight from intake to repair.
 */
export function nextAction(status: RepairStatus, jobType?: RepairJobType): string {
  if (jobType === 'straight_repair') {
    if (status === 'received')      return 'Start Repair';
    if (status === 'parts_pending') return 'Mark In Progress';
    if (status === 'in_progress')   return 'Mark Ready';
    if (status === 'ready')         return 'Mark Collected';
    return 'Close';
  }
  if (['received', 'diagnosis_paid'].includes(status)) return 'Mark Diagnosed';
  if (status === 'diagnosing')                         return 'Diagnosis Complete';
  if (status === 'parts_pending')                      return 'Mark In Progress';
  if (status === 'in_progress')                        return 'Mark Ready';
  if (status === 'ready')                              return 'Mark Collected';
  return 'Close';
}

export function nextStatus(status: RepairStatus, jobType?: RepairJobType): RepairStatus {
  if (jobType === 'straight_repair') {
    if (status === 'received')      return 'in_progress';
    if (status === 'parts_pending') return 'in_progress';
    if (status === 'in_progress')   return 'ready';
    if (status === 'ready')         return 'completed';
    return 'completed';
  }
  if (['received', 'diagnosis_paid'].includes(status)) return 'diagnosing';
  if (status === 'diagnosing')                         return 'awaiting_approval';
  if (status === 'parts_pending')                      return 'in_progress';
  if (status === 'in_progress')                        return 'ready';
  if (status === 'ready')                              return 'completed';
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
 * Diagnosis, everything else counts as a cancelled Repair). A "Straight Repair" job never has a
 * diagnosis stage at all, regardless of status.
 */
export function isDiagnosisStage(repair: Pick<Repair, 'status' | 'jobType'>): boolean {
  if (repair.jobType === 'straight_repair') return false;
  if (repair.status === 'cancelled') return repair.jobType === 'diagnosis_only';
  return DIAGNOSIS_STAGE_STATUSES.has(repair.status);
}

/** Maps the current repair status to the photo-log stage a new upload should be tagged with. */
export function statusToMediaStage(status: RepairStatus): RepairMediaStage {
  switch (status) {
    case 'received':
    case 'diagnosis_paid':       return 'received';
    case 'diagnosing':
    case 'awaiting_approval':    return 'diagnosed';
    case 'parts_pending':        return 'parts_pending';
    case 'in_progress':          return 'in_progress';
    case 'ready':                return 'ready';
    default:                     return 'completed';
  }
}

/**
 * Maps the internal status to the customer-facing stage shown on the tracker portal
 * (wireless-customer-portal reads this straight off `service_stage`). Every status-changing
 * action needs to pass this through — the field isn't derived server-side, so a caller that
 * updates `status` without also updating `serviceStage` leaves the customer tracker frozen at
 * whatever stage the ticket was created in.
 */
export function statusToServiceStage(status: RepairStatus, jobType?: RepairJobType): RepairServiceStage {
  if (jobType === 'straight_repair') {
    switch (status) {
      case 'received':          return 'intake';
      case 'parts_pending':
      case 'in_progress':       return 'repair';
      case 'ready':
      case 'completed':         return 'pickup';
      default:                  return 'repair';
    }
  }
  if (jobType === 'diagnosis_only' || status === 'diagnosis_only_closed') {
    switch (status) {
      case 'received':
      case 'diagnosis_paid':    return 'intake';
      case 'diagnosing':        return 'diagnosis';
      case 'awaiting_approval': return 'approval';
      case 'diagnosis_only_closed': return 'closed';
      default:                  return 'diagnosis';
    }
  }
  switch (status) {
    case 'received':
    case 'diagnosis_paid':      return 'intake';
    case 'diagnosing':          return 'diagnosis';
    case 'awaiting_approval':   return 'approval';
    case 'parts_pending':
    case 'in_progress':         return 'repair';
    case 'ready':
    case 'completed':           return 'pickup';
    default:                    return 'diagnosis';
  }
}

/**
 * Stages where a technician must attach at least one photo before the ticket can move on —
 * condition on arrival, proof of the diagnosed fault, a mid-repair progress shot, and proof
 * of the finished work.
 */
export const REQUIRED_MEDIA_STAGES: RepairMediaStage[] = ['received', 'diagnosed', 'in_progress', 'completed'];

/** Human-readable description of each required stage, used in the "attach a photo" prompt. */
export const REQUIRED_MEDIA_STAGE_LABEL: Partial<Record<RepairMediaStage, string>> = {
  received:    'condition-on-arrival',
  diagnosed:   'diagnosis proof',
  in_progress: 'work-in-progress',
  completed:   'finished-work',
};

/** The media stage that must have a photo before `status` can advance to `next`, if any. */
export function requiredMediaStageForAdvance(status: RepairStatus, next: RepairStatus): RepairMediaStage | null {
  if (['received', 'diagnosis_paid'].includes(status) && REQUIRED_MEDIA_STAGES.includes('received'))       return 'received';
  if (status === 'diagnosing' && next === 'awaiting_approval' && REQUIRED_MEDIA_STAGES.includes('diagnosed')) return 'diagnosed';
  if (status === 'in_progress' && next === 'ready' && REQUIRED_MEDIA_STAGES.includes('in_progress'))         return 'in_progress';
  if (next === 'completed' && REQUIRED_MEDIA_STAGES.includes('completed'))                                   return 'completed';
  return null;
}
