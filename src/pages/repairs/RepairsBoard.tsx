import { useState, useEffect, useMemo } from 'react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useRepairs } from '@/hooks/useRepairs';
import AddRepairModal from './components/AddRepairModal';
import SearchDropdown from '@/components/shared/SearchDropdown';
import Pagination from '@/components/shared/Pagination';
import DateRangePicker, { type DateRange } from '@/components/shared/DateRangePicker';
import {
  X, Clock, Shield, Plus, Check, Pencil, Trash2,
  CreditCard, CheckCircle2, AlarmClock, DollarSign, Scissors, Stethoscope, ArrowRightCircle,
} from 'lucide-react';
import type { Repair, RepairStatus } from '@/types/repair';
import {
  REPAIR_STATUS_META as STATUS, PIPELINE_FULL, PIPELINE_DX, pipelineStep,
  nextAction, nextStatus, isActiveRepairStatus, isDiagnosisStage,
} from '@/utils/repairStatus';

const PAGE_SIZE = 12;

type Scope = 'diagnosis' | 'repair';

const FILTER_TABS: Record<Scope, { key: string; label: string }[]> = {
  diagnosis: [
    { key: 'all',           label: 'All' },
    { key: 'dx_only',       label: 'Diagnosis Only' },
    { key: 'received',      label: 'Received' },
    { key: 'diagnosed',     label: 'Diagnosed' },
    { key: 'completed',     label: 'Closed' },
  ],
  repair: [
    { key: 'all',           label: 'All' },
    { key: 'parts_pending', label: 'Parts Pending' },
    { key: 'in_progress',   label: 'In Progress' },
    { key: 'ready',         label: 'Ready' },
    { key: 'completed',     label: 'Completed' },
  ],
};

// ── Repair Card ───────────────────────────────────────────────────────────

