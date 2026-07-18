import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { usePageTitle } from '@/context/PageTitleContext';
import { useTechnicians } from '@/hooks/useTechnicians';
import { useRepairs } from '@/hooks/useRepairs';
import Pagination from '@/components/shared/Pagination';
import { Clock, Trash2, UserPlus, X, RefreshCw, Pencil } from 'lucide-react';
import type { Technician } from '@/types/wireless';
import { REPAIR_STATUS_META, isActiveRepairStatus } from '@/utils/repairStatus';

const PAGE_SIZE = 9;

// ── helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#f97316'];
function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

function timeOnJob(receivedAt: string): string {
  const ms = Date.now() - new Date(receivedAt).getTime();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

// ── Timeline filter ───────────────────────────────────────────────────────────

const TIMELINE_FILTERS = ['1hr', '2hrs', '3hrs', '4hrs', '24hrs', '48hrs', '72hrs', 'All'] as const;
type TimelineFilter = typeof TIMELINE_FILTERS[number];

function filterHours(f: TimelineFilter): number | null {
  if (f === 'All') return null;
  return parseInt(f);
}

// ── Add Technician Modal ──────────────────────────────────────────────────────

function AddTechnicianModal({ onSave, onClose }: {
  onSave: (t: Omit<Technician, 'id' | 'rating' | 'total_completed' | 'created_at' | 'updated_at'>) => Promise<unknown>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', specialty: '', status: 'available' as Technician['status'] });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setSaving(true);
    try { await onSave(form); onClose(); }
    finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>New Technician</p>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
            <X className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          {[
            { key: 'name',      label: 'Full Name *',  type: 'text', required: true },
            { key: 'phone',     label: 'Phone *',      type: 'tel',  required: true },
            { key: 'email',     label: 'Email',        type: 'email',required: false },
            { key: 'specialty', label: 'Specialty',    type: 'text', required: false },
          ].map(f => (
            <div key={f.key}>
              <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{f.label}</label>
              <input required={f.required} type={f.type} value={(form as Record<string,string>)[f.key]}
                onChange={e => set(f.key, e.target.value)}
                className="w-full h-9 px-3 rounded-lg text-sm outline-none"
                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 h-9 rounded-lg text-xs font-semibold"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 h-9 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
              style={{ background: 'hsl(var(--primary))' }}>{saving ? 'Saving…' : 'Add Technician'}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ── Edit Technician Modal ─────────────────────────────────────────────────────

function EditTechnicianModal({ technician, onSave, onClose }: {
  technician: Technician;
  onSave: (id: string, data: Partial<Technician>) => Promise<unknown>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: technician.name,
    phone: technician.phone,
    email: technician.email,
    specialty: technician.specialty,
    status: technician.status,
    leave_until: technician.leave_until ?? '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setSaving(true);
    try {
      await onSave(technician.id, {
        name: form.name,
        phone: form.phone,
        email: form.email,
        specialty: form.specialty,
        status: form.status,
        leave_until: form.status === 'off_duty' ? (form.leave_until || null) : null,
      });
      onClose();
    } finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Edit Technician</p>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
            <X className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Full Name *</label>
            <input required value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full h-9 px-3 rounded-lg text-sm outline-none"
              style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Phone *</label>
              <input required type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                className="w-full h-9 px-3 rounded-lg text-sm outline-none"
                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                className="w-full h-9 px-3 rounded-lg text-sm outline-none"
                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Specialty</label>
            <input value={form.specialty} onChange={e => set('specialty', e.target.value)}
              className="w-full h-9 px-3 rounded-lg text-sm outline-none"
              style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full h-9 px-3 rounded-lg text-sm outline-none"
                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="off_duty">Off Duty</option>
              </select>
            </div>
            {form.status === 'off_duty' && (
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Back On</label>
                <input type="date" value={form.leave_until} onChange={e => set('leave_until', e.target.value)}
                  className="w-full h-9 px-3 rounded-lg text-sm outline-none"
                  style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 h-9 rounded-lg text-xs font-semibold"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 h-9 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
              style={{ background: 'hsl(var(--primary))' }}>{saving ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ── Reassign Modal ────────────────────────────────────────────────────────────

function ReassignModal({ technicians, onClose }: { technicians: Technician[]; onClose: () => void }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Reassign Jobs</p>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
            <X className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        </div>
        <div className="px-5 py-6 text-center">
          <RefreshCw className="w-10 h-10 mx-auto mb-3" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <p className="text-sm font-semibold mb-1" style={{ color: 'hsl(var(--foreground))' }}>Bulk Reassign</p>
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Select repair jobs from the technician cards and use drag-and-drop to reassign.
            {technicians.length > 0 && ` ${technicians.length} technician${technicians.length > 1 ? 's' : ''} available.`}
          </p>
          <button onClick={onClose} className="mt-4 px-4 h-8 rounded-lg text-xs font-semibold"
            style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>Close</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TechniciansPage() {
  const { setPageTitle } = usePageTitle();
  const { technicians, loading, add, patch, remove } = useTechnicians();
  const { repairs } = useRepairs();
  const [timeline, setTimeline] = useState<TimelineFilter>('24hrs');
  const [showAdd, setShowAdd] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [editingTech, setEditingTech] = useState<Technician | null>(null);
  const [page, setPage] = useState(1);

  const activeTechs  = technicians.filter(t => t.status === 'busy').length;
  const totalInQueue = useMemo(() =>
    repairs.filter(r => isActiveRepairStatus(r.status)).length,
  [repairs]);
  const unassigned = useMemo(() =>
    repairs.filter(r => isActiveRepairStatus(r.status) && !r.technician).length,
  [repairs]);

  useEffect(() => {
    setPageTitle({
      title: 'Technicians',
      subtitle: `${activeTechs} active · ${technicians.length} total`,
      action: { label: 'Add Technician', onClick: () => setShowAdd(true) },
      secondaryAction: { label: 'Reassign', onClick: () => setShowReassign(true) },
    });
  }, [technicians.length, activeTechs, setPageTitle]);

  const doneHours = filterHours(timeline);
  const doneLabel = timeline === 'All' ? 'Done (all)' : `Done (${timeline})`;

  const maxLoad = useMemo(() => {
    const loads = technicians.map(tech =>
      repairs.filter(r => r.technician === tech.name && isActiveRepairStatus(r.status)).length
    );
    return Math.max(1, ...loads);
  }, [technicians, repairs]);

  const techStats = useMemo(() => {
    return technicians.map(tech => {
      const myRepairs  = repairs.filter(r => r.technician === tech.name);
      const current    = myRepairs.find(r => r.status === 'in_progress') ?? null;
      const queue      = myRepairs.filter(r => r.status !== 'in_progress' && isActiveRepairStatus(r.status));
      const activeLoad = myRepairs.filter(r => isActiveRepairStatus(r.status)).length;
      const cutoff     = doneHours ? new Date(Date.now() - doneHours * 3_600_000) : null;
      const doneRepairs = myRepairs.filter(r =>
        (r.status === 'completed' || r.status === 'diagnosis_only_closed') && r.completedDate &&
        (!cutoff || new Date(r.completedDate) >= cutoff)
      );
      const done = doneRepairs.length;

      // avg completion time in hours (createdAt/started → completedDate)
      const completedAll = myRepairs.filter(r => (r.status === 'completed' || r.status === 'diagnosis_only_closed') && r.completedDate);
      const avgCompletionHrs = completedAll.length
        ? completedAll.reduce((s, r) => s + (new Date(r.completedDate!).getTime() - new Date(r.createdAt ?? r.started).getTime()), 0)
          / completedAll.length / 3_600_000
        : null;

      return { tech, current, queue, done, activeLoad, avgCompletionHrs };
    });
  }, [technicians, repairs, doneHours]);

  useEffect(() => { setPage(1); }, [technicians.length]);

  const pagedTechStats = useMemo(() =>
    techStats.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  [techStats, page]);

  return (
    <div className="space-y-5">

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Technicians',      value: loading ? '…' : technicians.length },
          { label: 'Currently Active', value: loading ? '…' : activeTechs },
          { label: 'In Queue',         value: totalInQueue },
          { label: 'Unassigned',       value: unassigned },
        ].map(s => (
          <div key={s.label} className="rounded-xl border px-5 py-4"
            style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.label}</p>
            <p className="text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Timeline filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Timeline
        </span>
        {TIMELINE_FILTERS.map(f => (
          <button key={f} onClick={() => setTimeline(f)}
            className="px-3 h-7 rounded-full text-xs font-semibold transition-colors"
            style={timeline === f
              ? { background: 'hsl(var(--foreground))', color: 'hsl(var(--background))' }
              : { background: 'transparent', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}>
            {f}
          </button>
        ))}
      </div>

      {/* Technician cards */}
      {loading ? (
        <div className="text-center py-16 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pagedTechStats.map(({ tech, current, queue, done, activeLoad, avgCompletionHrs }) => {
            const isActive   = tech.status === 'busy';
            const color      = avatarColor(tech.name);
            const loadPct    = Math.round((activeLoad / maxLoad) * 100);
            const isOverload = loadPct >= 80;
            const avgLabel   = avgCompletionHrs !== null
              ? avgCompletionHrs < 24
                ? `${Math.round(avgCompletionHrs)}h avg`
                : `${(avgCompletionHrs / 24).toFixed(1)}d avg`
              : null;

            return (
              <div key={tech.id} className="rounded-xl border overflow-hidden relative"
                style={{
                  background: 'hsl(var(--card))',
                  borderColor: isActive ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--border))',
                  borderLeftWidth: isActive ? 3 : 1,
                  borderLeftColor: isActive ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                }}>

                {/* Edit + Delete buttons */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <button
                    onClick={() => setEditingTech(tech)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                    style={{ background: 'hsl(var(--muted))', opacity: 0.6 }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.opacity = '1'; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.opacity = '0.6'; }}
                    title="Edit technician"
                  >
                    <Pencil className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  </button>
                  <button
                    onClick={() => { if (window.confirm(`Remove ${tech.name}?`)) remove(tech.id); }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                    style={{ background: 'hsl(var(--muted))', opacity: 0.4 }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.opacity = '1'; el.style.background = 'hsl(0 60% 15%)'; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.opacity = '0.4'; el.style.background = 'hsl(var(--muted))'; }}
                    title="Remove technician"
                  >
                    <Trash2 className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} />
                  </button>
                </div>

                <div className="p-5">
                  {/* Avatar + name row */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-base font-bold"
                        style={{ background: color }}>
                        {initials(tech.name)}
                      </div>
                      {/* Status dot */}
                      <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-[hsl(var(--card))]"
                        style={{ background: tech.status === 'off_duty' ? '#ef4444' : isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }} />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-base" style={{ color: 'hsl(var(--foreground))' }}>{tech.name}</p>
                        {tech.status === 'off_duty' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: '#ef4444' }}>
                            ON LEAVE{tech.leave_until ? ` · back ${new Date(tech.leave_until + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                          </span>
                        ) : isActive ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: 'hsl(var(--primary))' }}>
                            ACTIVE
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            AVAILABLE
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{tech.specialty || 'General'}</p>
                    </div>
                  </div>

                  {/* Current job */}
                  <div className="mb-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                      style={{ color: 'hsl(var(--muted-foreground))' }}>Current Job</p>
                    {current ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-mono" style={{ color: 'hsl(var(--primary))' }}>
                            {current.id}
                          </span>
                          <span className="text-xs font-semibold" style={{ color: 'hsl(var(--status-in-progress))' }}>
                            In Progress
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                            {current.device}
                          </p>
                          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {current.customer || '—'}
                          </p>
                        </div>
                        {current.issue && (
                          <p className="text-xs line-clamp-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {current.issue}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1">
                          <Clock className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} />
                          <span className="text-xs font-semibold" style={{ color: 'hsl(var(--primary))' }}>
                            {timeOnJob(current.createdAt ?? current.started)} on this job
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-center py-2" style={{ color: 'hsl(var(--muted-foreground))' }}>No active job</p>
                    )}
                  </div>

                  {/* Queue */}
                  {queue.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                        style={{ color: 'hsl(var(--muted-foreground))' }}>
                        Queue ({queue.length})
                      </p>
                      <div className="space-y-1.5">
                        {queue.slice(0, 3).map(r => {
                          const qs = REPAIR_STATUS_META[r.status];
                          return (
                            <div key={r.id} className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-bold font-mono flex-shrink-0" style={{ color: 'hsl(var(--primary))' }}>
                                  {r.id}
                                </span>
                                <span className="text-xs truncate" style={{ color: 'hsl(var(--foreground))' }}>
                                  {r.device}
                                </span>
                              </div>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                                style={{ background: qs.bg, color: qs.color }}>{qs.label}</span>
                            </div>
                          );
                        })}
                        {queue.length > 3 && (
                          <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            +{queue.length - 3} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Workload bar */}
                <div className="px-5 pb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: isOverload ? '#f59e0b' : 'hsl(var(--muted-foreground))' }}>
                      {isOverload ? 'High Load' : 'Workload'}
                    </span>
                    <span className="text-[10px] font-semibold"
                      style={{ color: isOverload ? '#f59e0b' : 'hsl(var(--muted-foreground))' }}>
                      {activeLoad} active job{activeLoad !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${loadPct}%`,
                        background: isOverload ? '#f59e0b' : '#6366f1',
                      }} />
                  </div>
                </div>

                {/* Stats footer */}
                <div className="border-t grid grid-cols-3"
                  style={{ borderColor: 'hsl(var(--border))' }}>
                  <div className="py-3 text-center border-r" style={{ borderColor: 'hsl(var(--border))' }}>
                    <p className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{done}</p>
                    <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{doneLabel}</p>
                  </div>
                  <div className="py-3 text-center border-r" style={{ borderColor: 'hsl(var(--border))' }}>
                    <p className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{queue.length}</p>
                    <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>In Queue</p>
                  </div>
                  <div className="py-3 text-center">
                    <p className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                      {avgLabel ?? '—'}
                    </p>
                    <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>Completion</p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {technicians.length === 0 && (
            <div className="col-span-3 rounded-xl border py-16 text-center"
              style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <UserPlus className="w-10 h-10 mx-auto mb-3" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <p className="text-sm font-semibold mb-1" style={{ color: 'hsl(var(--foreground))' }}>No technicians yet</p>
              <p className="text-xs mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>Add your first technician to start tracking workloads</p>
              <button onClick={() => setShowAdd(true)}
                className="px-4 h-8 rounded-lg text-xs font-semibold text-white"
                style={{ background: 'hsl(var(--primary))' }}>
                Add Technician
              </button>
            </div>
          )}
        </div>
      )}

      {!loading && (
        <Pagination
          page={page}
          pageCount={Math.ceil(technicians.length / PAGE_SIZE)}
          total={technicians.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}

      {showAdd && <AddTechnicianModal onSave={add} onClose={() => setShowAdd(false)} />}
      {editingTech && <EditTechnicianModal technician={editingTech} onSave={patch} onClose={() => setEditingTech(null)} />}
      {showReassign && <ReassignModal technicians={technicians} onClose={() => setShowReassign(false)} />}
    </div>
  );
}
