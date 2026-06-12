import { useEffect } from 'react';
import { usePageTitle } from '@/context/PageTitleContext';
import { ExternalLink, Search, ClipboardList, Clock, CheckCircle2 } from 'lucide-react';

export default function CustomerPortalPage() {
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle({ title: 'Customer Portal', subtitle: 'Self-service portal for customers to track repairs' });
    return () => setPageTitle({ title: 'Dashboard' });
  }, [setPageTitle]);

  return (
    <div className="space-y-6">
      {/* Portal search */}
      <div
        className="rounded-xl border p-6 text-center space-y-4"
        style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto"
          style={{ background: 'hsl(0 80% 12%)' }}
        >
          <ExternalLink className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
        </div>
        <div>
          <h2 className="text-base font-bold" style={{ color: 'hsl(var(--foreground))' }}>Track Your Repair</h2>
          <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Enter your ticket ID or phone number to check repair status
          </p>
        </div>
        <div className="flex items-center gap-2 max-w-md mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <input
              type="text"
              placeholder="e.g. TK-001 or +233..."
              className="w-full h-10 pl-9 pr-3 rounded-lg text-sm outline-none"
              style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            />
          </div>
          <button
            className="h-10 px-4 rounded-lg text-sm font-semibold text-white"
            style={{ background: 'hsl(var(--primary))' }}
          >
            Track
          </button>
        </div>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: ClipboardList, label: 'Ticket Received', desc: 'Your device is logged and queued', step: '01' },
          { icon: Clock,         label: 'Under Repair',    desc: 'Technician is working on your device', step: '02' },
          { icon: CheckCircle2,  label: 'Ready for Pickup',desc: 'Device repaired and waiting for you', step: '03' },
        ].map((item) => (
          <div
            key={item.step}
            className="rounded-xl border p-4 space-y-2"
            style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
          >
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold font-mono" style={{ color: 'hsl(var(--primary))' }}>{item.step}</span>
              <item.icon className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{item.label}</p>
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
