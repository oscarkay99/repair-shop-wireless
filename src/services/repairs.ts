import { repairs as seedData } from '@/mocks/repairs';
import type { Repair, RepairMedia, RepairMediaType, RepairStatus, RepairMediaUploadInput, RepairTechnician } from '@/types/repair';
import { isSupabaseConfigured, supabase, db } from './supabase';
import { statusToServiceStage } from '@/utils/repairStatus';

export const MAX_REPAIR_MEDIA_BYTES = 5 * 1024 * 1024;
export const MAX_REPAIR_VIDEO_DURATION_SECONDS = 30;
export const REPAIR_MEDIA_BUCKET = 'repair-media';

const DIAGNOSIS_PAYMENT_TYPES = new Set(['diagnosis_fee']);

// `ticket_number` (e.g. "TK-0001") is what the frontend treats as the repair's id —
// it's DB-generated and unique, so every read/write below filters on it directly
// instead of the internal uuid primary key.
type TicketRow = {
  id: string;
  ticket_number: string;
  customer_id?: string | null;
  customer_name: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  website_auth_user_id?: string | null;
  device: string;
  device_type?: string | null;
  issue: string;
  status: string;
  job_type?: string | null;
  service_stage?: string | null;
  quote_status?: string | null;
  diagnosis?: string | null;
  diagnosis_fee?: number | null;
  diagnosis_paid_at?: string | null;
  quote_amount?: number | null;
  quote_sent_at?: string | null;
  approval_decision_at?: string | null;
  repair_started_at?: string | null;
  eta: string;
  eta_date?: string | null;
  cost_label: string;
  received_at: string;
  estimated_cost?: number | null;
  completed_at?: string | null;
  warranty: boolean;
  parts_json: unknown;
  notes_json: unknown;
  payments_json?: unknown;
  created_at?: string | null;
};

// One row per assigned technician per ticket. `technicians` comes back as a
// single joined object (not an array) — each ticket_technicians row points at
// exactly one technicians row, the one-to-many side lives in there being
// multiple ticket_technicians rows per ticket, not in this join shape.
type TicketTechnicianRow = {
  ticket_id: string;
  technicians: { id: string; name: string } | null;
};

type TicketMediaRow = {
  id: string;
  ticket_number: string;
  stage: string;
  media_type: string;
  file_url: string;
  thumbnail_url?: string | null;
  file_name: string;
  file_size: number;
  mime_type: string;
  duration_seconds?: number | null;
  caption?: string | null;
  uploaded_by?: string | null;
  created_at: string;
};

function normalizeRepair(input: Repair): Repair {
  return {
    ...input,
    jobType: input.jobType ?? 'diagnosis_to_repair',
    serviceStage: input.serviceStage ?? 'diagnosis',
    quoteStatus: input.quoteStatus ?? 'not_sent',
    diagnosisFee: input.diagnosisFee ?? 200,
    technicians: Array.isArray(input.technicians) ? input.technicians.map((tech) => ({ ...tech })) : [],
    parts: Array.isArray(input.parts) ? input.parts.map((part) => ({ ...part })) : [],
    notes: Array.isArray(input.notes) ? [...input.notes] : [],
    media: Array.isArray(input.media) ? input.media.map((item) => ({ ...item })) : [],
    payments: Array.isArray(input.payments) ? input.payments.map((payment) => ({ ...payment })) : [],
  };
}

function parseParts(value: unknown): Repair['parts'] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const candidate = item as { name?: unknown; status?: unknown };
    if (typeof candidate.name !== 'string' || typeof candidate.status !== 'string') return [];
    if (!['pending', 'ordered', 'installed'].includes(candidate.status)) return [];
    return [{ name: candidate.name, status: candidate.status as Repair['parts'][number]['status'] }];
  });
}

