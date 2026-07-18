import { useState, useEffect } from 'react';
import { getUpcomingBirthdays } from '@/services/wireless/users';
import type { UserRole } from '@/hooks/useAuth';

export interface UpcomingBirthday {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
  daysUntil: number;
  label: string;
}

function daysUntilNextBirthday(dateStr: string, from: Date): number {
  const d = new Date(dateStr + 'T00:00');
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
  if (next < today) next = new Date(today.getFullYear() + 1, d.getMonth(), d.getDate());
  return Math.round((next.getTime() - today.getTime()) / 86_400_000);
}

function formatMonthDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function daysLabel(daysUntil: number, dateStr: string): string {
  if (daysUntil === 0) return 'Today!';
  if (daysUntil === 1) return 'Tomorrow';
  return `${formatMonthDay(dateStr)} · in ${daysUntil} days`;
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
          const daysUntil = daysUntilNextBirthday(r.birthday, now);
          return { id: r.id, name: r.name, avatar: r.avatar, role: r.role as UserRole, daysUntil, label: daysLabel(daysUntil, r.birthday) };
        })
        .filter(b => b.daysUntil <= windowDays)
        .sort((a, b) => a.daysUntil - b.daysUntil);
      setBirthdays(upcoming);
    }).catch(() => setBirthdays([]));
    return () => { cancelled = true; };
  }, [windowDays]);

  return birthdays;
}
