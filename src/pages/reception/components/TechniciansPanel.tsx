import { useMemo, useState } from 'react';
import { Search, Star } from 'lucide-react';
import { useTechnicians } from '@/hooks/useTechnicians';
import { useRepairs } from '@/hooks/useRepairs';
import { isCurrentlyUnavailable } from '@/utils/technicianAvailability';
import { isActiveRepairStatus } from '@/utils/repairStatus';

const AVATAR_COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#f97316'];
function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

export default function TechniciansPanel() {
  const { technicians, loading } = useTechnicians();
  const { repairs } = useRepairs();
  const [query, setQuery] = useState('');

  const filtered = technicians.filter(t => !query.trim() || t.name.toLowerCase().includes(query.toLowerCase()) || t.specialty.toLowerCase().includes(query.toLowerCase()));

  const loadOf = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of repairs) {
      if (!isActiveRepairStatus(r.status)) continue;
      for (const t of r.technicians) map.set(t.id, (map.get(t.id) ?? 0) + 1);
    }
    return map;
  }, [repairs]);

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'hsl(var(--muted-foreground))' }} />
        <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search technicians..."
          className="h-9 pl-8 pr-3 w-full sm:w-64 rounded-lg text-xs outline-none"
          style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
      </div>

      {loading ? (
        <p className="py-16 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="py-16 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No technicians found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => {
            const unavailable = isCurrentlyUnavailable(t);
            const activeJobs = loadOf.get(t.id) ?? 0;
            return (
              <div key={t.id} className="rounded-2xl p-4" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: avatarColor(t.name) }}>
                    {initials(t.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: 'hsl(var(--foreground))' }}>{t.name}</p>
                    <p className="text-[11px] truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{t.specialty || 'General Repairs'}</p>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0"
                    style={unavailable
                      ? { background: 'rgba(239,68,68,0.12)', color: '#ef4444' }
                      : { background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}
                  >
                    {unavailable ? 'Unavailable' : 'Available'}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid hsl(var(--border))' }}>
                  <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{activeJobs} active job{activeJobs === 1 ? '' : 's'}</span>
                  {t.rating > 0 && (
                    <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                      <Star className="w-3 h-3" style={{ color: '#f59e0b', fill: '#f59e0b' }} /> {t.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
