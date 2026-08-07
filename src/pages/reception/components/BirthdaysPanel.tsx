import { useState } from 'react';
import { Cake, Phone } from 'lucide-react';
import { useUpcomingBirthdays } from '@/hooks/useUpcomingBirthdays';
import { useUpcomingCustomerBirthdays } from '@/hooks/useUpcomingCustomerBirthdays';
import { useWirelessCustomers } from '@/hooks/useWirelessCustomers';

type SubTab = 'clients' | 'staff';

export default function BirthdaysPanel() {
  const [subTab, setSubTab] = useState<SubTab>('staff');
  const upcoming = useUpcomingBirthdays(30);
  const { customers } = useWirelessCustomers();
  const upcomingClients = useUpcomingCustomerBirthdays(customers, 30);
  const total = upcoming.length + upcomingClients.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>Birthday Reminders</p>
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Clients &amp; staff in the next 30 days</p>
        </div>
        <span className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
          {total} upcoming
        </span>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ background: 'rgba(245,158,11,0.1)', borderBottom: '1px solid rgba(245,158,11,0.25)' }}>
          <div className="flex items-center gap-2">
            <Cake className="w-4 h-4" style={{ color: '#d97706' }} />
            <p className="text-sm font-bold" style={{ color: '#d97706' }}>Birthday Reminders</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: 'rgba(245,158,11,0.2)', color: '#d97706' }}>
            Next 30 days
          </span>
        </div>

        <div className="flex items-center" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <button
            onClick={() => setSubTab('clients')}
            className="flex-1 py-3 text-sm font-semibold text-center border-b-2 -mb-px transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            style={{ color: subTab === 'clients' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))', borderColor: subTab === 'clients' ? 'hsl(var(--primary))' : 'transparent' }}
          >
            Clients
            {upcomingClients.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold text-white" style={{ background: 'hsl(var(--primary))' }}>
                {upcomingClients.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setSubTab('staff')}
            className="flex-1 py-3 text-sm font-semibold text-center border-b-2 -mb-px transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            style={{ color: subTab === 'staff' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))', borderColor: subTab === 'staff' ? 'hsl(var(--primary))' : 'transparent' }}
          >
            Staff
            {upcoming.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold text-white" style={{ background: 'hsl(var(--primary))' }}>
                {upcoming.length}
              </span>
            )}
          </button>
        </div>

        <div className="p-4">
          {subTab === 'clients' ? (
            upcomingClients.length === 0 ? (
              <p className="text-xs py-8 text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>No client birthdays in the next 30 days.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Upcoming</p>
                {upcomingClients.map(b => (
                  <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'hsl(var(--muted))' }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: '#22c55e' }}>
                      {b.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: 'hsl(var(--foreground))' }}>{b.name}</p>
                      <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{b.label}</p>
                    </div>
                    {b.phone && (
                      <a href={`tel:${b.phone}`}
                        className="h-7 px-2.5 inline-flex items-center gap-1 rounded-lg text-[10px] font-semibold flex-shrink-0"
                        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
                        <Phone className="w-3 h-3" /> Call
                      </a>
                    )}
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold flex-shrink-0" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
                      {b.daysUntil}d
                    </span>
                  </div>
                ))}
              </div>
            )
          ) : upcoming.length === 0 ? (
            <p className="text-xs py-8 text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>No staff birthdays in the next 30 days.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Upcoming</p>
              {upcoming.map(b => (
                <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'hsl(var(--muted))' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: '#22c55e' }}>
                    {b.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: 'hsl(var(--foreground))' }}>{b.name}</p>
                    <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{b.label}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold flex-shrink-0" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
                    {b.daysUntil}d
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
