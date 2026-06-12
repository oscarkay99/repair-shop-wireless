import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import type { Repair, RepairMediaStage, RepairStatus } from '@/types/repair';
import { MAX_REPAIR_MEDIA_BYTES, MAX_REPAIR_VIDEO_DURATION_SECONDS } from '@/services/repairs';
import RepairReceiptModal from './RepairReceiptModal';

const statusConfig: Record<string, { label: string; color: string; dot: string; step: number }> = {
  received:      { label: 'Received',      color: 'bg-slate-100 text-slate-600',    dot: 'bg-slate-400',   step: 1 },
  diagnosis_paid:{ label: 'Diagnosis Paid',color: 'bg-sky-100 text-sky-700',        dot: 'bg-sky-500',     step: 1 },
  diagnosing:    { label: 'Diagnosing',    color: 'bg-cyan-100 text-cyan-700',      dot: 'bg-cyan-500',    step: 2 },
  awaiting_approval: { label: 'Awaiting Approval', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', step: 3 },
  parts_pending: { label: 'Parts Pending', color: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-500',   step: 3 },
  in_progress:   { label: 'In Progress',   color: 'bg-cyan-100 text-cyan-700',      dot: 'bg-cyan-500',    step: 4 },
  ready:         { label: 'Ready',         color: 'bg-emerald-100 text-emerald-700',dot: 'bg-emerald-500', step: 6 },
  completed:     { label: 'Completed',     color: 'bg-emerald-100 text-emerald-700',dot: 'bg-emerald-500', step: 7 },
  diagnosis_only_closed: { label: 'Diagnosis Only Closed', color: 'bg-slate-100 text-slate-700', dot: 'bg-slate-500', step: 6 },
  cancelled:     { label: 'Cancelled',     color: 'bg-red-100 text-red-700',        dot: 'bg-red-500',     step: 0 },
};

const nextStatus: Record<string, { status: RepairStatus; label: string }> = {
  received:      { status: 'diagnosis_paid', label: 'Confirm Diagnosis Payment' },
  diagnosis_paid:{ status: 'diagnosing',   label: 'Start Diagnosis' },
  diagnosing:    { status: 'awaiting_approval',label: 'Send Repair Quote' },
  parts_pending: { status: 'in_progress',  label: 'Start Repair' },
  in_progress:   { status: 'ready',        label: 'Mark Ready' },
  ready:         { status: 'completed',    label: 'Mark Collected' },
};

const timelineSteps: Array<{ key: RepairMediaStage; label: string }> = [
  { key: 'received', label: 'Received' },
  { key: 'diagnosed', label: 'Diagnosed' },
  { key: 'parts_pending', label: 'Parts Pending' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'quality_check', label: 'Quality Check' },
  { key: 'ready', label: 'Ready' },
];

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

interface Props {
  repair: Repair;
  onClose: () => void;
  onUpdateStatus: (id: string, status: RepairStatus) => void;
  onPatchRepair: (id: string, patch: Partial<Repair>) => Promise<void>;
  onAddNote: (id: string, note: string) => void;
  onAddMedia: (id: string, input: {
    file: File;
    stage: RepairMediaStage;
    caption?: string;
    uploadedBy?: string;
    durationSeconds?: number;
  }) => Promise<unknown>;
}

function formatBytes(value: number) {
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function formatMediaDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const duration = video.duration;
      URL.revokeObjectURL(url);
      resolve(duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('We could not read this video. Please try another file.'));
    };
    video.src = url;
  });
}

function getStageFromStatus(status: RepairStatus): RepairMediaStage {
  if (status === 'diagnosing') return 'diagnosed';
  if (status === 'awaiting_approval') return 'diagnosed';
  if (status === 'diagnosis_only_closed' || status === 'completed' || status === 'cancelled') return 'ready';
  if (status === 'diagnosis_paid') return 'received';
  if (status === 'received') return 'received';
  if (status === 'parts_pending') return 'parts_pending';
  if (status === 'in_progress') return 'in_progress';
  return 'ready';
}