function parseNotes(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function parsePayments(value: unknown): Repair['payments'] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const payment = item as {
      id?: unknown;
      type?: unknown;
      amount?: unknown;
      amountLabel?: unknown;
      status?: unknown;
      paidAt?: unknown;
      reference?: unknown;
    };
    if (
      typeof payment.id !== 'string' ||
      typeof payment.type !== 'string' ||
      typeof payment.amount !== 'number' ||
      typeof payment.amountLabel !== 'string' ||
      typeof payment.status !== 'string'
    ) {
      return [];
    }
    return [{
      id: payment.id,
      type: payment.type as NonNullable<Repair['payments']>[number]['type'],
      amount: payment.amount,
      amountLabel: payment.amountLabel,
      status: payment.status as NonNullable<Repair['payments']>[number]['status'],
      paidAt: typeof payment.paidAt === 'string' ? payment.paidAt : undefined,
      reference: typeof payment.reference === 'string' ? payment.reference : undefined,
    }];
  });
}

function toMediaType(file: File): RepairMediaType {
  return file.type.startsWith('video/') ? 'video' : 'image';
}

function normalizeMediaRow(row: TicketMediaRow): RepairMedia {
  return {
    id: row.id,
    repairId: row.ticket_number,
    stage: row.stage as RepairMedia['stage'],
    type: row.media_type as RepairMediaType,
    url: row.file_url,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    fileName: row.file_name,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    durationSeconds: row.duration_seconds ?? undefined,
    caption: row.caption ?? undefined,
    uploadedBy: row.uploaded_by ?? undefined,
    createdAt: row.created_at,
  };
}

function normalizeTicketRow(row: TicketRow, media: RepairMedia[], technicians: RepairTechnician[]): Repair {
  return {
    id: row.ticket_number,
    ticketDbId: row.id,
    createdAt: row.created_at ?? undefined,
    customerId: row.customer_id ?? undefined,
    customer: row.customer_name,
    customerEmail: row.customer_email ?? undefined,
    customerPhone: row.customer_phone ?? undefined,
    websiteAuthUserId: row.website_auth_user_id ?? undefined,
    device: row.device,
    deviceType: row.device_type ?? undefined,
    issue: row.issue,
    status: row.status as RepairStatus,
    jobType: (row.job_type as Repair['jobType']) ?? 'diagnosis_to_repair',
    serviceStage: (row.service_stage as Repair['serviceStage']) ?? 'diagnosis',
    quoteStatus: (row.quote_status as Repair['quoteStatus']) ?? 'not_sent',
    diagnosisSummary: row.diagnosis ?? undefined,
    diagnosisFee: row.diagnosis_fee ?? 200,
    diagnosisPaidAt: row.diagnosis_paid_at ?? undefined,
    quoteAmount: row.quote_amount ?? undefined,
    quoteSentAt: row.quote_sent_at ?? undefined,
    approvalDecisionAt: row.approval_decision_at ?? undefined,
    repairStartedAt: row.repair_started_at ?? undefined,
    technicians,
    eta: row.eta,
    etaDate: row.eta_date ?? undefined,
    cost: row.cost_label,
    costNum: row.estimated_cost ?? undefined,
    started: row.received_at,
    completedDate: row.completed_at ?? undefined,
    warranty: Boolean(row.warranty),
    parts: parseParts(row.parts_json),
    notes: parseNotes(row.notes_json),
    media,
    payments: parsePayments(row.payments_json),
  };
}

