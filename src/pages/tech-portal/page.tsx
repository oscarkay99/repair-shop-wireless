import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Clock, Calendar, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTechnicians } from '@/hooks/useTechnicians';
import { useRepairs } from '@/hooks/useRepairs';
import { RepairDetailPanel } from '@/pages/repairs/RepairsBoard';
import { REPAIR_STATUS_META } from '@/utils/repairStatus';
import { roleColors, roleLabels } from '@/mocks/users';
import { isCurrentlyUnavailable } from '@/utils/technicianAvailability';
import type { RepairStatus } from '@/types/repair';

const QUEUE_STATUSES: RepairStatus[] = ['received', 'diagnosis_paid', 'diagnosing', 'awaiting_approval', 'parts_pending'];
const DONE_STATUSES: RepairStatus[] = ['ready', 'completed', 'diagnosis_only_closed'];

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

export default function TechPortalPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { technicians, patch: patchTechnician } = useTechnicians();
  const { repairs, loading, updateStatus, addNote, addMedia, removeMedia, patchRepair } = useRepairs();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showUnavailablePicker, setShowUnavailablePicker] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  const myTech = useMemo(() => technicians.find(t => t.profile_id === user?.id), [technicians, user]);
  const unavailableNow = myTech ? isCurrentlyUnavailable(myTech) : false;

  // Self-correct: once the marked range has passed, flip back to available
  // rather than relying on the technician remembering to do it themselves.
  useEffect(() => {
    if (!myTech) return;
    if (myTech.status === 'unavailable' && !isCurrentlyUnavailable(myTech) && myTech.unavailable_until) {
      patchTechnician(myTech.id, { status: 'available', unavailable_from: null, unavailable_until: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myTech?.id, myTech?.status, myTech?.unavailable_until]);

  useEffect(() => {
    if (!showUnavailablePicker) return;
    const fn = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowUnavailablePicker(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [showUnavailablePicker]);

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

  const returnToWork = () => {
    if (!myTech) return;
    patchTechnician(myTech.id, { status: 'available', unavailable_from: null, unavailable_until: null });
  };

  const confirmUnavailable = () => {
    if (!myTech || !fromDate || !toDate) return;
    patchTechnician(myTech.id, { status: 'unavailable', unavailable_from: fromDate, unavailable_until: toDate });
    setShowUnavailablePicker(false);
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
      <header className="flex items-center px-4 sm:px-6 h-16 border-b flex-shrink-0" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="flex items-center gap-2.5">
          <img src="/wireless-mark.png" alt="" className="w-8 h-8" />
          <div>
            <p className="text-sm font-bold tracking-wide leading-none" style={{ color: 'hsl(var(--foreground))' }}>WIRELESS</p>
            <p className="text-[9px] tracking-widest uppercase mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Tech Portal</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24">
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
              <button onClick={returnToWork}
                className="flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold transition-colors"
                style={!unavailableNow
                  ? { background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.35)' }
                  : { color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: !unavailableNow ? '#22c55e' : 'hsl(var(--muted-foreground))' }} />
                Available
              </button>
              <button onClick={() => { setFromDate(new Date().toISOString().slice(0, 10)); setToDate(''); setShowUnavailablePicker(v => !v); }}
                className="flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold transition-colors"
                style={unavailableNow
                  ? { background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.35)' }
                  : { color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: unavailableNow ? '#ef4444' : 'hsl(var(--muted-foreground))' }} />
                Unavailable
              </button>

              {showUnavailablePicker && (
                <div ref={pickerRef} className="absolute top-full left-0 mt-2 z-20 rounded-xl overflow-hidden p-3 w-64"
                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-md)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Which days will you be unavailable?
                  </p>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-semibold block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>From</label>
                      <div className="relative">
                        <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'hsl(var(--muted-foreground))' }} />
                        <input type="date" value={fromDate} min={new Date().toISOString().slice(0, 10)}
                          onChange={e => setFromDate(e.target.value)}
                          className="w-full h-8 pl-8 pr-2 rounded-lg text-xs outline-none"
                          style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Until</label>
                      <div className="relative">
                        <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'hsl(var(--muted-foreground))' }} />
                        <input type="date" value={toDate} min={fromDate || new Date().toISOString().slice(0, 10)}
                          onChange={e => setToDate(e.target.value)}
                          className="w-full h-8 pl-8 pr-2 rounded-lg text-xs outline-none"
                          style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                      </div>
                    </div>
                    <button disabled={!fromDate || !toDate} onClick={confirmUnavailable}
                      className="w-full h-8 rounded-lg text-xs font-semibold text-white disabled:opacity-40"
                      style={{ background: 'hsl(var(--primary))' }}>
                      Set
                    </button>
                  </div>
                </div>
              )}
            </div>

            {unavailableNow && myTech && (
              <div className="flex items-center justify-between gap-2 mt-3 px-3 py-2 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)' }}>
                <p className="text-xs font-medium" style={{ color: '#dc2626' }}>
                  Unavailable{myTech.unavailable_from && myTech.unavailable_until ? ` ${fmtDate(myTech.unavailable_from)} – ${fmtDate(myTech.unavailable_until)}` : ''}
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

      {/* User card + sign out — bottom-left, matching the sidebar's convention in every other role */}
      {user && (
        <div className="fixed bottom-4 left-4 z-40 rounded-xl p-3 flex items-center gap-2.5 max-w-[calc(100vw-2rem)]"
          style={{ background: 'hsl(220 14% 94%)', border: '1px solid hsl(220 13% 88%)' }}>
          <Link
            to="/profile"
            title="View profile"
            className="flex items-center gap-2.5 flex-1 min-w-0 rounded-lg -m-1 p-1 transition-colors cursor-pointer"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(220 13% 88%)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
              style={{ background: user.role ? (roleColors[user.role] ?? 'hsl(354 60% 35%)') : 'hsl(354 60% 35%)' }}
            >
              {user.avatar || user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'hsl(220 20% 12%)' }}>{user.name}</p>
              <p className="text-[10px] truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {user.role ? (roleLabels[user.role] ?? user.role) : user.role}
              </p>
            </div>
          </Link>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 cursor-pointer transition-colors hover:bg-red-50 hover:text-red-500"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
