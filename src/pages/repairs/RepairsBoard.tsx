import { useState, useEffect, useMemo, useRef } from 'react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useRepairs } from '@/hooks/useRepairs';
import { useTechnicians } from '@/hooks/useTechnicians';
import { useAuth } from '@/hooks/useAuth';
import AddRepairModal from './components/AddRepairModal';
import CreateTicketInvoiceModal from './components/CreateTicketInvoiceModal';
import AddTicketPartModal from './components/AddTicketPartModal';
import { getTicketParts, removeTicketPart, type TicketPart } from '@/services/wireless/ticketParts';
import SearchDropdown from '@/components/shared/SearchDropdown';
import Pagination from '@/components/shared/Pagination';
import DateRangePicker, { type DateRange } from '@/components/shared/DateRangePicker';
import {
  X, Clock, Shield, Plus, Pencil, Trash2, Camera, Video, AlertCircle, Loader2,
  CheckCircle2, Scissors, Stethoscope, ArrowRightCircle, UserX, XCircle, Zap, Printer,
} from 'lucide-react';
import type { Repair, RepairStatus, RepairMediaStage, RepairMediaUploadInput } from '@/types/repair';
import type { Payment } from '@/types/wireless';
import {
  REPAIR_STATUS_META as STATUS, activePipeline, pipelineStep,
  nextAction, nextStatus, isActiveRepairStatus, isDiagnosisStage,
  statusToMediaStage, requiredMediaStageForAdvance, REQUIRED_MEDIA_STAGE_LABEL,
} from '@/utils/repairStatus';
import { formatDate } from '@/utils/date';
import { getPaymentsForTicket } from '@/services/wireless/payments';
import { ensureTicketInvoice } from '@/services/wireless/autoInvoice';
import { useTaxSettings } from '@/hooks/useTaxSettings';
import { hasConfirmedDiagnosisPayment } from '@/services/repairs';
import { errMessage } from '@/utils/errors';
import { useWirelessSettings } from '@/hooks/useWirelessSettings';
import { downloadTicketReceiptPdf } from '@/utils/ticketReceiptPdf';

const PAGE_SIZE = 12;

// started is either a bare YYYY-MM-DD or a full timestamptz ISO string
function fmtStarted(started: string): string {
  if (!started) return '—';
  const hasTime = started.includes('T');
  return formatDate(hasTime ? started : `${started}T00:00`);
}

