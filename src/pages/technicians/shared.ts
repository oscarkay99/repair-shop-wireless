export const AVATAR_COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#f97316'];

export function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

export const TIMELINE_FILTERS = ['1hr', '2hrs', '3hrs', '4hrs', '24hrs', '48hrs', '72hrs', 'All'] as const;
export type TimelineFilter = typeof TIMELINE_FILTERS[number];

export function filterHours(f: TimelineFilter): number | null {
  if (f === 'All') return null;
  return parseInt(f);
}
