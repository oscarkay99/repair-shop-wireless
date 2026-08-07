import { useState, useEffect } from 'react';
import { getUpcomingBirthdays } from '@/services/wireless/users';
import type { UserRole } from '@/hooks/useAuth';
import { daysUntilNextBirthday, birthdayLabel } from '@/utils/birthdays';

export interface UpcomingBirthday {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
  daysUntil: number;
  label: string;
}

/** Staff whose birthday falls within the next `windowDays` days, soonest first. */
export function useUpcomingBirthdays(windowDays = 14): UpcomingBirthday[] {
  const [birthdays, setBirthdays] = useState<UpcomingBirthday[]>([]);

  useEffect(() => {
    let cancelled = false;
    getUpcomingBirthdays().then(rows => {
      if (cancelled) return;
      const now = new Date();
      const upcoming = rows
        .map(r => {
          // profiles.birthday is a full date, only its month/day ever matter.
          const d = new Date(r.birthday + 'T00:00');
          const month = d.getMonth() + 1;
          const day = d.getDate();
          const daysUntil = daysUntilNextBirthday(month, day, now);
          return { id: r.id, name: r.name, avatar: r.avatar, role: r.role as UserRole, daysUntil, label: birthdayLabel(daysUntil, month, day) };
        })
        .filter(b => b.daysUntil <= windowDays)
        .sort((a, b) => a.daysUntil - b.daysUntil);
      setBirthdays(upcoming);
    }).catch(() => setBirthdays([]));
    return () => { cancelled = true; };
  }, [windowDays]);

  return birthdays;
}
