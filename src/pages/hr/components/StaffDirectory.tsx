import { useEffect, useState } from 'react';
import { getWirelessUsers, type WirelessProfile } from '@/services/wireless/users';
import { roleLabels, roleColors } from '@/mocks/users';

interface Props {
  onSelectStaff: (staff: WirelessProfile) => void;
}

export default function StaffDirectory({ onSelectStaff }: Props) {
  const [staff, setStaff] = useState<WirelessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getWirelessUsers().then(setStaff).catch(() => setStaff([])).finally(() => setLoading(false));
  }, []);

  const filtered = staff.filter(s => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.role.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search staff by name, email, or role…"
          className="w-full h-10 pl-9 pr-3 rounded-xl text-sm outline-none"
          style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
        />
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
        {loading ? (
          <p className="text-xs p-6 text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading staff…</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs p-6 text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>No staff found</p>
        ) : (
          <div className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
            {filtered.map(s => {
              const roleColor = roleColors[s.role] ?? '#EC0118';
              const roleLabel = roleLabels[s.role] ?? s.role;
              return (
                <button key={s.id} onClick={() => onSelectStaff(s)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-[hsl(var(--muted))]/50 transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${roleColor}, ${roleColor}CC)` }}>
                    {s.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>{s.name}</p>
                    <p className="text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.email}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold text-white whitespace-nowrap flex-shrink-0" style={{ background: roleColor }}>
                    {roleLabel}
                  </span>
                  <i className="ri-arrow-right-s-line flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