function toTicketPatch(item: Partial<Repair>) {
  const patch: Record<string, unknown> = {};
  if ('customerId' in item) patch.customer_id = item.customerId ?? null;
  if ('customer' in item) patch.customer_name = item.customer;
  if ('customerEmail' in item) patch.customer_email = item.customerEmail ?? null;
  if ('customerPhone' in item) patch.customer_phone = item.customerPhone ?? null;
  if ('websiteAuthUserId' in item) patch.website_auth_user_id = item.websiteAuthUserId ?? null;
  if ('device' in item) patch.device = item.device;
  if ('deviceType' in item) patch.device_type = item.deviceType ?? null;
  if ('issue' in item) patch.issue = item.issue;
  if ('status' in item) patch.status = item.status;
  if ('jobType' in item) patch.job_type = item.jobType ?? null;
  if ('serviceStage' in item) patch.service_stage = item.serviceStage ?? null;
  if ('quoteStatus' in item) patch.quote_status = item.quoteStatus ?? null;
  if ('diagnosisSummary' in item) patch.diagnosis = item.diagnosisSummary ?? null;
  if ('diagnosisFee' in item) patch.diagnosis_fee = item.diagnosisFee ?? null;
  if ('diagnosisPaidAt' in item) patch.diagnosis_paid_at = item.diagnosisPaidAt ?? null;
  if ('quoteAmount' in item) patch.quote_amount = item.quoteAmount ?? null;
  if ('quoteSentAt' in item) patch.quote_sent_at = item.quoteSentAt ?? null;
  if ('approvalDecisionAt' in item) patch.approval_decision_at = item.approvalDecisionAt ?? null;
  if ('repairStartedAt' in item) patch.repair_started_at = item.repairStartedAt ?? null;
  // 'technicians' is deliberately not handled here — it lives in the
  // wireless.ticket_technicians join table, not a tickets column, and is
  // written separately by setTicketTechnicians() (see updateRepair/createRepair).
  if ('eta' in item) patch.eta = item.eta;
  if ('etaDate' in item) patch.eta_date = item.etaDate || null;
  if ('cost' in item) patch.cost_label = item.cost;
  if ('costNum' in item) patch.estimated_cost = item.costNum ?? null;
  if ('completedDate' in item) patch.completed_at = item.completedDate ?? null;
  if ('warranty' in item) patch.warranty = item.warranty;
  if ('parts' in item) patch.parts_json = item.parts;
  if ('notes' in item) patch.notes_json = item.notes;
  if ('payments' in item) patch.payments_json = item.payments;
  return patch;
}

function buildStoragePath(ticketNumber: string, file: File, stage: RepairMedia['stage']) {
  const extension = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
  return `repairs/${ticketNumber}/${stage}/${crypto.randomUUID()}.${extension}`;
}

async function currentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

// Assignment lives in wireless.ticket_technicians, not a tickets column, so
// it's always a full replace (delete then insert) rather than a patch —
// there's no partial-update concept for "who's assigned" worth having.
async function setTicketTechnicians(ticketDbId: string, technicianIds: string[]): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error: deleteError } = await db.from('ticket_technicians').delete().eq('ticket_id', ticketDbId);
  if (deleteError) throw deleteError;
  if (technicianIds.length === 0) return;
  const { error: insertError } = await db.from('ticket_technicians').insert(
    technicianIds.map((technician_id) => ({ ticket_id: ticketDbId, technician_id })),
  );
  if (insertError) throw insertError;
}

export function hasConfirmedDiagnosisPayment(repair: Repair): boolean {
  const hasPaidPayment = (repair.payments ?? []).some((payment) => (
    DIAGNOSIS_PAYMENT_TYPES.has(payment.type) && payment.status === 'paid'
  ));
  return hasPaidPayment || Boolean(repair.diagnosisPaidAt);
}

export function getCustomerVisibleRepairStatus(repair: Repair): RepairStatus {
  if (!hasConfirmedDiagnosisPayment(repair)) {
    return 'received';
  }

  if (repair.status === 'diagnosing' || repair.status === 'awaiting_approval') {
    return repair.status;
  }

  return repair.status;
}

function assertCanMoveToStatus(repair: Repair, nextStatus: RepairStatus) {
  if (nextStatus === 'diagnosing' && !hasConfirmedDiagnosisPayment(repair)) {
    throw new Error('Diagnosis must be paid before a technician can start diagnosing.');
  }
}

function updateLocalRepair(id: string, updater: (repair: Repair) => Repair) {
  store = store.map((repair) => (repair.id === id ? normalizeRepair(updater(repair)) : repair));
}

let store: Repair[] = seedData.map((repair) => normalizeRepair(repair as unknown as Repair));

