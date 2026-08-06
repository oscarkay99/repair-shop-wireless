export type RepairStatus =
  | 'received'
  | 'diagnosis_paid'
  | 'diagnosing'
  | 'awaiting_approval'
  | 'parts_pending'
  | 'in_progress'
  | 'ready'
  | 'completed'
  | 'diagnosis_only_closed'
  | 'cancelled';
export type RepairMediaStage = 'received' | 'diagnosed' | 'parts_pending' | 'in_progress' | 'quality_check' | 'ready' | 'completed';
export type RepairMediaType = 'image' | 'video';
export type RepairJobType = 'diagnosis_only' | 'diagnosis_to_repair' | 'straight_repair';
export type RepairQuoteStatus = 'not_sent' | 'pending' | 'approved' | 'declined';
export type RepairServiceStage = 'intake' | 'diagnosis' | 'approval' | 'repair' | 'pickup' | 'closed';

export interface RepairPart {
  name: string;
  status: 'pending' | 'ordered' | 'installed';
}

export interface RepairTechnician {
  id: string;
  name: string;
}

export interface RepairPayment {
  id: string;
  type: 'diagnosis_fee' | 'repair_deposit' | 'repair_balance' | 'repair_full';
  amount: number;
  amountLabel: string;
  status: 'paid' | 'pending' | 'refunded';
  paidAt?: string;
  reference?: string;
 }

export interface RepairMedia {
  id: string;
  repairId: string;
  stage: RepairMediaStage;
  type: RepairMediaType;
  /** Storage object path — used to mint a short-lived signed URL for display, since the repair-media bucket is private. */
  path?: string;
  url: string;
  thumbnailUrl?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  durationSeconds?: number;
  caption?: string;
  uploadedBy?: string;
  createdAt: string;
}

export interface RepairMediaUploadInput {
  file: File;
  stage: RepairMediaStage;
  caption?: string;
  uploadedBy?: string;
  durationSeconds?: number;
}

export interface Repair {
  id: string;
  /** The real `wireless.tickets` uuid primary key — `id` above is the ticket_number
   *  (e.g. "TK-0001") used everywhere for display/routing. Payments target a ticket
   *  by this uuid, not the ticket_number, so anything recording/looking up a
   *  ticket-linked payment or invoice needs this field, not `id`. */
  ticketDbId?: string;
  createdAt?: string;
  /** Bumped by DB triggers on the ticket row itself and on its comments/media/parts —
   *  last-touched time, used to flag tickets that have gone quiet at their current stage. */
  updatedAt?: string;
  customerId?: string;
  customer: string;
  customerEmail?: string;
  customerPhone?: string;
  websiteAuthUserId?: string;
  device: string;
  deviceType?: string;
  issue: string;
  status: RepairStatus;
  jobType?: RepairJobType;
  serviceStage?: RepairServiceStage;
  quoteStatus?: RepairQuoteStatus;
  diagnosisSummary?: string;
  diagnosisFee?: number;
  diagnosisPaidAt?: string;
  quoteAmount?: number;
  quoteSentAt?: string;
  approvalDecisionAt?: string;
  repairStartedAt?: string;
  /** All equal — no "primary" technician. A ticket can be worked by more than
   *  one; each gets full access and workload/completion credit for it. */
  technicians: RepairTechnician[];
  eta: string;
  /** Structured projected-completion date (YYYY-MM-DD), alongside the
   *  free-text `eta` label — powers the overdue flag and turnaround stats
   *  that free text can't support. Optional: existing tickets predate it. */
  etaDate?: string;
  /** Random, unguessable per-ticket secret — embedded in the tracker QR code
   *  on printed receipts/invoices so a scan authenticates on its own,
   *  without a phone-number match (unlike the sequential/guessable ticket
   *  number `id`). Always set by the DB default; optional here only because
   *  local/offline mock data predates it. */
  publicToken?: string;
  cost: string;
  costNum?: number;
  started: string;
  completedDate?: string;
  warranty: boolean;
  parts: RepairPart[];
  notes: string[];
  media?: RepairMedia[];
  payments?: RepairPayment[];
}

export interface RepairStat {
  label: string;
  value: string;
  change: string;
  icon: string;
  accent: string;
}
