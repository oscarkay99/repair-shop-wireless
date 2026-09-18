interface ScheduleVideoModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ScheduleVideoModal({ open, onClose }: ScheduleVideoModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">Schedule New Video</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 cursor-pointer">
            <i className="ri-close-line text-slate-400" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Caption</label>
            <textarea className="w-full px-4 py-3 rounded-xl bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 resize-none" rows={3} placeholder="Write your caption..." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Schedule Date</label>
              <input type="date" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Time</label>
              <input type="time" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200" />
            </div>
          </div>
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
            <i className="ri-video-upload-line text-3xl text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">Drop video here or click to upload</p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap"
            style={{ background: 'linear-gradient(135deg, #FE2C55, #25F4EE)' }}
          >
            Schedule Video
          </button>
        </div>
      </div>
    </div>
  );
}