const FILTER_TABS: { key: string; label: string }[] = [
  { key: 'all',           label: 'All' },
  { key: 'unassigned',    label: 'Unassigned' },
  { key: 'in_queue',      label: 'In Queue' },
  { key: 'in_progress',   label: 'In Progress' },
  { key: 'ready',         label: 'Ready' },
  { key: 'completed',     label: 'Done' },
];

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
        boxShadow: selected ? '0 0 0 2px rgba(236,1,24,0.15)' : 'none',
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
        {repair.technician ? (
          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Tech: {repair.technician}</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color: '#f59e0b' }}>
            <UserX className="w-3 h-3" /> Unassigned
          </span>
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
        {repair.jobType === 'straight_repair' && (
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3" style={{ color: '#22c55e' }} />
            <span className="text-[10px] font-semibold" style={{ color: '#22c55e' }}>Straight Repair</span>
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

export function RepairDetailPanel({ repair, onClose, onUpdateStatus, onAddNote, onAddMedia, onRemoveMedia, uploaderName, canManageTickets, canUpdateProgress, canDeleteTickets, onProceedToRepair, onCloseDiagnosisOnly, onEdit, onDelete }: {
  repair: Repair;
  onClose: () => void;
  onUpdateStatus: (id: string, s: RepairStatus) => void;
  onAddNote: (id: string, note: string) => void;
  onAddMedia: (id: string, input: RepairMediaUploadInput) => Promise<unknown>;
  onRemoveMedia: (id: string, mediaId: string) => Promise<unknown>;
  uploaderName?: string;
  canManageTickets: boolean;
  /** Receptionists can create/edit/assign a ticket but never advance its status — that's reserved for the assigned technician and admin. */
  canUpdateProgress: boolean;
  /** Deleting a ticket is admin-only — receptionist can create/edit but not delete. */
  canDeleteTickets: boolean;
  onProceedToRepair: (id: string) => void;
  onCloseDiagnosisOnly: (id: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [addingNote, setAddingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [promptStage, setPromptStage] = useState<RepairMediaStage | null>(null);
  const [ticketPayments, setTicketPayments] = useState<Payment[]>([]);
  const [linkedInvoiceNumber, setLinkedInvoiceNumber] = useState<string | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [ticketParts, setTicketParts] = useState<TicketPart[]>([]);
  const [showAddPart, setShowAddPart] = useState(false);
  const [checkingInvoice, setCheckingInvoice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const s = STATUS[repair.status] ?? STATUS.received;
  const isDxOnly = repair.jobType === 'diagnosis_only';
  const isStraightRepair = repair.jobType === 'straight_repair';
  const pipeline = activePipeline(repair.status, repair.jobType);
  const currentStep = pipelineStep(repair.status, repair.jobType);
  const isDone = ['completed', 'cancelled'].includes(repair.status);
  const isAwaitingDecision = repair.status === 'awaiting_approval';
  const isClosedDiagnosis = repair.status === 'diagnosis_only_closed';
  const media = repair.media ?? [];
  const { settings } = useWirelessSettings();
  const { taxEnabled, vatRate, nhilGetfundRate } = useTaxSettings();
  // Only meaningful once there's actually a finished job to hand back —
  // matches the same "ready or later" window Create Invoice already uses.
  const canPrintReceipt = ['ready', 'completed', 'diagnosis_only_closed'].includes(repair.status);
  // Same unconditional policy as invoices — every repair carries the
  // shop's standard warranty, not a per-ticket toggle.
  const handlePrintReceipt = () => downloadTicketReceiptPdf({
    repair,
    warrantyDays: settings?.warranty_days,
    settings: settings ?? undefined,
  });

  const upcomingStatus = nextStatus(repair.status, repair.jobType);
  const requiredStage = requiredMediaStageForAdvance(repair.status, upcomingStatus);
  const hasRequiredPhoto = !requiredStage || media.some(m => m.stage === requiredStage);
  const depositPaid = ticketPayments.reduce((s, p) => s + p.amount, 0);
  // Ready-for-invoice = the job's reached its "customer needs to pay & collect"
  // terminal state — status 'ready' for the two repair flows, or
  // 'diagnosis_only_closed' for a diagnosis-only job (no repair to wait on).
  const readyForInvoice = repair.status === 'ready' || repair.status === 'diagnosis_only_closed'
    || (repair.status === 'cancelled' && hasConfirmedDiagnosisPayment(repair));

  useEffect(() => {
    let cancelled = false;
    if (!repair.ticketDbId) { setTicketPayments([]); return; }
    getPaymentsForTicket(repair.ticketDbId).then(rows => { if (!cancelled) setTicketPayments(rows); }).catch(() => { if (!cancelled) setTicketPayments([]); });
    return () => { cancelled = true; };
  }, [repair.ticketDbId]);

  const loadTicketParts = () => {
    if (!repair.ticketDbId) { setTicketParts([]); return; }
    getTicketParts(repair.ticketDbId).then(setTicketParts).catch(() => setTicketParts([]));
  };

  useEffect(loadTicketParts, [repair.ticketDbId]);

  const handleRemoveTicketPart = async (part: TicketPart) => {
    if (!confirm(`Remove ${part.part_name} (×${part.quantity})? This restores the stock deducted for it.`)) return;
    try {
      await removeTicketPart(part.id);
      loadTicketParts();
    } catch (e) {
      alert(errMessage(e, 'Failed to remove part'));
    }
  };

  useEffect(() => {
    let cancelled = false;
    if (!repair.ticketDbId || !readyForInvoice) { setLinkedInvoiceNumber(null); return; }
    setCheckingInvoice(true);
    ensureTicketInvoice(repair, { depositPaid, taxEnabled, vatRate, nhilGetfundRate, warrantyDays: settings?.warranty_days })
      .then(invoiceNumber => { if (!cancelled) setLinkedInvoiceNumber(invoiceNumber); })
      .catch(() => { if (!cancelled) setLinkedInvoiceNumber(null); })
      .finally(() => { if (!cancelled) setCheckingInvoice(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repair.ticketDbId, readyForInvoice, depositPaid, taxEnabled, vatRate, nhilGetfundRate, settings?.warranty_days]);

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    onAddNote(repair.id, noteText.trim());
    setNoteText('');
    setAddingNote(false);
  };

  const openPhotoPicker = (stage: RepairMediaStage) => {
    setUploadError('');
    setPromptStage(stage);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const stage = promptStage ?? statusToMediaStage(repair.status);
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      await onAddMedia(repair.id, { file, stage, uploadedBy: uploaderName });
    } catch (err) {
      setUploadError(errMessage(err, 'Upload failed. Try again.'));
    } finally {
      setUploading(false);
      setPromptStage(null);
    }
  };

  const handleAdvanceClick = () => {
    if (requiredStage && !hasRequiredPhoto) { openPhotoPicker(requiredStage); return; }
    onUpdateStatus(repair.id, upcomingStatus);
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
        <span className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Ticket Details</span>
        <div className="flex items-center gap-1.5">
          {canPrintReceipt && (
            <button onClick={handlePrintReceipt} className="w-7 h-7 flex items-center justify-center rounded-lg"
              style={{ color: 'hsl(var(--muted-foreground))' }}
              title="Print pickup receipt"
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
              <Printer className="w-3.5 h-3.5" />
            </button>
          )}
          {canManageTickets && (
            <button onClick={onEdit} className="w-7 h-7 flex items-center justify-center rounded-lg"
              style={{ color: 'hsl(var(--muted-foreground))' }}
              title="Edit"
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {canDeleteTickets && (
            <button onClick={onDelete} className="w-7 h-7 flex items-center justify-center rounded-lg"
              style={{ color: 'hsl(var(--muted-foreground))' }}
              title="Delete"
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'hsl(0 60% 95%)'; el.style.color = 'hsl(0 65% 45%)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = ''; el.style.color = 'hsl(var(--muted-foreground))'; }}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
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
              style={isDxOnly
                ? { background: 'rgba(14,165,233,0.12)', color: '#0ea5e9' }
                : isStraightRepair
                ? { background: 'rgba(34,197,94,0.12)', color: '#22c55e' }
                : { background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>
              {isDxOnly ? <Stethoscope className="w-3 h-3" /> : isStraightRepair ? <Zap className="w-3 h-3" /> : <Scissors className="w-3 h-3" />}
              {isDxOnly ? 'Diagnosis Only' : isStraightRepair ? 'Straight Repair' : 'Full Repair'}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold" style={{ color: 'hsl(var(--foreground))' }}>Progress</p>
            <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>Step {Math.min(currentStep + 1, pipeline.length)} of {pipeline.length}</p>
          </div>
          <div className="flex items-center gap-1 mb-2">
            {pipeline.map((step, i) => (
              <div key={step} className="flex-1 h-1.5 rounded-full" style={{ background: currentStep >= i ? '#22c55e' : 'hsl(var(--muted))' }} />
            ))}
          </div>
          <p className="text-xs font-semibold" style={{ color: '#22c55e' }}>
            {pipeline[Math.min(currentStep, pipeline.length - 1)]}
          </p>
        </div>

        {/* Details */}
        <div className="space-y-2.5 pt-3" style={{ borderTop: '1px solid hsl(var(--border))' }}>
          {[
            ['Customer',       repair.customer],
            ['Technician',     repair.technician || '—'],
            ['Started',        fmtStarted(repair.started)],
            ['ETA',            repair.eta || '—'],
            ['Estimated Cost', repair.cost || '—'],
            ...(depositPaid > 0 ? [['Deposit Paid', `GHS ${depositPaid.toFixed(2)}`]] : []),
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

        {/* Parts Used — real inventory-linked consumption, deducts stock */}
        <div className="pt-3" style={{ borderTop: '1px solid hsl(var(--border))' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold" style={{ color: 'hsl(var(--foreground))' }}>Parts Used</p>
            {!isDone && canUpdateProgress && (
              <button
                onClick={() => setShowAddPart(true)}
                className="text-xs font-medium flex items-center gap-1"
                style={{ color: 'hsl(var(--primary))' }}>
                <Plus className="w-3 h-3" /> Add Part
              </button>
            )}
          </div>
          {ticketParts.length === 0 ? (
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No parts used yet.</p>
          ) : (
            <div className="space-y-2">
              {ticketParts.map(part => (
                <div key={part.id} className="flex items-center justify-between px-3 py-2 rounded-xl"
                  style={{ background: 'hsl(var(--muted))' }}>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>{part.part_name}</p>
                    <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      ×{part.quantity} @ ¢{part.unit_cost.toFixed(2)} = ¢{(part.quantity * part.unit_cost).toFixed(2)}
                    </p>
                  </div>
                  {canUpdateProgress && (
                    <button onClick={() => handleRemoveTicketPart(part)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0"
                      style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Photos */}
        <div className="pt-3" style={{ borderTop: '1px solid hsl(var(--border))' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold" style={{ color: 'hsl(var(--foreground))' }}>Photos</p>
            {!isDone && canUpdateProgress && (
              <button
                onClick={() => openPhotoPicker(statusToMediaStage(repair.status))}
                disabled={uploading}
                className="text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                style={{ color: 'hsl(var(--primary))' }}>
                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                {uploading ? 'Uploading…' : 'Add Photo'}
              </button>
            )}
          </div>

          {requiredStage && !hasRequiredPhoto && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
              style={{ background: 'rgba(245,158,11,0.1)', color: '#b45309' }}>
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] font-medium">
                Attach a {(requiredStage && REQUIRED_MEDIA_STAGE_LABEL[requiredStage]) || 'required'} photo before you can {nextAction(repair.status, repair.jobType).toLowerCase()}.
              </span>
            </div>
          )}

          {uploadError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626' }}>
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] font-medium">{uploadError}</span>
            </div>
          )}

          {media.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {media.map(m => {
                const canDelete = canUpdateProgress || (!!uploaderName && m.uploadedBy === uploaderName);
                return (
                  <a key={m.id} href={m.url} target="_blank" rel="noreferrer"
                    className="relative aspect-square rounded-lg overflow-hidden block group/photo"
                    style={{ background: 'hsl(var(--muted))' }}
                    title={m.caption || m.fileName}>
                    {m.type === 'video' ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                      </div>
                    ) : (
                      <img src={m.url} alt={m.caption || m.fileName} className="w-full h-full object-cover" />
                    )}
                    <span className="absolute bottom-0 left-0 right-0 px-1 py-0.5 text-[8px] font-semibold text-center text-white capitalize truncate"
                      style={{ background: 'rgba(0,0,0,0.55)' }}>
                      {m.stage.replace('_', ' ')}
                    </span>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (window.confirm('Delete this photo?')) onRemoveMedia(repair.id, m.id);
                        }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity"
                        style={{ background: 'rgba(0,0,0,0.6)' }}
                        title="Delete photo"
                      >
                        <Trash2 className="w-3 h-3 text-white" />
                      </button>
                    )}
                  </a>
                );
              })}
            </div>
          ) : (
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No photos yet.</p>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Notes */}
        <div className="pt-3" style={{ borderTop: '1px solid hsl(var(--border))' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold" style={{ color: 'hsl(var(--foreground))' }}>Technician Notes</p>
            {canUpdateProgress && (
              <button onClick={() => setAddingNote(true)} className="text-xs font-medium flex items-center gap-1"
                style={{ color: 'hsl(var(--primary))' }}>
                <Plus className="w-3 h-3" />Add Note
              </button>
            )}
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
      {isClosedDiagnosis ? (
        <div className="px-5 py-4 space-y-2 shrink-0" style={{ borderTop: '1px solid hsl(var(--border))' }}>
          {linkedInvoiceNumber ? (
            <div className="w-full h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Invoice {linkedInvoiceNumber} created
            </div>
          ) : checkingInvoice ? (
            <div className="w-full h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Preparing invoice…
            </div>
          ) : canManageTickets ? (
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="w-full h-10 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
              style={{ background: '#22c55e' }}>
              Create Invoice
            </button>
          ) : (
            <p className="text-[11px] text-center py-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Only a receptionist or admin can create the invoice for this ticket.
            </p>
          )}
          {canUpdateProgress ? (
            <>
              <button
                onClick={() => onProceedToRepair(repair.id)}
                className="w-full h-10 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                style={{ background: '#0ea5e9' }}>
                <ArrowRightCircle className="w-4 h-4" />
                Reopen for Repair
              </button>
              <p className="text-[10px] text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Customer changed their mind and wants to go ahead with the repair.
              </p>
            </>
          ) : (
            <p className="text-[11px] text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Only a technician or admin can reopen this for repair.
            </p>
          )}
        </div>
      ) : isAwaitingDecision ? (
        <div className="px-5 py-4 space-y-2 shrink-0" style={{ borderTop: '1px solid hsl(var(--border))' }}>
          {canUpdateProgress ? (
            <>
              <p className="text-[11px] text-center mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Diagnosis complete — what's next?
              </p>
              <button
                onClick={() => onProceedToRepair(repair.id)}
                className="w-full h-10 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                style={{ background: 'hsl(var(--primary))' }}>
                <ArrowRightCircle className="w-4 h-4" />
                Proceed to Repair
              </button>
              <button
                onClick={() => onCloseDiagnosisOnly(repair.id)}
                className="w-full h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                <XCircle className="w-3.5 h-3.5" />
                Close — Diagnosis Only
              </button>
            </>
          ) : (
            <p className="text-[11px] text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Diagnosis complete — awaiting a technician or admin to proceed to repair or close it.
            </p>
          )}
        </div>
      ) : !isDone && (
        <div className="px-5 py-4 space-y-2 shrink-0" style={{ borderTop: '1px solid hsl(var(--border))' }}>
          {repair.status === 'ready' && (
            linkedInvoiceNumber ? (
              <div className="w-full h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Invoice {linkedInvoiceNumber} created
              </div>
            ) : checkingInvoice ? (
              <div className="w-full h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Preparing invoice…
              </div>
            ) : canManageTickets ? (
              <button
                onClick={() => setShowInvoiceModal(true)}
                className="w-full h-10 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                style={{ background: '#22c55e' }}>
                Create Invoice
              </button>
            ) : (
              <p className="text-[11px] text-center py-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Only a receptionist or admin can create the invoice for this ticket.
              </p>
            )
          )}
          {canUpdateProgress ? (
            <button
              onClick={handleAdvanceClick}
              disabled={uploading}
              className="w-full h-10 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
              style={requiredStage && !hasRequiredPhoto
                ? { background: 'rgba(245,158,11,0.15)', color: '#b45309' }
                : { background: 'hsl(var(--foreground))', color: 'hsl(var(--background))' }}>
              {requiredStage && !hasRequiredPhoto ? <Camera className="w-4 h-4" /> : null}
              {requiredStage && !hasRequiredPhoto ? 'Add Photo to Continue' : nextAction(repair.status, repair.jobType)}
            </button>
          ) : (
            <p className="text-[11px] text-center py-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Only a technician or admin can update this ticket's progress.
            </p>
          )}
          {canUpdateProgress && (
            <button onClick={() => setAddingNote(true)}
              className="w-full h-9 rounded-xl text-xs font-semibold"
              style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
              Add Note
            </button>
          )}
        </div>
      )}

      {showInvoiceModal && (
        <CreateTicketInvoiceModal
          repair={repair}
          depositPaid={depositPaid}
          onClose={() => setShowInvoiceModal(false)}
          onCreated={invoiceNumber => setLinkedInvoiceNumber(invoiceNumber)}
        />
      )}

      {showAddPart && repair.ticketDbId && (
        <AddTicketPartModal
          ticketDbId={repair.ticketDbId}
          onClose={() => setShowAddPart(false)}
          onAdded={loadTicketParts}
        />
      )}
    </div>
  );
}

// ── Board ─────────────────────────────────────────────────────────────────

export default function RepairsBoard() {
  const { setPageTitle } = usePageTitle();
  const { repairs, loading, add, updateStatus, addNote, addMedia, removeMedia, patchRepair, remove } = useRepairs();
  const { technicians } = useTechnicians();
  const { user } = useAuth();
  const canManageTickets = user?.role === 'admin' || user?.role === 'receptionist';
  const canUpdateProgress = user?.role === 'admin' || user?.role === 'technician';
  const canDeleteTickets = user?.role === 'admin';
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [techFilter, setTechFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange>({ from: '', to: '' });
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRepair, setEditingRepair] = useState<Repair | null>(null);

  const selected = selectedId ? (repairs.find(r => r.id === selectedId) ?? null) : null;

  useEffect(() => { setPage(1); }, [query, filter, techFilter, dateRange]);

  useEffect(() => {
    setPageTitle({
      title: 'Tickets',
      subtitle: 'Available jobs — assign technicians and track diagnosis & repair progress',
      hideDefaultAction: true,
    });
    return () => setPageTitle({ title: 'Dashboard' });
  }, [setPageTitle]);

  const unassigned   = useMemo(() => repairs.filter(r => isActiveRepairStatus(r.status) && !r.technician), [repairs]);
  const inDiagnosis  = useMemo(() => repairs.filter(r => isActiveRepairStatus(r.status) && isDiagnosisStage(r)), [repairs]);
  const inRepair     = useMemo(() => repairs.filter(r => isActiveRepairStatus(r.status) && !isDiagnosisStage(r) && r.status !== 'ready'), [repairs]);
  const ready        = useMemo(() => repairs.filter(r => r.status === 'ready'), [repairs]);

  const filterTabs = FILTER_TABS;

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const from = dateRange.from ? new Date(dateRange.from + 'T00:00') : null;
    const to   = dateRange.to   ? new Date(dateRange.to   + 'T23:59:59') : null;
    return repairs.filter(r => {
      if (filter === 'unassigned') {
        if (r.technician) return false;
      } else if (filter === 'in_queue') {
        // Unlike the Technicians module (which has no separate Ready
        // bucket, so it lumps Ready into Queue), this page has its own
        // Ready tab — Queue here means "not yet started and not ready",
        // or the two tabs would show overlapping tickets.
        if (r.status === 'in_progress' || r.status === 'ready' || !isActiveRepairStatus(r.status)) return false;
      } else {
        const matchFilter = filter === 'all' || STATUS[r.status]?.filterKey === filter;
        if (!matchFilter) return false;
      }
      if (techFilter !== 'all' && r.technician !== techFilter) return false;
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
  }, [repairs, filter, techFilter, query, dateRange]);

  const paged = useMemo(() =>
    filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  [filtered, page]);

  const handleUpdateStatus = (id: string, status: RepairStatus) => {
    updateStatus(id, status);
    if (status === 'completed') setSelectedId(null);
  };

  const handleProceedToRepair = (id: string) => {
    patchRepair(id, { jobType: 'diagnosis_to_repair', status: 'parts_pending' });
  };

  const handleCloseDiagnosisOnly = (id: string) => {
    patchRepair(id, { jobType: 'diagnosis_only', status: 'diagnosis_only_closed' });
  };

  const handleDelete = (repair: Repair) => {
    if (!window.confirm(`Delete ${repair.id} (${repair.device})? This can't be undone.`)) return;
    remove(repair.id);
    setSelectedId(null);
  };

  const STATS = [
    { label: 'UNASSIGNED',     value: String(unassigned.length),  icon: UserX,        border: '#f59e0b' },
    { label: 'IN DIAGNOSIS',   value: String(inDiagnosis.length),  icon: Stethoscope,  border: '#0ea5e9' },
    { label: 'IN REPAIR',      value: String(inRepair.length),     icon: Scissors,     border: '#7c3aed' },
    { label: 'READY FOR PICKUP', value: String(ready.length),      icon: CheckCircle2, border: '#22c55e' },
  ] as const;

  const cols = selected ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className="flex h-full -m-6 overflow-hidden">
      {/* Scrollable left section */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 min-w-0">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
            placeholder="Search tickets…"
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
            {technicians.length > 0 && (
              <select value={techFilter} onChange={e => setTechFilter(e.target.value)}
                className="h-8 px-3 rounded-lg text-xs font-semibold outline-none"
                style={{ background: 'transparent', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
                <option value="all">All Technicians</option>
                {technicians.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            )}
            <DateRangePicker value={dateRange} onChange={setDateRange} label="Received date" />
          </div>

          {canManageTickets && (
            <button
              onClick={() => setShowAddModal(true)}
              className="ml-auto flex items-center gap-1.5 px-4 h-9 rounded-xl text-xs font-bold"
              style={{ background: 'hsl(var(--foreground))', color: 'hsl(var(--background))' }}>
              <Plus className="w-3.5 h-3.5" /> New Ticket
            </button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <p className="py-16 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            No tickets match.
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
        <div className="fixed inset-0 z-40 lg:relative lg:inset-auto lg:z-auto lg:w-80 shrink-0 h-full overflow-hidden border-l"
          style={{ borderColor: 'hsl(var(--border))' }}>
          <RepairDetailPanel
            repair={selected}
            onClose={() => setSelectedId(null)}
            onUpdateStatus={handleUpdateStatus}
            onAddNote={addNote}
            onAddMedia={addMedia}
            onRemoveMedia={removeMedia}
            uploaderName={user?.name}
            canManageTickets={canManageTickets}
            canUpdateProgress={canUpdateProgress}
            canDeleteTickets={canDeleteTickets}
            onProceedToRepair={handleProceedToRepair}
            onCloseDiagnosisOnly={handleCloseDiagnosisOnly}
            onEdit={() => setEditingRepair(selected)}
            onDelete={() => handleDelete(selected)}
          />
        </div>
      )}

      {showAddModal && (
        <AddRepairModal
          onSave={async (r) => { await add(r); }}
          onClose={() => setShowAddModal(false)}
          repairs={repairs}
        />
      )}

      {editingRepair && (
        <AddRepairModal
          onSave={async (r) => { await add(r); }}
          onUpdate={patchRepair}
          initial={editingRepair}
          onClose={() => setEditingRepair(null)}
          repairs={repairs}
        />
      )}
    </div>
  );
}
