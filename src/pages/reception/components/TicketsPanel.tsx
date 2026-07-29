import { useState, useMemo } from 'react';
import {
  Search, Phone, Clock3, ClipboardList, ChevronDown,
  CheckCircle2, UserX, Smartphone, Bell, User, Tag, X,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useRepairs } from '@/hooks/useRepairs';
import { useTechnicians } from '@/hooks/useTechnicians';
import { REPAIR_STATUS_META, isOverdueRepair, isActiveRepairStatus } from '@/utils/repairStatus';
import { formatDate } from '@/utils/date';
import type { Repair, RepairStatus } from '@/types/repair';

type FilterKey = 'all' | 'pending' | 'in_progress' | 'ready' | 'completed';

const COMPLETED_STATUSES: RepairStatus[] = ['completed', 'diagnosis_only_closed', 'cancelled'];

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',         label: 'All' },
  { key: 'pending',     label: 'Pending' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'ready',       label: 'Ready' },
  { key: 'completed',   label: 'Completed' },
];

function bucketOf(status: RepairStatus): FilterKey {
  if (status === 'in_progress') return 'in_progress';
  if (status === 'ready') return 'ready';
  if (COMPLETED_STATUSES.includes(status)) return 'completed';
  return 'pending';
}

export default function TicketsPanel() {
  const { showToast } = useToast();
  const { repairs, loading, patchRepair, addNote } = useRepairs();
  const { technicians } = useTechnicians();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [discountRequestId, setDiscountRequestId] = useState<string | null>(null);
  const [discountReason, setDiscountReason] = useState('');

  const today = new Date().toDateString();
  const todaysIntake = useMemo(
    () => repairs.filter(r => (r.createdAt ?? r.started)?.slice(0, 10) === new Date().toISOString().slice(0, 10)).length,
    [repairs],
  );
  const activeJobs = useMemo(
    () => repairs.filter(r => isActiveRepairStatus(r.status) && r.status !== 'ready').length,
    [repairs],
  );
  const readyPickups = useMemo(() => repairs.filter(r => r.status === 'ready'), [repairs]);
  const doneToday = useMemo(
    () => repairs.filter(r => r.completedDate && new Date(r.completedDate).toDateString() === today).length,
    [repairs, today],
  );

  const stats = [
    { label: "Today's Intake", value: todaysIntake, icon: ClipboardList, chipBg: 'hsl(var(--muted))',     chipColor: 'hsl(var(--muted-foreground))' },
    { label: 'Active Jobs',    value: activeJobs,   icon: Clock3,        chipBg: 'rgba(245,158,11,0.15)', chipColor: '#f59e0b' },
    { label: 'Ready Pickup',   value: readyPickups.length, icon: Bell,   chipBg: 'rgba(34,197,94,0.15)',  chipColor: '#22c55e' },
    { label: 'Done Today',     value: doneToday,    icon: CheckCircle2,  chipBg: 'rgba(34,197,94,0.15)',  chipColor: '#22c55e' },
  ];

  const filteredRepairs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return repairs
      .filter(r => filter === 'all' || bucketOf(r.status) === filter)
      .filter(r => !q || r.id.toLowerCase().includes(q) || r.customer.toLowerCase().includes(q) || r.device.toLowerCase().includes(q))
      .sort((a, b) => (b.createdAt ?? b.started).localeCompare(a.createdAt ?? a.started));
  }, [repairs, filter, search]);

  const handleAssign = (repairId: string, techId: string) => {
    if (!techId) { patchRepair(repairId, { technicians: [] }); return; }
    const tech = technicians.find(t => t.id === techId);
    if (tech) patchRepair(repairId, { technicians: [{ id: tech.id, name: tech.name }] });
  };

  const submitDiscountRequest = (repair: Repair) => {
    if (!discountReason.trim()) return;
    addNote(repair.id, `Discount requested: ${discountReason.trim()}`);
    showToast('Discount request sent');
    setDiscountRequestId(null);
    setDiscountReason('');
  };

  const handleCall = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      showToast(`Copied ${phone} — dialing…`);
    } catch {
      showToast(`Call ${phone}`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl p-4" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: card.chipBg }}>
                  <Icon className="w-5 h-5" style={{ color: card.chipColor }} />
                </div>
                <p className="text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{card.value}</p>
              </div>
              <p className="text-[11px] font-bold uppercase tracking-widest mt-2.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Ready-for-pickup banner */}
      {readyPickups.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#22c55e' }}>
              <Bell className="w-4.5 h-4.5 text-white" />
            </div>
            <p className="text-sm font-bold" style={{ color: '#16a34a' }}>
              {readyPickups.length} Device{readyPickups.length > 1 ? 's' : ''} Ready for Pickup
            </p>
          </div>
          <div className="pl-12 space-y-2">
            {readyPickups.map(r => (
              <div key={r.id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>{r.device}</p>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{r.customer} · {r.id} · {r.cost}</p>
                </div>
                {r.customerPhone && (
                  <a href={`tel:${r.customerPhone}`}
                    onClick={() => handleCall(r.customerPhone!)}
                    className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold flex-shrink-0 cursor-pointer"
                    style={{ background: 'rgba(34,197,94,0.15)', color: '#16a34a' }}>
                    <Phone className="w-3.5 h-3.5" /> Call
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search + filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search ticket #, customer, device..."
            className="w-full h-10 pl-9 pr-3 rounded-xl text-sm outline-none"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="h-8 px-3.5 rounded-full text-xs font-semibold transition-colors"
              style={filter === f.key
                ? { background: 'hsl(var(--primary))', color: 'white' }
                : { background: 'hsl(var(--card))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket list */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {filteredRepairs.length} Tickets
        </p>
        <div className="space-y-2">
          {loading ? (
            <p className="py-16 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</p>
          ) : filteredRepairs.length === 0 ? (
            <p className="py-16 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No tickets match.</p>
          ) : filteredRepairs.map(repair => {
            const s = REPAIR_STATUS_META[repair.status];
            const overdue = isOverdueRepair(repair);
            const assignedTech = repair.technicians[0];
            const requestingDiscount = discountRequestId === repair.id;
            return (
              <div key={repair.id} className="rounded-xl p-4" style={{
                background: 'hsl(var(--card))',
                border: `1px solid ${overdue ? 'rgba(239,68,68,0.35)' : 'hsl(var(--border))'}`,
              }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'hsl(var(--muted))' }}>
                    <Smartphone className="w-4.5 h-4.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>{repair.device}</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                      {overdue && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                          OVERDUE
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{repair.issue}</p>
                    <div className="flex items-center gap-3 flex-wrap mt-1.5 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <span className="flex items-center gap-1 font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                        <User className="w-3 h-3" />{repair.customer}
                      </span>
                      {repair.customerPhone && (
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{repair.customerPhone}</span>
                      )}
                      <span className="flex items-center gap-1"><Clock3 className="w-3 h-3" />In: {formatDate(repair.createdAt ?? repair.started)}</span>
                      <span className="flex items-center gap-1" style={{ color: overdue ? '#ef4444' : undefined }}>
                        <Clock3 className="w-3 h-3" />Due: {repair.eta || '—'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-[11px] font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>{repair.id}</p>
                    <p className="text-sm font-bold mt-0.5" style={{ color: 'hsl(var(--foreground))' }}>{repair.cost || 'TBD'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  {assignedTech ? (
                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Tech: {assignedTech.name}</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <UserX className="w-3.5 h-3.5" /> Unassigned
                    </span>
                  )}
                  <div className="relative">
                    <select
                      value={assignedTech?.id ?? ''}
                      onChange={e => handleAssign(repair.id, e.target.value)}
                      className="appearance-none bg-transparent pr-4 text-xs font-bold outline-none cursor-pointer"
                      style={{ color: 'hsl(var(--primary))' }}
                    >
                      <option value="">Assign Tech</option>
                      {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <ChevronDown className="w-3 h-3 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'hsl(var(--primary))' }} />
                  </div>
                </div>

                {requestingDiscount ? (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      autoFocus
                      value={discountReason}
                      onChange={e => setDiscountReason(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') submitDiscountRequest(repair); }}
                      placeholder="Reason for discount…"
                      className="flex-1 h-8 px-2.5 rounded-lg text-xs outline-none"
                      style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                    />
                    <button onClick={() => submitDiscountRequest(repair)}
                      className="h-8 px-3 rounded-lg text-xs font-semibold text-white cursor-pointer flex-shrink-0"
                      style={{ background: 'hsl(var(--primary))' }}>
                      Send
                    </button>
                    <button onClick={() => { setDiscountRequestId(null); setDiscountReason(''); }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 cursor-pointer"
                      style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setDiscountRequestId(repair.id); setDiscountReason(''); }}
                    className="flex items-center gap-1.5 text-xs mt-2 cursor-pointer"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                  >
                    <Tag className="w-3.5 h-3.5" /> Request Discount
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
