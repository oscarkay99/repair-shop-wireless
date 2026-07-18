import { Cake } from 'lucide-react';
import { useUpcomingBirthdays } from '@/hooks/useUpcomingBirthdays';

function joinNames(names: string[]) {
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

export default function BirthdayBanner() {
  const todaysBirthdays = useUpcomingBirthdays(0);
  if (todaysBirthdays.length === 0) return null;

  const names = todaysBirthdays.map(b => b.name.split(' ')[0]);
  const isMultiple = names.length > 1;

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-6"
      style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#f59e0b' }}>
        <Cake className="w-4.5 h-4.5 text-white" />
      </div>
      <div>
        <p className="text-sm font-bold" style={{ color: '#d97706' }}>
          It's {joinNames(names)}'s {isMultiple ? 'birthdays' : 'birthday'} today!
        </p>
        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {isMultiple ? 'Take a moment to wish them well.' : 'Take a moment to wish them a happy birthday.'}
        </p>
      </div>
    </div>
  );
}
