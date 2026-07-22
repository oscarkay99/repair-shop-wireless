import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Clock, Calendar, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTechnicians } from '@/hooks/useTechnicians';
import { useRepairs } from '@/hooks/useRepairs';
import { RepairDetailPanel } from '@/pages/repairs/RepairsBoard';
import { REPAIR_STATUS_META } from '@/utils/repairStatus';
import type { RepairStatus } from '@/types/repair';
import type { TechnicianStatus } from '@/types/wireless';

const QUEUE_STATUSES: RepairStatus[] = ['received', 'diagnosis_paid', 'diagnosing', 'awaiting_approval', 'parts_pending'];
const DONE_STATUSES: RepairStatus[] = ['ready', 'completed', 'diagnosis_only_closed'];

const LEAVE_PRESETS = [
  { label: '1 day', days: 1 },
  { label: '3 days', days: 3 },
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
];

function fmtLeaveDate(iso: string) {
  return new Date(iso + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

const STATUS_BUTTONS: { key: TechnicianStatus; label: string; color: string }[] = [
  { key: 'available', label: 'Available', color: '#22c55e' },
  { key: 'on_break',   label: 'On Break',  color: '#f59e0b' },
  { key: 'off_duty',   label: 'Off Day',   color: '#ef4444' },
];

export default function TechPortalPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { technicians, patch: patchTechnician } = useTechnicians();
  const { repairs, loading, updateStatus, addNote, addMedia, removeMedia, patchRepair } = useRepairs();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showLeavePicker, setShowLeavePicker] = useState(false);
  const [customDate, setCustomDate] = useState('');
  const leavePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showLeavePicker) return;
    const fn = (e: MouseEvent) => {
      if (leavePickerRef.current && !leavePickerRef.current.contains(e.target as Node)) setShowLeavePicker(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [showLeavePicker]);

  const myTech = useMemo(() => technicians.find(t => t.profile_id === user?.id), [technicians, user]);

  const myRepairs = useMemo(() =>
    myTech ? repairs.filter(r => r.technicianId === myTech.id) : [],
    [repairs, myTech]);

  const activeRepairs = myRepairs.filter(r => r.status === 'in_progress');
  const queueRepairs  = myRepairs.filter(r => QUEUE_STATUSES.includes(r.status));
  const doneRepairs   = myRepairs.filter(r => DONE_STATUSES.includes(r.status));
  const openRepairs   = [...activeRepairs, ...queueRepairs];

  const selected = selectedId ? repairs.find(r => r.id === selectedId) ?? null : null;

  const handleSignOut = async () => {
    await logout();
    navigate('/signin', { replace: true });
  };

  const setStatus = (status: TechnicianStatus) => {
    if (!myTech) return;
    if (status === 'off_duty') { setShowLeavePicker(true); return; }
    patchTechnician(myTech.id, { status, leave_until: null });
  };

  const goOnLeave = (untilIso: string) => {
    if (!myTech) return;
    patchTechnician(myTech.id, { status: 'off_duty', leave_until: untilIso });
    setShowLeavePicker(false);
    setCustomDate('');
  };

  const pickPreset = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    goOnLeave(d.toISOString().slice(0, 10));
  };

  const returnToWork = () => {
    if (!myTech) return;
    patchTechnician(myTech.id, { status: 'available', leave_until: null });
  };

  const handleUpdateStatus = (id: string, status: RepairStatus) => {
    updateStatus(id, status);
    if (status === 'completed') setSelectedId(null);
  };
  const handleProceedToRepair = (id: string) => patchRepair(id, { jobType: 'diagnosis_to_repair', status: 'parts_pending' });
  const handleCloseDiagnosisOnly = (id: string) => patchRepair(id, { jobType: 'diagnosis_only', status: 'diagnosis_only_closed' });

  return (
    <div className="h-screen flex flex-col" style={{ background: 'hsl(var(--background))' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 h-16 border-b flex-shrink-0" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="flex items-center gap-2.5">
          <img src="/wireless-mark.png" alt="" className="w-8 h-8" />
          <div>
            <p className="text-sm font-bold tracking-wide leading-none" style={{ color: 'hsl(var(--foreground))' }}>WIRELESS</p>
            <p className="text-[9px] tracking-widest uppercase mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Tech Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold" style={{ background: '#f59e0b' }}>
              {initials(user?.name ?? 'T')}
            </div>
            <span className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{user?.name?.split(' ')[0]}</span>
          </div>
          <button onClick={handleSignOut}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-colors"
            style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
            <LogOut className="w-3.5 h-3.5" />
            Switch
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-2xl w-full mx-auto space-y-5">
          {/* Profile + status card */}
          <div className="rounded-2xl border p-5" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0" style={{ background: '#f59e0b' }}>
                  {initials(user?.name ?? 'T')}
                </div>
                <div>
                  <p className="text-lg font-bold leading-tight" style={{ color: 'hsl(var(--foreground))' }}>{user?.name?.toUpperCase()}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{myTech?.specialty || 'General Repairs'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-xl font-bold" style={{ color: '#ef4444' }}>{activeRepairs.length}</p>
                  <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Active</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{queueRepairs.length}</p>
                  <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Queue</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold" style={{ color: '#22c55e' }}>{doneRepairs.length}</p>
                  <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Done</p>
                </div>
              </div>
            </div>

            {/* Status toggle */}
            <div className="flex items-center gap-2 pt-4 flex-wrap relative" style={{ borderTop: '1px solid hsl(var(--border))' }}>
              <span className="text-xs font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>Status:</span>
              {STATUS_BUTTONS.map(s => {
                const isActive = myTech?.status === s.key;
                return (
                  <button key={s.key} onClick={() => setStatus(s.key)}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold transition-colors"
                    style={isActive
                      ? { background: `${s.color}18`, color: s.color, border: `1px solid ${s.color}55` }
                      : { color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: isActive ? s.color : 'hsl(var(--muted-foreground))' }} />
                    {s.label}
                  </button>
                );
              })}

              {showLeavePicker && (
                <div ref={leavePickerRef} className="absolute top-full left-0 mt-2 z-20 rounded-xl overflow-hidden p-3 w-56"
                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-md)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    How long will you be off?
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    {LEAVE_PRESETS.map(p => (
                      <button key={p.label} onClick={() => pickPreset(p.days)}
                        className="h-8 rounded-lg text-xs font-semibold transition-colors"
                        style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'hsl(var(--muted-foreground))' }} />
                      <input type="date" value={customDate} min={new Date().toISOString().slice(0, 10)}
                        onChange={e => setCustomDate(e.target.value)}
                        className="w-full h-8 pl-8 pr-2 rounded-lg text-xs outline-none"
                        style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                    </div>
                    <button disabled={!customDate} onClick={() => goOnLeave(customDate)}
                      className="h-8 px-3 rounded-lg text-xs font-semibold text-white disabled:opacity-40"
                      style={{ background: 'hsl(var(--primary))' }}>
                      Set
                    </button>
                  </div>
                </div>
              )}
            </div>

            {myTech?.status === 'off_duty' && (
              <div className="flex items-center justify-between gap-2 mt-3 px-3 py-2 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)' }}>
                <p className="text-xs font-medium" style={{ color: '#dc2626' }}>
                  Off{myTech.leave_until ? ` until ${fmtLeaveDate(myTech.leave_until)}` : ''}
                </p>
                <button onClick={returnToWork} className="text-xs font-semibold" style={{ color: '#dc2626' }}>
                  Return to work
                </button>
              </div>
            )}
          </div>

          {/* Queue */}
          <div className="rounded-2xl border overflow-hidden" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'hsl(var(--primary)) transparent transparent' }} />
              </div>
            ) : openRepairs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Clock className="w-9 h-9 opacity-20" style={{ color: 'hsl(var(--foreground))' }} />
                <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>No tickets assigned</p>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Check back when work is assigned to you.</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
                {openRepairs.map(r => {
                  const s = REPAIR_STATUS_META[r.status];
                  return (
                    <button key={r.id} onClick={() => setSelectedId(r.id)}
                      className="w-full flex items-center gap-4 px-5 py-3.5 text-left transition-colors"
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>{r.device}</p>
                        <p className="text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{r.issue} · {r.customer}</p>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0"
                        style={{ background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-40" style={{ color: 'hsl(var(--foreground))' }} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50">
          <RepairDetailPanel
            repair={selected}
            onClose={() => setSelectedId(null)}
            onUpdateStatus={handleUpdateStatus}
            onAddNote={addNote}
            onAddMedia={addMedia}
            onRemoveMedia={removeMedia}
            uploaderName={user?.name}
            canManageTickets={false}
            onProceedToRepair={handleProceedToRepair}
            onCloseDiagnosisOnly={handleCloseDiagnosisOnly}
            onEdit={() => {}}
            onDelete={() => {}}
          />
        </div>
      )}
    </div>
  );
}