export default function RepairDetail({ repair, onClose, onUpdateStatus, onPatchRepair, onAddNote, onAddMedia }: Props) {
  const currentStep = statusConfig[repair.status]?.step ?? 1;
  const [addingNote, setAddingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [notified, setNotified] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedStage, setSelectedStage] = useState<RepairMediaStage>('received');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | undefined>(undefined);
  const [mediaCaption, setMediaCaption] = useState('');
  const [mediaError, setMediaError] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [statusError, setStatusError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const currentStage = getStageFromStatus(repair.status);
    setSelectedStage(currentStage);
    setSelectedFile(null);
    setSelectedDuration(undefined);
    setMediaCaption('');
    setMediaError('');
    setStatusError('');
  }, [repair.id, repair.status]);

  const mediaCounts = useMemo(() => {
    return (repair.media ?? []).reduce<Record<string, number>>((acc, item) => {
      acc[item.stage] = (acc[item.stage] ?? 0) + 1;
      return acc;
    }, {});
  }, [repair.media]);

  const stageMedia = useMemo(() => {
    return (repair.media ?? []).filter((item) => item.stage === selectedStage);
  }, [repair.media, selectedStage]);

  const handleSaveNote = () => {
    if (!noteText.trim()) return;
    onAddNote(repair.id, noteText.trim());
    setNoteText('');
    setAddingNote(false);
  };

  const handleAdvance = () => {
    const next = nextStatus[repair.status];
    if (next) onUpdateStatus(repair.id, next.status);
  };

  const handleStatusAction = async (status: RepairStatus) => {
    setStatusError('');
    const now = new Date().toISOString();

    try {
      if (status === 'diagnosis_paid') {
        const hasDiagnosisPayment = (repair.payments ?? []).some((payment) => (
          payment.type === 'diagnosis_fee' && payment.status === 'paid'
        ));

        await onPatchRepair(repair.id, {
          status,
          serviceStage: 'diagnosis',
          diagnosisPaidAt: repair.diagnosisPaidAt ?? now,
          payments: hasDiagnosisPayment
            ? repair.payments
            : [
                {
                  id: crypto.randomUUID(),
                  type: 'diagnosis_fee',
                  amount: repair.diagnosisFee ?? 200,
                  amountLabel: `GHS ${repair.diagnosisFee ?? 200}`,
                  status: 'paid',
                  paidAt: now,
                },
                ...(repair.payments ?? []),
              ],
        });
        return;
      }

      if (status === 'diagnosing') {
        await onPatchRepair(repair.id, {
          status,
          serviceStage: 'diagnosis',
        });
        return;
      }

      if (status === 'awaiting_approval') {
        await onPatchRepair(repair.id, {
          status,
          serviceStage: 'approval',
          quoteStatus: 'pending',
          quoteSentAt: now,
        });
        return;
      }

      if (status === 'in_progress') {
        await onPatchRepair(repair.id, {
          status,
          serviceStage: 'repair',
          repairStartedAt: repair.repairStartedAt ?? now,
        });
        return;
      }

      if (status === 'completed') {
        await onPatchRepair(repair.id, {
          status,
          serviceStage: 'closed',
          completedDate: now.split('T')[0],
        });
        return;
      }

      await onUpdateStatus(repair.id, status);
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : 'Unable to update this repair status.');
    }
  };

  const handleApproveRepair = async () => {
    const now = new Date().toISOString();
    setStatusError('');
    try {
      await onPatchRepair(repair.id, {
        status: 'parts_pending',
        jobType: 'diagnosis_to_repair',
        serviceStage: 'repair',
        quoteStatus: 'approved',
        approvalDecisionAt: now,
      });
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : 'Unable to approve this repair.');
    }
  };

  const handleCloseDiagnosisOnly = async () => {
    const now = new Date().toISOString();
    setStatusError('');
    try {
      await onPatchRepair(repair.id, {
        status: 'diagnosis_only_closed',
        jobType: 'diagnosis_only',
        serviceStage: 'closed',
        quoteStatus: repair.quoteStatus === 'not_sent' ? 'declined' : 'declined',
        approvalDecisionAt: now,
        completedDate: now.split('T')[0],
      });
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : 'Unable to close this job.');
    }
  };

  const handleNotify = () => {
    setNotified(true);
    setTimeout(() => setNotified(false), 2500);
  };

  const validateFile = async (file: File) => {
    if (file.size > MAX_REPAIR_MEDIA_BYTES) {
      throw new Error('Each image or video must be 5MB or less.');
    }

    const isImage = allowedImageTypes.includes(file.type);
    const isVideo = allowedVideoTypes.includes(file.type);

    if (!isImage && !isVideo) {
      throw new Error('Use JPG, PNG, WEBP, MP4, MOV, or WEBM files only.');
    }

    if (isVideo) {
      const duration = await readVideoDuration(file);
      if (duration > MAX_REPAIR_VIDEO_DURATION_SECONDS) {
        throw new Error(`Videos must be ${MAX_REPAIR_VIDEO_DURATION_SECONDS} seconds or shorter.`);
      }
      return duration;
    }

    return undefined;
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setMediaError('');

    try {
      const duration = await validateFile(file);
      setSelectedFile(file);
      setSelectedDuration(duration);
    } catch (error) {
      setSelectedFile(null);
      setSelectedDuration(undefined);
      setMediaError(error instanceof Error ? error.message : 'Unable to use that file.');
    } finally {
      event.target.value = '';
    }
  };

  const handleUploadMedia = async () => {
    if (!selectedFile) return;

    setUploadingMedia(true);
    setMediaError('');

    try {
      await onAddMedia(repair.id, {
        file: selectedFile,
        stage: selectedStage,
        caption: mediaCaption.trim() || undefined,
        uploadedBy: repair.technician,
        durationSeconds: selectedDuration,
      });

      setSelectedFile(null);
      setSelectedDuration(undefined);
      setMediaCaption('');
    } catch (error) {
      setMediaError(error instanceof Error ? error.message : 'Upload failed. Please try again.');
    } finally {
      setUploadingMedia(false);
    }
  };

  const next = nextStatus[repair.status];
  const st = statusConfig[repair.status] ?? statusConfig.received;

  return (
    <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose}>
      <div className="absolute right-0 top-0 bottom-0 w-[440px] bg-white shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-slate-800">Repair Details</h3>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
              <i className="ri-close-line text-base" />
            </button>
          </div>

          <div className="mb-5">
            <p className="text-xs font-mono text-slate-400">{repair.id}</p>
            <h4 className="text-base font-bold text-slate-900 mt-0.5">{repair.device}</h4>
            <p className="text-xs text-slate-500 mt-1">{repair.issue}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <div className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
            </div>
          </div>

          <div className="mb-5">
            <p className="text-xs font-semibold text-slate-700 mb-3">Progress</p>
            <div className="relative">
              {timelineSteps.map((step, i) => {
                const isDone = i < currentStep;
                const isCurrent = i === currentStep - 1;
                const isSelected = selectedStage === step.key;
                const mediaCount = mediaCounts[step.key] ?? 0;
                return (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => setSelectedStage(step.key)}
                    className="flex items-start gap-3 relative text-left w-full cursor-pointer"
                  >
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                        isDone ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-[#DC1F1F] text-white ring-4 ring-[rgba(220,31,31,0.15)]' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {isDone ? <i className="ri-check-line text-xs" /> : i + 1}
                      </div>
                      {i < timelineSteps.length - 1 && (
                        <div className={`w-0.5 h-6 ${isDone ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                      )}
                    </div>
                    <div className={`pb-4 flex-1 rounded-xl px-2 py-1 transition-colors ${isSelected ? 'bg-slate-50' : ''}`}>
                      <div className="flex items-center gap-2">
                        <p className={`text-xs font-medium ${isCurrent ? 'text-[#DC1F1F]' : isDone ? 'text-slate-700' : 'text-slate-400'}`}>{step.label}</p>
                        {mediaCount > 0 && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                            {mediaCount} file{mediaCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      {isCurrent && <p className="text-[10px] text-slate-400 mt-0.5">In progress</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 mb-5">
            {[
              { label: 'Customer', value: repair.customer },
              { label: 'Customer Email', value: repair.customerEmail || 'Not captured yet' },
              { label: 'Customer Phone', value: repair.customerPhone || 'Not captured yet' },
              { label: 'Technician', value: repair.technician },
              { label: 'Started', value: repair.started },
              { label: 'ETA', value: repair.eta },
              { label: 'Diagnosis Fee', value: `GHS ${repair.diagnosisFee ?? 200}` },
              { label: 'Quoted Repair', value: repair.cost },
              { label: 'Warranty', value: repair.warranty ? 'Yes — Covered' : 'No' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50">
                <span className="text-xs text-slate-500">{label}</span>
                <span className={`text-xs font-medium ${label === 'Warranty' ? (repair.warranty ? 'text-emerald-600' : 'text-slate-400') : 'text-slate-800'}`}>{value}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-2xl border border-slate-100 p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Diagnosis</p>
              <p className="text-sm font-semibold text-slate-800">
                {repair.diagnosisPaidAt ? 'Paid' : 'Pending'}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                {repair.diagnosisPaidAt ? formatMediaDate(repair.diagnosisPaidAt) : 'Fee not recorded'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Quote</p>
              <p className="text-sm font-semibold text-slate-800 capitalize">
                {(repair.quoteStatus ?? 'not_sent').replace('_', ' ')}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                {repair.quoteAmount ? `GHS ${repair.quoteAmount}` : 'No quote amount yet'}
              </p>
            </div>
          </div>

          {repair.diagnosisSummary && (
            <div className="rounded-2xl border border-slate-100 p-4 mb-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Diagnosis Summary</p>
              <p className="text-sm text-slate-700 leading-relaxed">{repair.diagnosisSummary}</p>
            </div>
          )}

          {repair.parts.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-slate-700 mb-2">Parts Status</p>
              <div className="space-y-2">
                {repair.parts.map((part, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-xl">
                    <span className="text-xs text-slate-700">{part.name}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      part.status === 'installed' ? 'bg-emerald-100 text-emerald-700' :
                      part.status === 'ordered' ? 'bg-cyan-100 text-cyan-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {part.status === 'installed' ? 'Installed' : part.status === 'ordered' ? 'Ordered' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-slate-50 rounded-xl p-4 mb-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs font-semibold text-slate-700">Stage Media</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Upload photos or short videos for {timelineSteps.find((step) => step.key === selectedStage)?.label.toLowerCase()}.</p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] font-semibold cursor-pointer"
                style={{ color: '#DC1F1F' }}
              >
                + Select File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={[...allowedImageTypes, ...allowedVideoTypes].join(',')}
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                  <i className={`${selectedFile?.type.startsWith('video/') ? 'ri-video-line' : 'ri-image-line'} text-base`} />
                </div>
                <div className="min-w-0 flex-1">
                  {selectedFile ? (
                    <>
                      <p className="text-xs font-semibold text-slate-700 truncate">{selectedFile.name}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {formatBytes(selectedFile.size)}
                        {selectedDuration !== undefined ? ` · ${Math.round(selectedDuration)}s` : ''}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-semibold text-slate-700">No file selected yet</p>
                      <p className="text-[10px] text-slate-400 mt-1">JPG, PNG, WEBP, MP4, MOV, or WEBM. Max 5MB. Videos up to 30 seconds.</p>
                    </>
                  )}
                </div>
              </div>

              <textarea
                value={mediaCaption}
                onChange={(e) => setMediaCaption(e.target.value)}
                rows={2}
                placeholder="Optional caption for this proof upload…"
                className="w-full text-xs rounded-lg px-3 py-2 outline-none resize-none border border-slate-200 bg-white text-slate-700 mt-3"
              />

              {mediaError && (
                <p className="text-[10px] text-red-500 mt-2">{mediaError}</p>
              )}

              <button
                type="button"
                onClick={handleUploadMedia}
                disabled={!selectedFile || uploadingMedia}
                className="w-full mt-3 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer disabled:opacity-40"
                style={{ background: '#DC1F1F' }}
              >
                {uploadingMedia ? 'Uploading...' : 'Upload To This Stage'}
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {stageMedia.length === 0 ? (
                <p className="text-xs text-slate-400">No media uploaded for this stage yet.</p>
              ) : (
                stageMedia.map((item) => (
                  <div key={item.id} className="rounded-xl bg-white border border-slate-200 overflow-hidden">
                    {item.type === 'image' ? (
                      <img src={item.url} alt={item.caption || item.fileName} className="w-full h-40 object-cover bg-slate-100" />
                    ) : (
                      <video src={item.url} controls className="w-full h-40 object-cover bg-slate-950" />
                    )}
                    <div className="p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold text-slate-700 truncate">{item.fileName}</p>
                        <span className="text-[10px] text-slate-400 shrink-0">{formatBytes(item.fileSize)}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {formatMediaDate(item.createdAt)}
                        {item.uploadedBy ? ` · ${item.uploadedBy}` : ''}
                        {item.durationSeconds ? ` · ${Math.round(item.durationSeconds)}s` : ''}
                      </p>
                      {item.caption && (
                        <p className="text-xs text-slate-600 mt-2 leading-relaxed">{item.caption}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 mb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-700">Technician Notes</p>
              <button
                onClick={() => setAddingNote((value) => !value)}
                className="text-[10px] font-semibold cursor-pointer"
                style={{ color: '#DC1F1F' }}
              >
                {addingNote ? 'Cancel' : '+ Add Note'}
              </button>
            </div>
            {repair.notes.length === 0 && !addingNote && (
              <p className="text-xs text-slate-400">No notes yet.</p>
            )}
            {repair.notes.map((note, i) => (
              <p key={i} className="text-xs text-slate-600 leading-relaxed mb-1">• {note}</p>
            ))}
            {addingNote && (
              <div className="mt-2 space-y-2">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                  autoFocus
                  placeholder="Describe what was done or observed…"
                  className="w-full text-xs rounded-lg px-3 py-2 outline-none resize-none border border-slate-200 bg-white text-slate-700"
                />
                <button
                  onClick={handleSaveNote}
                  disabled={!noteText.trim()}
                  className="w-full py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer disabled:opacity-40"
                  style={{ background: '#DC1F1F' }}
                >
                  Save Note
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {repair.status === 'awaiting_approval' ? (
              <>
                <button
                  onClick={handleApproveRepair}
                  className="flex-1 py-2.5 text-white text-xs font-semibold rounded-xl cursor-pointer transition-all whitespace-nowrap"
                  style={{ background: '#DC1F1F' }}
                >
                  Approve Repair
                </button>
                <button
                  onClick={handleCloseDiagnosisOnly}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-all cursor-pointer whitespace-nowrap"
                >
                  Close Diagnosis Only
                </button>
              </>
            ) : repair.status === 'ready' ? (
              <button
                onClick={handleNotify}
                className="flex-1 py-2.5 text-white text-xs font-semibold rounded-xl cursor-pointer transition-all whitespace-nowrap"
                style={{ background: notified ? '#10B981' : '#DC1F1F' }}
              >
                {notified ? 'Customer Notified ✓' : 'Notify Customer'}
              </button>
            ) : next ? (
              <button
                onClick={() => handleStatusAction(next.status)}
                className="flex-1 py-2.5 text-white text-xs font-semibold rounded-xl cursor-pointer transition-all whitespace-nowrap"
                style={{ background: '#DC1F1F' }}
              >
                {next.label}
              </button>
            ) : null}
            <button
              onClick={() => setAddingNote(true)}
              className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-all cursor-pointer whitespace-nowrap"
            >
              Add Note
            </button>
          </div>

          {statusError && (
            <p className="text-[10px] text-red-500 mt-2">{statusError}</p>
          )}

          <button
            onClick={() => setShowReceipt(true)}
            className="w-full mt-2 py-2.5 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <i className="ri-receipt-line text-sm" />
            {repair.status === 'ready' || repair.status === 'completed' ? 'View Receipt' : 'View Job Card'}
          </button>
        </div>
      </div>

      {showReceipt && (
        <RepairReceiptModal repair={repair} onClose={() => setShowReceipt(false)} />
      )}
    </div>
  );
}
