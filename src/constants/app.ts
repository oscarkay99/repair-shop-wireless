export const APP_NAME = 'FixHub';
export const APP_FULL_NAME = 'FixHub Command Center';
export const COMPANY_NAME = 'FixHub';
export const SUPPORT_WHATSAPP = '+233 24 000 0000';
export const CURRENCY = 'GHS';

export const COLORS = {
  primaryBlue: '#0D1F4A',
  deepNavy: '#07101F',
  gold: '#F5A623',
  lightBlue: 'rgba(7,16,31,0.06)',
  surface: '#0F2147',
  border: '#1E3A6E',
} as const;

export const SEGMENT_COLORS: Record<string, string> = {
  VIP: 'text-amber-400 bg-amber-400/10',
  Repeat: 'text-blue-400 bg-blue-400/10',
  New: 'text-emerald-400 bg-emerald-400/10',
  'At-Risk': 'text-red-400 bg-red-400/10',
};

export const LEAD_STATUS_COLORS: Record<string, string> = {
  hot: 'text-red-400 bg-red-400/10',
  warm: 'text-amber-400 bg-amber-400/10',
  cold: 'text-blue-400 bg-blue-400/10',
};

export const REPAIR_STATUS_COLORS: Record<string, string> = {
  received: 'text-blue-400 bg-blue-400/10',
  diagnosed: 'text-violet-400 bg-violet-400/10',
  parts_pending: 'text-amber-400 bg-amber-400/10',
  in_progress: 'text-sky-400 bg-sky-400/10',
  ready: 'text-emerald-400 bg-emerald-400/10',
  completed: 'text-slate-400 bg-slate-400/10',
  cancelled: 'text-red-400 bg-red-400/10',
};

export const TRANSACTION_STATUS_COLORS: Record<string, string> = {
  verified: 'text-emerald-400 bg-emerald-400/10',
  pending: 'text-amber-400 bg-amber-400/10',
  needs_review: 'text-red-400 bg-red-400/10',
  failed: 'text-red-500 bg-red-500/10',
};

export const SALE_STATUS_COLORS: Record<string, string> = {
  completed: 'text-emerald-400 bg-emerald-400/10',
  pending_payment: 'text-amber-400 bg-amber-400/10',
  packing: 'text-blue-400 bg-blue-400/10',
  cancelled: 'text-red-400 bg-red-400/10',
  refunded: 'text-slate-400 bg-slate-400/10',
};
