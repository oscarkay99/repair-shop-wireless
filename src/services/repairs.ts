import { repairs as seedData } from '@/mocks/repairs';
import type { Repair, RepairMedia, RepairMediaType, RepairStatus, RepairMediaUploadInput } from '@/types/repair';
import { isSupabaseConfigured, supabase } from './supabase';

export const MAX_REPAIR_MEDIA_BYTES = 5 * 1024 * 1024;
export const MAX_REPAIR_VIDEO_DURATION_SECONDS = 30;
export const REPAIR_MEDIA_BUCKET = 'repair-media';

const DIAGNOSIS_PAYMENT_TYPES = new Set(['diagnosis_fee']);

type RepairRow = {
  id: string;
  customer_id?: string | null;
  customer: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  website_auth_user_id?: string | null;
  device: string;
  issue: string;
  status: string;
  job_type?: string | null;
  service_stage?: string | null;
  quote_status?: string | null;
  diagnosis_summary?: string | null;
  diagnosis_fee?: number | null;
  diagnosis_paid_at?: string | null;
  quote_amount?: number | null;
  quote_sent_at?: string | null;
  approval_decision_at?: string | null;
  repair_started_at?: string | null;
  technician: string;
  eta: string;
  cost: string;
  started: string;
  cost_num?: number | null;
  completed_date?: string | null;
  warranty: boolean;
  parts: unknown;
  notes: unknown;
  payments?: unknown;
  created_at?: string | null;
};

