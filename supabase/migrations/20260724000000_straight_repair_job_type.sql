-- A third job type for obvious repairs that don't need a diagnosis stage
-- (e.g. a visibly cracked screen that just needs replacing) — no diagnosis
-- fee, no diagnosis/awaiting-approval stage, straight to the repair.
alter table wireless.tickets drop constraint if exists tickets_job_type_check;
alter table wireless.tickets add constraint tickets_job_type_check
  check (job_type in ('diagnosis_only', 'diagnosis_to_repair', 'straight_repair'));
