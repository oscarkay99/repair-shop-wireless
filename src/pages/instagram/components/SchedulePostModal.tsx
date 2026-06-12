const igGradient = 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)';

interface SchedulePostModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SchedulePostModal({ open, onClose }: SchedulePostModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: igGradient }}>
              <i className="ri-instagram-line text-white text-sm" />
            </div>
            <h3 className="font-bold text-slate-800">Schedule New Post</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 cursor-pointer">
            <i className="ri-close-line text-slate-500" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Post Type</label>
            <div className="flex gap-2">
              {['Reel', 'Carousel', 'Photo', 'Story'].map(t => (
                <button key={t} className="flex-1 py-2 rounded-xl border-2 border-slate-100 text-xs font-medium text-slate-600 hover:border-pink-300 cursor-pointer whitespace-nowrap transition-all">
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Caption</label>
            <textarea className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none resize-none" rows={3} placeholder="Write your caption... #WirelessGhana" maxLength={500} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Schedule Date & Time</label>
            <input type="datetime-local" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Boost Budget (optional)</label>
            <input className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none" placeholder="e.g. GHS 200" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap">Cancel</button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold cursor-pointer whitespace-nowrap hover:opacity-90"
            style={{ background: igGradient }}
          >
            Schedule Post
          </button>
        </div>
      </div>
    </div>
  );
}