type RepairMediaRow = {
  id: string;
  repair_id: string;
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

function normalizeMediaRow(row: RepairMediaRow): RepairMedia {
  return {
    id: row.id,
    repairId: row.repair_id,
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

function normalizeRepairRow(row: RepairRow, media: RepairMedia[]): Repair {
  return {
    id: row.id,
    createdAt: row.created_at ?? undefined,
    customerId: row.customer_id ?? undefined,
    customer: row.customer,
    customerEmail: row.customer_email ?? undefined,
    customerPhone: row.customer_phone ?? undefined,
    websiteAuthUserId: row.website_auth_user_id ?? undefined,
    device: row.device,
    issue: row.issue,
    status: row.status as RepairStatus,
    jobType: (row.job_type as Repair['jobType']) ?? 'diagnosis_to_repair',
    serviceStage: (row.service_stage as Repair['serviceStage']) ?? 'diagnosis',
    quoteStatus: (row.quote_status as Repair['quoteStatus']) ?? 'not_sent',
    diagnosisSummary: row.diagnosis_summary ?? undefined,
    diagnosisFee: row.diagnosis_fee ?? 200,
    diagnosisPaidAt: row.diagnosis_paid_at ?? undefined,
    quoteAmount: row.quote_amount ?? undefined,
    quoteSentAt: row.quote_sent_at ?? undefined,
    approvalDecisionAt: row.approval_decision_at ?? undefined,
    repairStartedAt: row.repair_started_at ?? undefined,
    technician: row.technician,
    eta: row.eta,
    cost: row.cost,
    costNum: row.cost_num ?? undefined,
    started: row.started,
    completedDate: row.completed_date ?? undefined,
    warranty: Boolean(row.warranty),
    parts: parseParts(row.parts),
    notes: parseNotes(row.notes),
    media,
    payments: parsePayments(row.payments),
  };
}

function buildStoragePath(repairId: string, file: File, stage: RepairMedia['stage']) {
  const extension = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
  return `repairs/${repairId}/${stage}/${crypto.randomUUID()}.${extension}`;
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
    const [{ data: repairs, error: repairsError }, { data: mediaRows, error: mediaError }] = await Promise.all([
      supabase.from('repairs').select('*').order('created_at', { ascending: false }),
      supabase.from('repair_media').select('*').order('created_at', { ascending: false }),
    ]);

    if (repairsError) throw repairsError;
    if (mediaError) throw mediaError;

    if (!repairs || repairs.length === 0) {
      return store.map(normalizeRepair);
    }

    const mediaByRepairId = new Map<string, RepairMedia[]>();
    (mediaRows ?? []).forEach((row) => {
      const item = normalizeMediaRow(row as RepairMediaRow);
      const existing = mediaByRepairId.get(item.repairId) ?? [];
      existing.push(item);
      mediaByRepairId.set(item.repairId, existing);
    });

    store = repairs.map((row) =>
      normalizeRepair(
        normalizeRepairRow(row as RepairRow, mediaByRepairId.get((row as RepairRow).id) ?? []),
      ),
    );
  } catch (error) {
    console.warn('Falling back to local repair store.', error);
  }

  return store.map(normalizeRepair);
}

export async function createRepair(r: Omit<Repair, 'id'>): Promise<Repair> {
  const item = normalizeRepair({
    ...r,
    id: `R-${String(store.length + 1).padStart(4, '0')}`,
    media: r.media ?? [],
  } as Repair);

  store = [item, ...store];

  if (isSupabaseConfigured) {
    try {
      await supabase.from('repairs').upsert({
        id: item.id,
        customer_id: item.customerId ?? null,
        customer: item.customer,
        customer_email: item.customerEmail ?? null,
        customer_phone: item.customerPhone ?? null,
        website_auth_user_id: item.websiteAuthUserId ?? null,
        device: item.device,
        issue: item.issue,
        status: item.status,
        job_type: item.jobType ?? null,
        service_stage: item.serviceStage ?? null,
        quote_status: item.quoteStatus ?? null,
        diagnosis_summary: item.diagnosisSummary ?? null,
        diagnosis_fee: item.diagnosisFee ?? null,
        diagnosis_paid_at: item.diagnosisPaidAt ?? null,
        quote_amount: item.quoteAmount ?? null,
        quote_sent_at: item.quoteSentAt ?? null,
        approval_decision_at: item.approvalDecisionAt ?? null,
        repair_started_at: item.repairStartedAt ?? null,
        technician: item.technician,
        eta: item.eta,
        cost: item.cost,
        started: item.started,
        cost_num: item.costNum ?? null,
        completed_date: item.completedDate ?? null,
        warranty: item.warranty,
        parts: item.parts,
        notes: item.notes,
        payments: item.payments ?? [],
      });
    } catch (error) {
      console.warn('Unable to sync new repair to Supabase.', error);
    }
  }

  return normalizeRepair(item);
}

export async function updateRepairStatus(id: string, status: RepairStatus): Promise<void> {
  const repair = store.find((item) => item.id === id);
  if (!repair) {
    throw new Error('Repair not found.');
  }

  assertCanMoveToStatus(repair, status);
  updateLocalRepair(id, (currentRepair) => ({ ...currentRepair, status }));

  if (isSupabaseConfigured) {
    try {
      await supabase.from('repairs').update({ status }).eq('id', id);
    } catch (error) {
      console.warn('Unable to sync repair status to Supabase.', error);
    }
  }
}

export async function updateRepairNotes(id: string, notes: string[]): Promise<void> {
  updateLocalRepair(id, (repair) => ({ ...repair, notes }));

  if (isSupabaseConfigured) {
    try {
      await supabase.from('repairs').update({ notes }).eq('id', id);
    } catch (error) {
      console.warn('Unable to sync repair notes to Supabase.', error);
    }
  }
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

  updateLocalRepair(id, () => nextRepair);

  if (isSupabaseConfigured) {
    try {
      await supabase.from('repairs').update({
        customer_id: patch.customerId,
        customer: patch.customer,
        customer_email: patch.customerEmail,
        customer_phone: patch.customerPhone,
        website_auth_user_id: patch.websiteAuthUserId,
        status: patch.status,
        job_type: patch.jobType,
        service_stage: patch.serviceStage,
        quote_status: patch.quoteStatus,
        diagnosis_summary: patch.diagnosisSummary,
        diagnosis_fee: patch.diagnosisFee,
        diagnosis_paid_at: patch.diagnosisPaidAt,
        quote_amount: patch.quoteAmount,
        quote_sent_at: patch.quoteSentAt,
        approval_decision_at: patch.approvalDecisionAt,
        repair_started_at: patch.repairStartedAt,
        eta: patch.eta,
        cost: patch.cost,
        cost_num: patch.costNum,
        completed_date: patch.completedDate,
        parts: patch.parts,
        notes: patch.notes,
        payments: patch.payments,
      }).eq('id', id);
    } catch (error) {
      console.warn('Unable to sync repair update to Supabase.', error);
    }
  }
}

export async function deleteRepair(id: string): Promise<void> {
  store = store.filter((repair) => repair.id !== id);

  if (isSupabaseConfigured) {
    try {
      await supabase.from('repairs').delete().eq('id', id);
    } catch (error) {
      console.warn('Unable to delete repair from Supabase.', error);
    }
  }
}

export async function addRepairMedia(repairId: string, input: RepairMediaUploadInput): Promise<RepairMedia> {
  if (input.file.size > MAX_REPAIR_MEDIA_BYTES) {
    throw new Error('Each photo or video must be 5MB or less.');
  }

  const mediaType = toMediaType(input.file);
  const createdAt = new Date().toISOString();
  const localPreviewUrl = URL.createObjectURL(input.file);
  let resolvedUrl = localPreviewUrl;
  let filePath: string | undefined;
  let savedId = crypto.randomUUID();

  if (isSupabaseConfigured) {
    try {
      filePath = buildStoragePath(repairId, input.file, input.stage);
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

      const { data: inserted, error: insertError } = await supabase
        .from('repair_media')
        .insert({
          repair_id: repairId,
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
        })
        .select()
        .single();

      if (!insertError && inserted) {
        savedId = (inserted as RepairMediaRow).id;
      }
    } catch (error) {
      console.warn('Unable to sync repair media to Supabase. Keeping a local preview.', error);
    }
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
