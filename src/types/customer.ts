export type CustomerSegment = 'VIP' | 'Repeat' | 'New' | 'At-Risk';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  websiteAuthUserId?: string;
  hasWebsiteAccount?: boolean;
  source?: 'website' | 'admin' | 'imported';
  segment: CustomerSegment;
  ltv: string;
  orders: number;
  lastOrder: string;
  avgOrder: string;
  warranties: number;
  repairs: number;
  since: string;
}

export interface CustomerStat {
  label: string;
  value: string;
  change: string;
  icon: string;
  accent: string;
}
