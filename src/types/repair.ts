export type RepairStatus = 'received' | 'diagnosed' | 'parts_pending' | 'in_progress' | 'ready' | 'completed' | 'cancelled';

export interface RepairPart {
  name: string;
  status: 'pending' | 'ordered' | 'installed';
}

export interface Repair {
  id: string;
  customer: string;
  device: string;
  deviceType?: string;
  issue: string;
  status: RepairStatus;
  technician: string;
  eta: string;
  cost: string;
  costNum?: number;
  started: string;
  completedDate?: string;
  warranty: boolean;
  parts: RepairPart[];
  notes: string[];
}

export interface RepairStat {
  label: string;
  value: string;
  change: string;
  icon: string;
  accent: string;
}
