export const APP_NAME = 'Wireless';
export const APP_FULL_NAME = 'Wireless Command Center';
export const COMPANY_NAME = 'Wireless';
export const SUPPORT_WHATSAPP = '+233 24 000 0000';
export const CURRENCY = 'GHS';

export const COLORS = {
  primary:   '#EC0118',
  primaryDk: '#BD0113',
  accent:    '#C84015',
  ink:       '#0F172A',
  amber:     '#F59E0B',
  emerald:   '#10B981',
  cyan:      '#06B6D4',
  surface:   '#ffffff',
  border:    'rgba(15,23,42,0.07)',
} as const;

export const SEGMENT_COLORS: Record<string, string> = {
  VIP:      'text-amber-600 bg-amber-50',
  Repeat:   'text-cyan-600 bg-cyan-50',
  New:      'text-emerald-600 bg-emerald-50',
  'At-Risk':'text-red-500 bg-red-50',
};

export const LEAD_STATUS_COLORS: Record<string, string> = {
  hot:  'text-red-500 bg-red-50',
  warm: 'text-amber-600 bg-amber-50',
  cold: 'text-slate-500 bg-slate-100',
};

export const REPAIR_STATUS_COLORS: Record<string, string> = {
  received:      'text-slate-500 bg-slate-100',
  diagnosed:     'text-amber-600 bg-amber-50',
  parts_pending: 'text-red-500 bg-red-50',
  in_progress:   'text-cyan-600 bg-cyan-50',
  ready:         'text-emerald-600 bg-emerald-50',
  completed:     'text-slate-400 bg-slate-50',
  cancelled:     'text-red-400 bg-red-50',
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