function RepairCard({ repair, onClick, selected }: {
  repair: Repair; onClick: () => void; selected: boolean;
}) {
  const s = STATUS[repair.status] ?? STATUS.received;
  return (
    <div
      onClick={onClick}
      className="rounded-2xl p-4 cursor-pointer transition-all select-none"
      style={{
        background: 'hsl(var(--card))',
        border: `1px solid ${selected ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
        boxShadow: selected ? '0 0 0 2px rgba(220,31,31,0.15)' : 'none',
      }}
      onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--muted-foreground)/0.4)'; }}
      onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border))'; }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-[11px] font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>{repair.id}</span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0"
          style={{ background: s.bg, color: s.color }}>
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
          {s.label}
        </span>
      </div>

      <p className="text-sm font-bold mb-0.5" style={{ color: 'hsl(var(--foreground))' }}>{repair.device}</p>
      <p className="text-xs mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>{repair.issue}</p>

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{repair.customer}</span>
        {repair.technician && (
          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Tech: {repair.technician}</span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>ETA: {repair.eta || '—'}</span>
        </div>
        <span className="text-xs font-bold" style={{ color: 'hsl(var(--foreground))' }}>
          {repair.cost || 'TBD'}
        </span>
      </div>

      <div className="flex items-center gap-3 mt-2">
        {repair.jobType === 'diagnosis_only' && (
          <div className="flex items-center gap-1">
            <Stethoscope className="w-3 h-3" style={{ color: '#0ea5e9' }} />
            <span className="text-[10px] font-semibold" style={{ color: '#0ea5e9' }}>Dx Only</span>
          </div>
        )}
        {repair.warranty && (
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3" style={{ color: '#6366f1' }} />
            <span className="text-[10px] font-medium" style={{ color: '#6366f1' }}>Under Warranty</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Detail Panel ──────────────────────────────────────────────────────────

function RepairDetailPanel({ repair, onClose, onUpdateStatus, onAddNote, onConvertToRepair, onEdit, onDelete }: {
  repair: Repair;
  onClose: () => void;
  onUpdateStatus: (id: string, s: RepairStatus) => void;
  onAddNote: (id: string, note: string) => void;
  onConvertToRepair: (id: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [addingNote, setAddingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const s = STATUS[repair.status] ?? STATUS.received;
  const isDxOnly = repair.jobType === 'diagnosis_only';
  const pipeline = isDxOnly ? PIPELINE_DX : PIPELINE_FULL;
  const currentStep = pipelineStep(repair.status, isDxOnly);
  const isDone = ['completed', 'cancelled'].includes(repair.status);
  const canConvert = isDxOnly && repair.status === 'diagnosis_only_closed';

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    onAddNote(repair.id, noteText.trim());
    setNoteText('');
    setAddingNote(false);
  };

  const PART_COLORS: Record<string, { bg: string; color: string }> = {
    ordered:   { bg: 'rgba(99,102,241,0.15)', color: '#6366f1' },
    pending:   { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
    installed: { bg: 'rgba(34,197,94,0.15)',  color: '#22c55e' },
  };

  return (
    <div className="flex flex-col h-full overflow-hidden"
      style={{ background: 'hsl(var(--card))', borderLeft: '1px solid hsl(var(--border))' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0"
        style={{ borderBottom: '1px solid hsl(var(--border))' }}>
        <span className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Repair Details</span>
        <div className="flex items-center gap-1.5">
          <button onClick={onEdit} className="w-7 h-7 flex items-center justify-center rounded-lg"
            style={{ color: 'hsl(var(--muted-foreground))' }}
            title="Edit"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="w-7 h-7 flex items-center justify-center rounded-lg"
            style={{ color: 'hsl(var(--muted-foreground))' }}
            title="Delete"
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'hsl(0 60% 95%)'; el.style.color = 'hsl(0 65% 45%)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = ''; el.style.color = 'hsl(var(--muted-foreground))'; }}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg"
            style={{ color: 'hsl(var(--muted-foreground))' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* ID + device */}
        <div>
          <p className="text-[11px] font-mono mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{repair.id}</p>
          <p className="text-lg font-bold leading-tight" style={{ color: 'hsl(var(--foreground))' }}>{repair.device}</p>
          <p className="text-xs mt-0.5 mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{repair.issue}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: s.bg, color: s.color }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
              {s.label}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: isDxOnly ? 'rgba(14,165,233,0.12)' : 'rgba(99,102,241,0.12)', color: isDxOnly ? '#0ea5e9' : '#6366f1' }}>
              {isDxOnly ? <Stethoscope className="w-3 h-3" /> : <Scissors className="w-3 h-3" />}
              {isDxOnly ? 'Diagnosis Only' : 'Full Repair'}
            </span>
          </div>
        </div>

        {/* Progress stepper */}
        <div>
          <p className="text-xs font-bold mb-3" style={{ color: 'hsl(var(--foreground))' }}>Progress</p>
          {pipeline.map((step, i) => {
            const done   = currentStep > i;
            const active = currentStep === i;
            return (
              <div key={step} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold"
                    style={{
                      background: done || active ? '#22c55e' : 'hsl(var(--muted))',
                      color: done || active ? '#fff' : 'hsl(var(--muted-foreground))',
                    }}>
                    {done || active ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  {i < pipeline.length - 1 && (
                    <div className="w-0.5" style={{ height: 20, background: done ? '#22c55e' : 'hsl(var(--border))' }} />
                  )}
                </div>
                <div className="pb-2 pt-1">
                  <p className="text-xs font-medium"
                    style={{ color: active ? '#22c55e' : currentStep < i ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))' }}>
                    {step}
                  </p>
                  {active && <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>In progress</p>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Details */}
        <div className="space-y-2.5 pt-3" style={{ borderTop: '1px solid hsl(var(--border))' }}>
          {[
            ['Customer',       repair.customer],
            ['Technician',     repair.technician || '—'],
            ['Started',        repair.started || '—'],
            ['ETA',            repair.eta || '—'],
            ['Estimated Cost', repair.cost || '—'],
            ['Warranty',       repair.warranty ? 'Yes' : 'No'],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</span>
              <span className="text-xs font-medium"
                style={{ color: label === 'Warranty' && value === 'No' ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))' }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Parts */}
        {repair.parts?.length > 0 && (
          <div className="pt-3" style={{ borderTop: '1px solid hsl(var(--border))' }}>
            <p className="text-xs font-bold mb-3" style={{ color: 'hsl(var(--foreground))' }}>Parts Status</p>
            <div className="space-y-2">
              {repair.parts.map((part, i) => {
                const pc = PART_COLORS[part.status] ?? PART_COLORS.pending;
                return (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl"
                    style={{ background: 'hsl(var(--muted))' }}>
                    <span className="text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>{part.name}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                      style={{ background: pc.bg, color: pc.color }}>
                      {part.status.charAt(0).toUpperCase() + part.status.slice(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="pt-3" style={{ borderTop: '1px solid hsl(var(--border))' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold" style={{ color: 'hsl(var(--foreground))' }}>Technician Notes</p>
            <button onClick={() => setAddingNote(true)} className="text-xs font-medium flex items-center gap-1"
              style={{ color: 'hsl(var(--primary))' }}>
              <Plus className="w-3 h-3" />Add Note
            </button>
          </div>
          {(repair.notes ?? []).length > 0 && (
            <ul className="space-y-1.5 mb-3">
              {repair.notes.map((note, i) => (
                <li key={i} className="flex gap-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <span className="shrink-0 mt-0.5">•</span><span>{note}</span>
                </li>
              ))}
            </ul>
          )}
          {addingNote && (
            <div className="space-y-2">
              <textarea autoFocus rows={3} value={noteText} onChange={e => setNoteText(e.target.value)}
                placeholder="Add a technician note..."
                className="w-full px-3 py-2 rounded-xl text-xs outline-none resize-none"
                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setAddingNote(false); setNoteText(''); }}
                  className="px-3 py-1.5 text-xs rounded-lg"
                  style={{ color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}>
                  Cancel
                </button>
                <button onClick={handleAddNote} className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg"
                  style={{ background: 'hsl(var(--primary))' }}>
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      {canConvert ? (
        <div className="px-5 py-4 space-y-2 shrink-0" style={{ borderTop: '1px solid hsl(var(--border))' }}>
          <button
            onClick={() => onConvertToRepair(repair.id)}
            className="w-full h-10 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
            style={{ background: '#0ea5e9' }}>
            <ArrowRightCircle className="w-4 h-4" />
            Convert to Repair
          </button>
          <p className="text-[10px] text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Customer decided to go ahead with the repair after diagnosis.
          </p>
        </div>
      ) : !isDone && (
        <div className="px-5 py-4 space-y-2 shrink-0" style={{ borderTop: '1px solid hsl(var(--border))' }}>
          <button
            onClick={() => onUpdateStatus(repair.id, nextStatus(repair.status, isDxOnly))}
            className="w-full h-10 rounded-xl text-sm font-bold"
            style={{ background: 'hsl(var(--foreground))', color: 'hsl(var(--background))' }}>
            {nextAction(repair.status, isDxOnly)}
          </button>
          <div className="flex gap-2">
            <button onClick={() => setAddingNote(true)}
              className="flex-1 h-9 rounded-xl text-xs font-semibold"
              style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
              Add Note
            </button>
            <button className="flex-1 h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
              style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
              <CreditCard className="w-3.5 h-3.5" />View Job Card
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Board ─────────────────────────────────────────────────────────────────

export default function RepairsBoard({ scope }: { scope: Scope }) {
  const { setPageTitle } = usePageTitle();
  const { repairs: allRepairs, loading, add, updateStatus, addNote, patchRepair, remove } = useRepairs();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange>({ from: '', to: '' });
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRepair, setEditingRepair] = useState<Repair | null>(null);

  const repairs = useMemo(() =>
    allRepairs.filter(r => isDiagnosisStage(r) === (scope === 'diagnosis')),
  [allRepairs, scope]);

  const selected = selectedId ? (repairs.find(r => r.id === selectedId) ?? null) : null;

  useEffect(() => { setPage(1); setFilter('all'); setSelectedId(null); }, [scope]);
  useEffect(() => { setPage(1); }, [query, filter, dateRange]);

  useEffect(() => {
    setPageTitle({
      title: scope === 'diagnosis' ? 'Diagnosis' : 'Repairs',
      subtitle: scope === 'diagnosis'
        ? 'Intake, diagnosis, and pending customer decisions'
        : 'Approved jobs — parts, progress, and pickup',
      hideDefaultAction: true,
    });
    return () => setPageTitle({ title: 'Dashboard' });
  }, [setPageTitle, scope]);

  const active       = useMemo(() => repairs.filter(r => isActiveRepairStatus(r.status)), [repairs]);
  const ready        = useMemo(() => repairs.filter(r => r.status === 'ready'), [repairs]);
  const partsPending = useMemo(() => repairs.filter(r => r.status === 'parts_pending'), [repairs]);
  const awaiting     = useMemo(() => repairs.filter(r => r.status === 'awaiting_approval'), [repairs]);
  const dxOnly        = useMemo(() => repairs.filter(r => r.jobType === 'diagnosis_only'), [repairs]);
  const closed        = useMemo(() => repairs.filter(r => r.status === 'diagnosis_only_closed'), [repairs]);
  const totalRevenue = useMemo(() => repairs.filter(r => r.status === 'completed').reduce((s, r) => s + (r.costNum ?? 0), 0), [repairs]);

  const filterTabs = FILTER_TABS[scope];

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const from = dateRange.from ? new Date(dateRange.from + 'T00:00') : null;
    const to   = dateRange.to   ? new Date(dateRange.to   + 'T23:59:59') : null;
    return repairs.filter(r => {
      if (filter === 'dx_only') {
        if (r.jobType !== 'diagnosis_only') return false;
      } else {
        const matchFilter = filter === 'all' || STATUS[r.status]?.filterKey === filter;
        if (!matchFilter) return false;
      }
      if (q && !r.id.toLowerCase().includes(q)
            && !r.device.toLowerCase().includes(q)
            && !r.issue.toLowerCase().includes(q)
            && !r.customer.toLowerCase().includes(q)) return false;
      if (from || to) {
        const d = new Date(r.createdAt ?? r.id);
        if (from && d < from) return false;
        if (to   && d > to)   return false;
      }
      return true;
    });
  }, [repairs, filter, query, dateRange]);

  const paged = useMemo(() =>
    filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  [filtered, page]);

  const handleUpdateStatus = (id: string, status: RepairStatus) => {
    updateStatus(id, status);
    if (status === 'completed') setSelectedId(null);
  };

  const handleConvertToRepair = (id: string) => {
    patchRepair(id, { jobType: 'diagnosis_to_repair', status: 'awaiting_approval' });
  };

  const handleDelete = (repair: Repair) => {
    if (!window.confirm(`Delete ${repair.id} (${repair.device})? This can't be undone.`)) return;
    remove(repair.id);
    setSelectedId(null);
  };

  const STATS = scope === 'diagnosis'
    ? [
        { label: 'IN DIAGNOSIS',      value: String(active.length - awaiting.length), icon: Stethoscope,  border: '#0ea5e9' },
        { label: 'AWAITING DECISION', value: String(awaiting.length),                 icon: AlarmClock,   border: '#f59e0b' },
        { label: 'DIAGNOSIS ONLY',    value: String(dxOnly.length),                   icon: Scissors,     border: '#7c3aed' },
        { label: 'CLOSED',            value: String(closed.length),                   icon: CheckCircle2, border: '#64748b' },
      ] as const
    : [
        { label: 'ACTIVE REPAIRS',       value: String(active.length),                  icon: Scissors,     border: '#7c3aed' },
        { label: 'READY FOR PICKUP',     value: String(ready.length),                   icon: CheckCircle2, border: '#22c55e' },
        { label: 'PARTS PENDING',        value: String(partsPending.length),            icon: AlarmClock,   border: '#f59e0b' },
        { label: 'TOTAL REPAIR REVENUE', value: `GHS ${totalRevenue.toLocaleString()}`, icon: DollarSign,   border: '#6366f1', large: true },
      ] as const;

  const cols = selected ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div className="flex h-full -m-6 overflow-hidden">
      {/* Scrollable left section */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 min-w-0">
        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4">
          {STATS.map(card => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-2xl p-5 relative overflow-hidden"
                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: card.border }} />
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
                      style={{ color: 'hsl(var(--muted-foreground))' }}>{card.label}</p>
                    <p className={`font-bold ${('large' in card && card.large) ? 'text-xl' : 'text-3xl'}`}
                      style={{ color: 'hsl(var(--foreground))' }}>{card.value}</p>
                  </div>
                  <Icon className="w-5 h-5 mt-0.5 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <SearchDropdown
            query={query}
            onQueryChange={setQuery}
            suggestions={query.trim() ? filtered.map(r => ({
              id: r.id,
              primary: r.id,
              secondary: `${r.device} · ${r.customer}`,
              meta: r.issue.slice(0, 36),
              badge: { label: STATUS[r.status]?.label ?? r.status, bg: STATUS[r.status]?.bg ?? '', color: STATUS[r.status]?.color ?? '' },
            })) : []}
            onSelect={item => setQuery(item.id)}
            placeholder={scope === 'diagnosis' ? 'Search diagnosis jobs…' : 'Search repairs…'}
            width={220}
          />

          <div className="flex items-center gap-1.5 flex-wrap">
            {filterTabs.map(tab => (
              <button key={tab.key} onClick={() => setFilter(tab.key)}
                className="px-3 h-8 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: filter === tab.key ? 'hsl(var(--foreground))' : 'transparent',
                  color: filter === tab.key ? 'hsl(var(--background))' : 'hsl(var(--muted-foreground))',
                  border: `1px solid ${filter === tab.key ? 'transparent' : 'hsl(var(--border))'}`,
                }}>
                {tab.label}
              </button>
            ))}
            <DateRangePicker value={dateRange} onChange={setDateRange} label="Received date" />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="ml-auto flex items-center gap-1.5 px-4 h-9 rounded-xl text-xs font-bold"
            style={{ background: 'hsl(var(--foreground))', color: 'hsl(var(--background))' }}>
            <Plus className="w-3.5 h-3.5" /> {scope === 'diagnosis' ? 'New Diagnosis' : 'New Repair'}
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <p className="py-16 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {scope === 'diagnosis' ? 'No diagnosis jobs match.' : 'No repairs match.'}
          </p>
        ) : (
          <>
            <div className={`grid ${cols} gap-3`}>
              {paged.map(r => (
                <RepairCard
                  key={r.id}
                  repair={r}
                  onClick={() => setSelectedId(r.id === selectedId ? null : r.id)}
                  selected={r.id === selectedId}
                />
              ))}
            </div>
            <Pagination
              page={page}
              pageCount={Math.ceil(filtered.length / PAGE_SIZE)}
              total={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-80 shrink-0 h-full overflow-hidden border-l"
          style={{ borderColor: 'hsl(var(--border))' }}>
          <RepairDetailPanel
            repair={selected}
            onClose={() => setSelectedId(null)}
            onUpdateStatus={handleUpdateStatus}
            onAddNote={addNote}
            onConvertToRepair={handleConvertToRepair}
            onEdit={() => setEditingRepair(selected)}
            onDelete={() => handleDelete(selected)}
          />
        </div>
      )}

      {showAddModal && (
        <AddRepairModal
          onSave={async (r) => { await add(r); }}
          onClose={() => setShowAddModal(false)}
          repairs={allRepairs}
          defaultJobType={scope === 'diagnosis' ? 'diagnosis_only' : 'diagnosis_to_repair'}
        />
      )}

      {editingRepair && (
        <AddRepairModal
          onSave={async (r) => { await add(r); }}
          onUpdate={patchRepair}
          initial={editingRepair}
          onClose={() => setEditingRepair(null)}
          repairs={allRepairs}
        />
      )}
    </div>
  );
}
