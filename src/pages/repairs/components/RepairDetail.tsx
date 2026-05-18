import { useState } from 'react';
import type { Repair, RepairStatus } from '@/types/repair';
import RepairReceiptModal from './RepairReceiptModal';

const statusConfig: Record<string, { label: string; color: string; dot: string; step: number }> = {
  received:      { label: 'Received',      color: 'bg-slate-100 text-slate-600',    dot: 'bg-slate-400',   step: 1 },
  diagnosed:     { label: 'Diagnosed',     color: 'bg-blue-100 text-blue-700',      dot: 'bg-blue-500',    step: 2 },
  parts_pending: { label: 'Parts Pending', color: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-500',   step: 3 },
  in_progress:   { label: 'In Progress',   color: 'bg-violet-100 text-violet-700',  dot: 'bg-violet-500',  step: 4 },
  ready:         { label: 'Ready',         color: 'bg-emerald-100 text-emerald-700',dot: 'bg-emerald-500', step: 6 },
  completed:     { label: 'Completed',     color: 'bg-emerald-100 text-emerald-700',dot: 'bg-emerald-500', step: 7 },
};

const nextStatus: Record<string, { status: RepairStatus; label: string }> = {
  received:      { status: 'diagnosed',    label: 'Mark Diagnosed' },
  diagnosed:     { status: 'parts_pending',label: 'Request Parts' },
  parts_pending: { status: 'in_progress',  label: 'Start Repair' },
  in_progress:   { status: 'ready',        label: 'Mark Ready' },
  ready:         { status: 'completed',    label: 'Mark Collected' },
};

const timelineSteps = ['Received', 'Diagnosed', 'Parts Pending', 'In Progress', 'Quality Check', 'Ready'];

interface Props {
  repair: Repair;
  onClose: () => void;
  onUpdateStatus: (id: string, status: RepairStatus) => void;
  onAddNote: (id: string, note: string) => void;
}

export default function RepairDetail({ repair, onClose, onUpdateStatus, onAddNote }: Props) {
  const currentStep = statusConfig[repair.status]?.step ?? 1;
  const [addingNote, setAddingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [notified, setNotified] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

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

  const handleNotify = () => {
    setNotified(true);
    setTimeout(() => setNotified(false), 2500);
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

          {/* Progress timeline */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-slate-700 mb-3">Progress</p>
            <div className="relative">
              {timelineSteps.map((step, i) => {
                const isDone = i < currentStep;
                const isCurrent = i === currentStep - 1;
                return (
                  <div key={step} className="flex items-start gap-3 relative">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                        isDone ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-blue-500 text-white ring-4 ring-blue-100' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {isDone ? <i className="ri-check-line text-xs" /> : i + 1}
                      </div>
                      {i < timelineSteps.length - 1 && (
                        <div className={`w-0.5 h-6 ${isDone ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className={`text-xs font-medium ${isCurrent ? 'text-blue-700' : isDone ? 'text-slate-700' : 'text-slate-400'}`}>{step}</p>
                      {isCurrent && <p className="text-[10px] text-slate-400 mt-0.5">In progress</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2 mb-5">
            {[
              { label: 'Customer', value: repair.customer },
              { label: 'Technician', value: repair.technician },
              { label: 'Started', value: repair.started },
              { label: 'ETA', value: repair.eta },
              { label: 'Estimated Cost', value: repair.cost },
              { label: 'Warranty', value: repair.warranty ? 'Yes — Covered' : 'No' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50">
                <span className="text-xs text-slate-500">{label}</span>
                <span className={`text-xs font-medium ${label === 'Warranty' ? (repair.warranty ? 'text-emerald-600' : 'text-slate-400') : 'text-slate-800'}`}>{value}</span>
              </div>
            ))}
          </div>

          {/* Parts */}
          {repair.parts.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-slate-700 mb-2">Parts Status</p>
              <div className="space-y-2">
                {repair.parts.map((part, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-xl">
                    <span className="text-xs text-slate-700">{part.name}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      part.status === 'installed' ? 'bg-emerald-100 text-emerald-700' :
                      part.status === 'ordered' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {part.status === 'installed' ? 'Installed' : part.status === 'ordered' ? 'Ordered' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-slate-50 rounded-xl p-4 mb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-700">Technician Notes</p>
              <button
                onClick={() => setAddingNote(v => !v)}
                className="text-[10px] font-semibold cursor-pointer"
                style={{ color: '#0D1F4A' }}
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
                  onChange={e => setNoteText(e.target.value)}
                  rows={3}
                  autoFocus
                  placeholder="Describe what was done or observed…"
                  className="w-full text-xs rounded-lg px-3 py-2 outline-none resize-none border border-slate-200 bg-white text-slate-700"
                />
                <button
                  onClick={handleSaveNote}
                  disabled={!noteText.trim()}
                  className="w-full py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer disabled:opacity-40"
                  style={{ background: '#0D1F4A' }}
                >
                  Save Note
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {repair.status === 'ready' ? (
              <button
                onClick={handleNotify}
                className="flex-1 py-2.5 text-white text-xs font-semibold rounded-xl cursor-pointer transition-all whitespace-nowrap"
                style={{ background: notified ? '#10B981' : '#0D1F4A' }}
              >
                {notified ? 'Customer Notified ✓' : 'Notify Customer'}
              </button>
            ) : next ? (
              <button
                onClick={handleAdvance}
                className="flex-1 py-2.5 text-white text-xs font-semibold rounded-xl cursor-pointer transition-all whitespace-nowrap"
                style={{ background: '#0D1F4A' }}
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
