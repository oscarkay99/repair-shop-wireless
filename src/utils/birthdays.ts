// Month/day only, deliberately never a year — shared by staff birthdays
// (profiles.birthday, stored as a full date but only ever read for its
// month/day) and customer birthdays (customers.birth_month/birth_day,
// which never had a year to begin with).

export function daysUntilNextBirthday(month: number, day: number, from: Date = new Date()): number {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let next = new Date(today.getFullYear(), month - 1, day);
  if (next < today) next = new Date(today.getFullYear() + 1, month - 1, day);
  return Math.round((next.getTime() - today.getTime()) / 86_400_000);
}

export function formatMonthDay(month: number, day: number): string {
  return new Date(2000, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function birthdayLabel(daysUntil: number, month: number, day: number): string {
  if (daysUntil === 0) return 'Today!';
  if (daysUntil === 1) return 'Tomorrow';
  return `${formatMonthDay(month, day)} · in ${daysUntil} days`;
}
