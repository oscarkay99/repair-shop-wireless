import { useEffect } from 'react';
import { usePageTitle } from '@/context/PageTitleContext';
import { HardHat, Plus, Star, CheckCircle2, Clock } from 'lucide-react';

const MOCK_TECHS = [
  { id: 'T001', name: 'Ama Boateng', specialty: 'iPhone & iOS', tickets: 12, completed: 45, rating: 4.9, status: 'Available' },
  { id: 'T002', name: 'Joe Asante', specialty: 'Android & Samsung', tickets: 8, completed: 38, rating: 4.7, status: 'Busy' },
  { id: 'T003', name: 'Yaw Frimpong', specialty: 'General Repairs', tickets: 5, completed: 29, rating: 4.6, status: 'Available' },
  { id: 'T004', name: 'Adjoa Mensah', specialty: 'Motherboard & Logic', tickets: 3, completed: 21, rating: 4.8, status: 'Off Duty' },
];

const statusStyle: Record<string, { bg: string; color: string }> = {
  Available: { bg: 'hsl(var(--status-ready-bg))',       color: 'hsl(var(--status-ready))' },
  Busy:      { bg: 'hsl(var(--status-in-progress-bg))', color: 'hsl(var(--status-in-progress))' },
  'Off Duty':{ bg: 'hsl(var(--status-completed-bg))',   color: 'hsl(var(--status-completed))' },
};

export default function TechniciansPage() {
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle({ title: 'Technicians', subtitle: 'Manage repair technicians and workloads' });
    return () => setPageTitle({ title: 'Dashboard' });
  }, [setPageTitle]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {MOCK_TECHS.length} technicians registered
        </p>
        <button
          className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-xs font-semibold text-white"
          style={{ background: 'hsl(var(--primary))' }}
        >
          <Plus className="w-3.5 h-3.5" /> Add Technician
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MOCK_TECHS.map((tech) => {
          const s = statusStyle[tech.status] ?? statusStyle['Available'];
          return (
            <div
              key={tech.id}
              className="rounded-xl border p-4 space-y-3 cursor-pointer transition-colors"
              style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--primary) / 0.4)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border))'; }}
            >
              <div className="flex items-start justify-between">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: 'hsl(0 80% 20%)' }}
                >
                  {tech.name.split(' ').map(n => n[0]).join('')}
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{ background: s.bg, color: s.color }}
                >
                  {tech.status}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{tech.name}</p>
                <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{tech.specialty}</p>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>{tech.tickets} active</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3" style={{ color: 'hsl(38 90% 65%)' }} />
                  <span style={{ color: 'hsl(var(--foreground))' }}>{tech.rating}</span>
                </div>
              </div>
              <div
                className="pt-2 border-t text-xs flex items-center gap-1"
                style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
              >
                <CheckCircle2 className="w-3 h-3" style={{ color: 'hsl(var(--status-ready))' }} />
                {tech.completed} completed all-time
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
