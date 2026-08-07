import { Cake, Phone } from 'lucide-react';
import { useWirelessCustomers } from '@/hooks/useWirelessCustomers';
import { useUpcomingCustomerBirthdays } from '@/hooks/useUpcomingCustomerBirthdays';

function joinNames(names: string[]) {
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

const WINDOW_DAYS = 7;

/** Same "it's their birthday today" treatment as the staff BirthdayBanner,
 *  plus a heads-up for the next few days — a customer birthday is a reason
 *  to call, not just an office nicety, so it's worth flagging before the day
 *  arrives, not only on it. */
export default function CustomerBirthdayBanner() {
  const { customers } = useWirelessCustomers();
  const upcoming = useUpcomingCustomerBirthdays(customers, WINDOW_DAYS);
  if (upcoming.length === 0) return null;

  const today = upcoming.filter(b => b.daysUntil === 0);
  const laterThisWeek = upcoming.filter(b => b.daysUntil > 0);

  return (
    <div className="rounded-2xl mb-6 overflow-hidden" style={{ border: '1px solid rgba(245,158,11,0.3)' }}>
      {today.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'rgba(245,158,11,0.1)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#f59e0b' }}>
            <Cake className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: '#d97706' }}>
              It's {joinNames(today.map(b => b.name.split(' ')[0]))}'s {today.length > 1 ? 'birthdays' : 'birthday'} today!
            </p>
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {today.length > 1 ? 'Give them a call to wish them well.' : 'Give them a call to wish them a happy birthday.'}
            </p>
          </div>
          {today.length === 1 && today[0].phone && (
            <a href={`tel:${today[0].phone}`}
              className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
              style={{ background: '#f59e0b', color: 'white' }}>
              <Phone className="w-3.5 h-3.5" /> Call
            </a>
          )}
        </div>
      )}
      {laterThisWeek.length > 0 && (
        <div className="px-4 py-2.5 space-y-1.5" style={{ background: 'rgba(245,158,11,0.04)', borderTop: today.length > 0 ? '1px solid rgba(245,158,11,0.2)' : undefined }}>
          {laterThisWeek.map(b => (
            <div key={b.id} className="flex items-center gap-2 text-xs">
              <Cake className="w-3 h-3 flex-shrink-0" style={{ color: '#d97706' }} />
              <span style={{ color: 'hsl(var(--foreground))' }}>{b.name}'s birthday {b.daysUntil === 1 ? 'is tomorrow' : `is in ${b.daysUntil} days`}</span>
              {b.phone && (
                <a href={`tel:${b.phone}`} className="ml-auto flex-shrink-0" style={{ color: '#d97706' }}>
                  <Phone className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