export async function getRepairs(): Promise<Repair[]> {
  if (!isSupabaseConfigured) {
    return store.map(normalizeRepair);
  }

  try {
    const [
      { data: tickets, error: ticketsError },
      { data: mediaRows, error: mediaError },
      { data: technicianRows, error: technicianError },
    ] = await Promise.all([
      db.from('tickets').select('*').order('created_at', { ascending: false }),
      db.from('ticket_media').select('*').order('created_at', { ascending: false }),
      db.from('ticket_technicians').select('ticket_id, technicians(id, name)'),
    ]);

    if (ticketsError) throw ticketsError;
    if (mediaError) throw mediaError;
    if (technicianError) throw technicianError;

    const mediaByTicketNumber = new Map<string, RepairMedia[]>();
    (mediaRows ?? []).forEach((row) => {
      const item = normalizeMediaRow(row as TicketMediaRow);
      const existing = mediaByTicketNumber.get(item.repairId) ?? [];
      existing.push(item);
      mediaByTicketNumber.set(item.repairId, existing);
    });

    const techniciansByTicketId = new Map<string, RepairTechnician[]>();
    (technicianRows ?? []).forEach((row) => {
      const { ticket_id, technicians: tech } = row as unknown as TicketTechnicianRow;
      if (!tech) return;
      const existing = techniciansByTicketId.get(ticket_id) ?? [];
      existing.push({ id: tech.id, name: tech.name });
      techniciansByTicketId.set(ticket_id, existing);
    });

    // Trust a successful (even empty) response completely — don't keep
    // showing seed tickets once the real table is reachable.
    store = (tickets ?? []).map((row) => {
      const ticketRow = row as TicketRow;
      return normalizeRepair(
        normalizeTicketRow(
          ticketRow,
          mediaByTicketNumber.get(ticketRow.ticket_number) ?? [],
          techniciansByTicketId.get(ticketRow.id) ?? [],
        ),
      );
    });
  } catch (error) {
    console.warn('Falling back to local repair store.', error);
  }

  return store.map(normalizeRepair);
}

export async function createRepair(r: Omit<Repair, 'id'>): Promise<Repair> {
  if (isSupabaseConfigured) {
    let item = normalizeRepair({ ...r, id: '', media: r.media ?? [] } as Repair);
    const { data: inserted, error } = await db.from('tickets').insert({
      customer_id: item.customerId ?? null,
      customer_name: item.customer,
      customer_email: item.customerEmail ?? null,
      customer_phone: item.customerPhone ?? null,
      website_auth_user_id: item.websiteAuthUserId ?? null,
      device: item.device,
      device_type: item.deviceType ?? null,
      issue: item.issue,
      status: item.status,
      job_type: item.jobType ?? null,
      service_stage: item.serviceStage ?? null,
      quote_status: item.quoteStatus ?? null,
      diagnosis: item.diagnosisSummary ?? null,
      diagnosis_fee: item.diagnosisFee ?? null,
      diagnosis_paid_at: item.diagnosisPaidAt ?? null,
      quote_amount: item.quoteAmount ?? null,
      quote_sent_at: item.quoteSentAt ?? null,
      approval_decision_at: item.approvalDecisionAt ?? null,
      repair_started_at: item.repairStartedAt ?? null,
      eta: item.eta,
      eta_date: item.etaDate || null,
      cost_label: item.cost,
      estimated_cost: item.costNum ?? null,
      completed_at: item.completedDate ?? null,
      warranty: item.warranty,
      parts_json: item.parts,
      notes_json: item.notes,
      payments_json: item.payments ?? [],
    }).select('id, ticket_number, received_at, created_at').single();

    if (error) throw error;
    await setTicketTechnicians(inserted.id, item.technicians.map((tech) => tech.id));
    item = normalizeRepair({
      ...item,
      id: inserted.ticket_number,
      ticketDbId: inserted.id,
      started: inserted.received_at,
      createdAt: inserted.created_at ?? undefined,
    });
    store = [item, ...store];
    return normalizeRepair(item);
  }

  const localId = `R-${String(store.length + 1).padStart(4, '0')}`;
  const item = normalizeRepair({ ...r, id: localId, media: r.media ?? [] } as Repair);
  store = [item, ...store];
  return normalizeRepair(item);
}

export async function updateRepairStatus(id: string, status: RepairStatus): Promise<void> {
  const repair = store.find((item) => item.id === id);
  if (!repair) {
    throw new Error('Repair not found.');
  }

  assertCanMoveToStatus(repair, status);
  const serviceStage = statusToServiceStage(status, repair.jobType);

  if (isSupabaseConfigured) {
    const { error } = await db.from('tickets').update({ status, service_stage: serviceStage }).eq('ticket_number', id);
    if (error) throw error;
  }
  updateLocalRepair(id, (currentRepair) => ({ ...currentRepair, status, serviceStage }));
}

