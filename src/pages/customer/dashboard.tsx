import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, RefreshCw, Clock, Wrench, CheckCircle2, Package, AlertCircle, Wifi } from 'lucide-react';
import { useCustomerPortal } from '@/hooks/useCustomerPortal';
import { isSupabaseConfigured } from '@/services/supabase';
import type { Repair, RepairStatus } from '@/types/repair';
import { REPAIR_STATUS_META, isActiveRepairStatus } from '@/utils/repairStatus';

// ── Status pipeline (customer-facing, collapsed to 4 steps) ───────────────

interface Step { label: string; statuses: RepairStatus[]; icon: React.ElementType; color: string }

const STEPS: Step[] = [
  { label: 'Received',  statuses: ['received', 'diagnosis_paid'],                                       icon: Package,      color: '#6366f1' },
  { label: 'In Repair', statuses: ['diagnosing', 'awaiting_approval', 'parts_pending', 'in_progress'],   icon: Wrench,       color: '#f59e0b' },
  { label: 'Ready',     statuses: ['ready'],                                                             icon: CheckCircle2, color: '#22c55e' },
  { label: 'Collected', statuses: ['completed', 'diagnosis_only_closed'],                                icon: CheckCircle2, color: '#22c55e' },
];

function getStepIndex(status: RepairStatus): number {
  if (status === 'cancelled') return -1;
  const i = STEPS.findIndex(step => step.statuses.includes(status));
  return i === -1 ? 0 : i;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Repair Card ───────────────────────────────────────────────────────────

function RepairCard({ repair }: { repair: Repair }) {
  const currentStep = getStepIndex(repair.status);
  const meta = REPAIR_STATUS_META[repair.status];
  const receivedAt = repair.createdAt ?? repair.started;
  const cost = repair.costNum ?? repair.quoteAmount;

  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold font-mono" style={{ color: 'hsl(var(--primary))' }}>
              {repair.id}
            </span>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ background: meta.bg, color: meta.color }}
            >
              {meta.label}
            </span>
          </div>
          <p className="text-base font-bold" style={{ color: 'hsl(var(--foreground))' }}>
            {repair.device}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {repair.issue}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Dropped off</p>
          <p className="text-xs font-medium mt-0.5" style={{ color: 'hsl(var(--foreground))' }}>
            {fmtDate(receivedAt)}
          </p>
        </div>
      </div>

      {/* Progress stepper */}
      {repair.status !== 'cancelled' && (
        <div className="flex items-center gap-0">
          {STEPS.map((step, i) => {
            const done = currentStep > i;
            const active = currentStep === i;
            const Icon = step.icon;
            return (
              <div key={step.label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: done || active ? step.color : 'hsl(var(--muted))',
                      opacity: done ? 0.7 : 1,
                    }}
                  >
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span
                    className="text-[9px] font-medium whitespace-nowrap"
                    style={{ color: done || active ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}
                  >
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className="flex-1 h-0.5 mb-4 mx-1"
                    style={{ background: done ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Diagnosis note */}
      {repair.diagnosisSummary && (
        <div
          className="rounded-xl px-4 py-3 text-xs"
          style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
        >
          <p className="font-semibold mb-0.5" style={{ color: 'hsl(var(--foreground))' }}>Technician Note</p>
          {repair.diagnosisSummary}
        </div>
      )}

      {/* Footer: technician + cost */}
      <div className="flex items-center justify-between pt-1" style={{ borderTop: '1px solid hsl(var(--border))' }}>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {repair.completedDate ? `Completed ${fmtDate(repair.completedDate)}` : 'In progress'}
          </span>
        </div>
        {cost != null && cost > 0 && (
          <span className="text-xs font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
            Est. ¢{cost.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { customer, repairs, loading, signOut, reload } = useCustomerPortal();

  useEffect(() => {
    if (!customer) navigate('/customer/login', { replace: true });
  }, [customer, navigate]);

  if (!customer) return null;

  const active    = repairs.filter(r => isActiveRepairStatus(r.status));
  const completed = repairs.filter(r => r.status === 'completed' || r.status === 'diagnosis_only_closed');
  const ready     = repairs.filter(r => r.status === 'ready');

  const handleSignOut = async () => {
    await signOut();
    navigate('/customer/login', { replace: true });
  };

  return (
    <div className="min-h-screen" style={{ background: 'hsl(var(--background))' }}>
      {/* Header */}
      <header
        className="h-14 flex items-center justify-between px-6 sticky top-0 z-10"
        style={{ background: 'hsl(var(--card))', borderBottom: '1px solid hsl(var(--border))' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'hsl(0 80% 12%)' }}
          >
            <span className="text-sm font-black" style={{ color: 'hsl(var(--primary))' }}>W</span>
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: 'hsl(var(--foreground))' }}>WIRELESS</p>
            <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>Customer Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isSupabaseConfigured && (
            <div className="flex items-center gap-1">
              <Wifi className="w-3 h-3" style={{ color: '#22c55e' }} />
              <span className="text-[10px]" style={{ color: '#22c55e' }}>Live</span>
            </div>
          )}
          <button
            onClick={() => reload()}
            className="w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ color: 'hsl(var(--muted-foreground))' }}
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'hsl(var(--primary))' }}
            >
              {customer.name.charAt(0)}
            </div>
            <span className="text-xs font-medium hidden sm:block" style={{ color: 'hsl(var(--foreground))' }}>
              {customer.name}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-xs px-3 h-8 rounded-lg"
            style={{ color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Welcome + summary */}
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>
            Hello, {customer.name.split(' ')[0]}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {repairs.length === 0
              ? 'No repair records found for your account.'
              : `You have ${active.length} active repair${active.length !== 1 ? 's' : ''}.`}
          </p>
        </div>

        {/* Ready for pickup banner */}
        {ready.length > 0 && (
          <div
            className="rounded-2xl px-5 py-4 flex items-center gap-3"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: '#22c55e' }} />
            <div>
              <p className="text-sm font-bold" style={{ color: '#22c55e' }}>
                {ready.length === 1 ? 'Your device is ready!' : `${ready.length} devices are ready!`}
              </p>
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Please visit the shop to collect your device.
              </p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="py-12 text-center">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading your repairs…</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && repairs.length === 0 && (
          <div
            className="rounded-2xl p-10 text-center"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
          >
            <AlertCircle className="w-8 h-8 mx-auto mb-3" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>No repairs yet</p>
            <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              When you bring in a device, your repair status will appear here.
            </p>
          </div>
        )}

        {/* Active repairs */}
        {!loading && active.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Active Repairs
            </h3>
            {active.map(r => <RepairCard key={r.id} repair={r} />)}
          </section>
        )}

        {/* Completed repairs */}
        {!loading && completed.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Past Repairs
            </h3>
            {completed.map(r => <RepairCard key={r.id} repair={r} />)}
          </section>
        )}

        {/* Realtime hint */}
        {isSupabaseConfigured && (
          <p className="text-center text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Status updates automatically when your technician makes progress.
          </p>
        )}
      </main>
    </div>
  );
}
