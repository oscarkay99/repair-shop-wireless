import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useStaffDocuments } from '@/hooks/useStaffDocuments';
import type { StaffDocument, StaffDocumentCategory } from '@/services/wireless/staffDocuments';

const CATEGORY_LABEL: Record<StaffDocumentCategory, string> = {
  contract: 'Contract',
  id: 'ID',
  certificate: 'Certificate',
  performance: 'Performance',
  disciplinary: 'Disciplinary',
  payroll: 'Payroll',
  other: 'Other',
};

function formatSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UploadDocumentModal({ onSave, onClose }: {
  onSave: (file: File, meta: { category: StaffDocumentCategory; title?: string; notes?: string; confidential?: boolean }) => Promise<unknown>;
  onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<StaffDocumentCategory>('other');
  const [title, setTitle] = useState('');
  const [confidential, setConfidential] = useState(false);
  const [saving, setSaving] = useState(false);

  const inputCls = "w-full h-9 px-3 rounded-lg text-sm outline-none";
  const inputStyle = { background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setSaving(true);
    try {
      await onSave(file, { category, title: title.trim() || undefined, confidential });
      onClose();
    } finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <h3 className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Upload Document</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
            <X className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>File *</label>
            <input ref={fileRef} type="file" onChange={e => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-xs" required />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value as StaffDocumentCategory)} className={inputCls} style={inputStyle}>
              {Object.entries(CATEGORY_LABEL).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Optional label" className={inputCls} style={inputStyle} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={confidential} onChange={e => setConfidential(e.target.checked)} />
            <span className="text-xs" style={{ color: 'hsl(var(--foreground))' }}>Confidential — hidden from the staff member's own view</span>
          </label>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 h-9 rounded-lg text-xs font-semibold" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>Cancel</button>
            <button type="submit" disabled={saving || !file} className="flex-1 h-9 rounded-lg text-xs font-semibold text-white disabled:opacity-50" style={{ background: 'hsl(var(--primary))' }}>
              {saving ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

interface Props {
  profileId: string;
}

export default function StaffDocumentsTab({ profileId }: Props) {
  const { user } = useAuth();
  const canManage = !!user?.permissions?.includes('hr_documents:manage') || user?.role === 'admin';
  const { documents, signedUrls, loading, upload, remove } = useStaffDocuments(profileId);
  const [showUpload, setShowUpload] = useState(false);

  const handleDelete = (doc: StaffDocument) => {
    if (!confirm(`Delete "${doc.file_name}"? This can't be undone.`)) return;
    remove(doc);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Documents ({documents.length})</p>
        {canManage && (
          <button onClick={() => setShowUpload(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
            style={{ background: '#EC0118' }}>
            <i className="ri-upload-2-line mr-1" /> Upload
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-xs py-6 text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</p>
      ) : documents.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <i className="ri-folder-open-line text-2xl mb-2" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No documents in this staff member's folder</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map(doc => (
            <div key={doc.id} className="rounded-xl p-4 flex items-center gap-3" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(236,1,24,0.08)' }}>
                <i className="ri-file-text-line text-sm" style={{ color: '#EC0118' }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>{doc.title || doc.file_name}</p>
                <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {CATEGORY_LABEL[doc.category]} · {formatSize(doc.file_size)}
                  {doc.confidential && ' · Confidential'}
                  {' · '}{new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {signedUrls[doc.file_path] && (
                  <a href={signedUrls[doc.file_path]} target="_blank" rel="noreferrer"
                    className="text-xs font-semibold px-3 h-8 rounded-lg flex items-center whitespace-nowrap"
                    style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}>
                    View
                  </a>
                )}
                {canManage && (
                  <button onClick={() => handleDelete(doc)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--muted))' }}>
                    <i className="ri-delete-bin-line text-sm text-red-500" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showUpload && (
        <UploadDocumentModal onSave={upload} onClose={() => setShowUpload(false)} />
      )}
    </div>
  );
}