export async function updateRepairNotes(id: string, notes: string[]): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await db.from('tickets').update({ notes_json: notes }).eq('ticket_number', id);
    if (error) throw error;
  }
  updateLocalRepair(id, (repair) => ({ ...repair, notes }));
}

export async function updateRepair(id: string, patch: Partial<Repair>): Promise<void> {
  const existingRepair = store.find((repair) => repair.id === id);
  if (!existingRepair) {
    throw new Error('Repair not found.');
  }

  const nextRepair = normalizeRepair({ ...existingRepair, ...patch });
  if (patch.status) {
    assertCanMoveToStatus(nextRepair, patch.status);
  }

  if (isSupabaseConfigured) {
    const ticketPatch = toTicketPatch(patch);
    if (Object.keys(ticketPatch).length > 0) {
      const { error } = await db.from('tickets').update(ticketPatch).eq('ticket_number', id);
      if (error) throw error;
    }
    if (patch.technicians && existingRepair.ticketDbId) {
      await setTicketTechnicians(existingRepair.ticketDbId, patch.technicians.map((tech) => tech.id));
    }
  }
  updateLocalRepair(id, () => nextRepair);
}

export async function deleteRepair(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await db.from('tickets').delete().eq('ticket_number', id);
    if (error) throw error;
  }
  store = store.filter((repair) => repair.id !== id);
}

// Invoices only carry the ticket's uuid (ticket_id), not its human-readable
// ticket_number — needed to deep-link the tracker QR to the right ticket
// without pulling the whole repairs list into a page that otherwise has no
// reason to load it.
export async function getTicketNumberById(ticketDbId: string): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await db.from('tickets').select('ticket_number').eq('id', ticketDbId).single();
  if (error) return null;
  return (data as { ticket_number: string } | null)?.ticket_number ?? null;
}

export async function addRepairMedia(repairId: string, input: RepairMediaUploadInput): Promise<RepairMedia> {
  if (input.file.size > MAX_REPAIR_MEDIA_BYTES) {
    throw new Error('Each photo or video must be 5MB or less.');
  }

  const mediaType = toMediaType(input.file);
  const createdAt = new Date().toISOString();
  let resolvedUrl = URL.createObjectURL(input.file);
  let savedId = crypto.randomUUID();

  if (isSupabaseConfigured) {
    const filePath = buildStoragePath(repairId, input.file, input.stage);
    const { error: uploadError } = await supabase.storage
      .from(REPAIR_MEDIA_BUCKET)
      .upload(filePath, input.file, {
        cacheControl: '3600',
        contentType: input.file.type,
        upsert: false,
      });
    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from(REPAIR_MEDIA_BUCKET).getPublicUrl(filePath);
    resolvedUrl = publicUrlData.publicUrl;

    const uploaderId = await currentUserId();
    const { data: inserted, error: insertError } = await db
      .from('ticket_media')
      .insert({
        ticket_number: repairId,
        stage: input.stage,
        media_type: mediaType,
        file_path: filePath,
        file_url: resolvedUrl,
        file_name: input.file.name,
        file_size: input.file.size,
        mime_type: input.file.type,
        duration_seconds: input.durationSeconds,
        caption: input.caption?.trim() || null,
        uploaded_by: input.uploadedBy ?? null,
        uploaded_by_id: uploaderId,
      })
      .select()
      .single();
    if (insertError) throw insertError;
    savedId = (inserted as TicketMediaRow).id;
  }

  const media: RepairMedia = {
    id: savedId,
    repairId,
    stage: input.stage,
    type: mediaType,
    url: resolvedUrl,
    fileName: input.file.name,
    fileSize: input.file.size,
    mimeType: input.file.type,
    durationSeconds: input.durationSeconds,
    caption: input.caption?.trim() || undefined,
    uploadedBy: input.uploadedBy,
    createdAt,
  };

  updateLocalRepair(repairId, (repair) => ({
    ...repair,
    media: [media, ...(repair.media ?? [])],
  }));

  return { ...media };
}

export async function deleteRepairMedia(repairId: string, mediaId: string): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await db.from('ticket_media').delete().eq('id', mediaId);
    if (error) throw error;
  }
  updateLocalRepair(repairId, (repair) => ({
    ...repair,
    media: (repair.media ?? []).filter((item) => item.id !== mediaId),
  }));
}
