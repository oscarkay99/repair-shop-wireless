import { useMemo } from 'react';
import type { WCustomer } from '@/types/wireless';
import { daysUntilNextBirthday, birthdayLabel } from '@/utils/birthdays';

export interface UpcomingCustomerBirthday {
  id: string;
  name: string;
  phone: string;
  daysUntil: number;
  label: string;
}

/** Customers whose birthday falls within the next `windowDays` days, soonest
 *  first — computed from whatever `customers` the caller already has loaded,
 *  same pattern as useStaleTickets/useEtaReminders (no extra fetch). */
export function useUpcomingCustomerBirthdays(customers: WCustomer[], windowDays = 14): UpcomingCustomerBirthday[] {
  return useMemo(() => {
    const now = new Date();
    return customers
      .filter((c): c is WCustomer & { birth_month: number; birth_day: number } => !!c.birth_month && !!c.birth_day)
      .map(c => {
        const daysUntil = daysUntilNextBirthday(c.birth_month, c.birth_day, now);
        return { id: c.id, name: c.name, phone: c.phone, daysUntil, label: birthdayLabel(daysUntil, c.birth_month, c.birth_day) };
      })
      .filter(b => b.daysUntil <= windowDays)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [customers, windowDays]);
}
