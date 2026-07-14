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
export type RepairJobType = 'diagnosis_only' | 'diagnosis_to_repair';
export type RepairQuoteStatus = 'not_sent' | 'pending' | 'approved' | 'declined';
export type RepairServiceStage = 'intake' | 'diagnosis' | 'approval' | 'repair' | 'pickup' | 'closed';

export interface RepairPart {
  name: string;
  status: 'pending' | 'ordered' | 'installed';
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
  createdAt?: string;
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
  technician: string;
  eta: string;
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
