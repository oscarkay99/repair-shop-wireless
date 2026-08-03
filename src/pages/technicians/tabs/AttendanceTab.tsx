import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Pencil, Trash2, X, Clock } from 'lucide-react';
import { useAttendance } from '@/hooks/useAttendance';
import type { AttendanceRecord } from '@/services/wireless/attendance';
import { getWirelessUsers, type WirelessProfile } from '@/services/wireless/users';
import { avatarColor, initials } from '../shared';

interface Props {
  canManage: boolean;
}

const RANGE_FILTERS = ['Today', '7 days', '30 days', 'All'] as const;
type RangeFilter = typeof RANGE_FILTERS[number];

function rangeFrom(f: RangeFilter): string | undefined {
  const now = new Date();
  if (f === 'Today') { const d = new Date(now); d.setHours(0, 0, 0, 0); return d.toISOString(); }
  if (f === '7 days') return new Date(now.getTime() - 7 * 86_400_000).toISOString();
  if (f === '30 days') return new Date(now.getTime() - 30 * 86_400_000).toISOString();
  return undefined;
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function hoursBetween(a: string, b: string | null): number | null {
  if (!b) return null;
  return (new Date(b).getTime() - new Date(a).getTime()) / 3_600_000;
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

// ── Add / Edit modal ──────────────────────────────────────────────────────

function AttendanceModal({ staff, record, onSave, onClose }: {
  staff: WirelessProfile[];
  record?: AttendanceRecord | null;
  onSave: (input: { profileId: string; clockIn: string; clockOut?: string | null; notes?: string }) => Promise<unknown>;
  onClose: () => void;
}) {
  const [profileId, setProfileId] = useState(record?.profile_id ?? staff[0]?.id ?? '');
  const [clockIn, setClockIn] = useState(record ? toLocalInput(record.clock_in) : toLocalInput(new Date().toISOString()));
  const [clockOut, setClockOut] = useState(record?.clock_out ? toLocalInput(record.clock_out) : '');
  const [notes, setNotes] = useState(record?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!profileId || !clockIn) { setError('Staff member and clock in time are required'); return; }
    setSaving(true);
    try {
      await onSave({
        profileId,
        clockIn: new Date(clockIn).toISOString(),
        clockOut: clockOut ? new Date(clockOut).toISOString() : null,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save attendance record');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>{record ? 'Edit Attendance' : 'Add Attendance Record'}</p>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
            <X className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Staff Member *</label>
            <select required value={profileId} onChange={e => setProfileId(e.target.value)} disabled={!!record}
              className="w-full h-9 px-3 rounded-lg text-sm outline-none disabled:opacity-60"
              style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
              {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Clock In *</label>
              <input required type="datetime-local" value={clockIn} onChange={e => setClockIn(e.target.value)}
                className="w-full h-9 px-3 rounded-lg text-sm outline-none"
                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Clock Out</label>
              <input type="datetime-local" value={clockOut} min={clockIn} onChange={e => setClockOut(e.target.value)}
                className="w-full h-9 px-3 rounded-lg text-sm outline-none"
                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Notes</label>
            <input value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full h-9 px-3 rounded-lg text-sm outline-none"
              style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
          </div>

          {error && <p className="text-xs rounded-lg px-3 py-2" style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626' }}>{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 h-9 rounded-lg text-xs font-semibold"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 h-9 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
              style={{ background: 'hsl(var(--primary))' }}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ── Main tab ───────────────────────────────────────────────────────────────

export default function AttendanceTab({ canManage }: Props) {
  const [range, setRange] = useState<RangeFilter>('Today');
  const from = useMemo(() => rangeFrom(range), [range]);
  const { records, loading, add, update, remove } = useAttendance({ from });
  const [staff, setStaff] = useState<WirelessProfile[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<AttendanceRecord | null>(null);

  useEffect(() => { getWirelessUsers().then(setStaff).catch(() => setStaff([])); }, []);

  const onShiftNow = records.filter(r => !r.clock_out);
  const totalHoursInRange = records.reduce((s, r) => s + (hoursBetween(r.clock_in, r.clock_out) ?? 0), 0);

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'On Shift Now', value: loading ? '…' : onShiftNow.length },
          { label: 'Sessions', value: loading ? '…' : records.length },
          { label: 'Total Hours', value: loading ? '…' : totalHoursInRange.toFixed(1) },
        ].map(s => (
          <div key={s.label} className="rounded-xl border px-5 py-4"
            style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.label}</p>
            <p className="text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Range filter + add */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Range</span>
          {RANGE_FILTERS.map(f => (
            <button key={f} onClick={() => setRange(f)}
              className="px-3 h-7 rounded-full text-xs font-semibold transition-colors"
              style={range === f
                ? { background: 'hsl(var(--foreground))', color: 'hsl(var(--background))' }
                : { background: 'transparent', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}>
              {f}
            </button>
          ))}
        </div>
        {canManage && (
          <button onClick={() => setShowAdd(true)} disabled={staff.length === 0}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
            style={{ background: 'hsl(var(--primary))' }}>
            <Plus className="w-3.5 h-3.5" /> Add Record
          </button>
        )}
      </div>

      {/* Records table */}
      {loading ? (
        <div className="text-center py-16 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</div>
      ) : records.length === 0 ? (
        <div className="rounded-xl border py-16 text-center" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <Clock className="w-10 h-10 mx-auto mb-3" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>No attendance records</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden overflow-x-auto" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: 'hsl(var(--border))' }}>
                {['Staff Member', 'Role', 'Clock In', 'Clock Out', 'Hours', 'Notes', ''].map(h => (
                  <th key={h} className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map(r => {
                const hrs = hoursBetween(r.clock_in, r.clock_out);
                return (
                  <tr key={r.id} className="border-b last:border-0" style={{ borderColor: 'hsl(var(--border))' }}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                          style={{ background: avatarColor(r.profile?.name ?? '?') }}>
                          {initials(r.profile?.name ?? '?')}
                        </div>
                        <span style={{ color: 'hsl(var(--foreground))' }}>{r.profile?.name ?? 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 capitalize" style={{ color: 'hsl(var(--muted-foreground))' }}>{r.profile?.role?.replace(/_/g, ' ') ?? '—'}</td>
                    <td className="px-4 py-2.5" style={{ color: 'hsl(var(--foreground))' }}>{fmtDateTime(r.clock_in)}</td>
                    <td className="px-4 py-2.5" style={{ color: 'hsl(var(--foreground))' }}>
                      {r.clock_out ? fmtDateTime(r.clock_out) : <span className="font-semibold" style={{ color: 'hsl(142 60% 45%)' }}>On shift</span>}
                    </td>
                    <td className="px-4 py-2.5" style={{ color: 'hsl(var(--foreground))' }}>{hrs !== null ? `${hrs.toFixed(1)}h` : '—'}</td>
                    <td className="px-4 py-2.5 max-w-[16rem] truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{r.notes || '—'}</td>
                    <td className="px-4 py-2.5">
                      {canManage && (
                        <div className="flex items-center gap-1.5 justify-end">
                          <button onClick={() => setEditing(r)} className="w-7 h-7 flex items-center justify-center rounded-lg"
                            style={{ background: 'hsl(var(--muted))' }} title="Edit">
                            <Pencil className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                          </button>
                          <button onClick={() => { if (window.confirm('Delete this attendance record?')) remove(r.id); }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: 'hsl(var(--muted))' }} title="Delete">
                            <Trash2 className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <AttendanceModal
          staff={staff}
          onSave={input => add(input)}
          onClose={() => setShowAdd(false)}
        />
      )}
      {editing && (
        <AttendanceModal
          staff={staff}
          record={editing}
          onSave={input => update(editing.id, { clockIn: input.clockIn, clockOut: input.clockOut, notes: input.notes })}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
