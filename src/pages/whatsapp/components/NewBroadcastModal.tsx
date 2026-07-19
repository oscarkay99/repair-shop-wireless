interface NewBroadcastModalProps {
  open: boolean;
  onClose: () => void;
}

export default function NewBroadcastModal({ open, onClose }: NewBroadcastModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800">New Broadcast Campaign</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 cursor-pointer">
            <i className="ri-close-line text-slate-500" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Campaign Name</label>
            <input className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-400" placeholder="e.g. May Flash Sale" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Target Segment</label>
            <select className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-400">
              <option>All Customers</option>
              <option>VIP Customers</option>
              <option>Warm Leads</option>
              <option>Repair Customers</option>
              <option>At-Risk Customers</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Message</label>
            <textarea className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-400 resize-none" rows={4} placeholder="Type your broadcast message..." maxLength={500} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Schedule</label>
            <input type="datetime-local" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-400" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap">Cancel</button>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold cursor-pointer whitespace-nowrap hover:opacity-90" style={{ background: '#EC0118' }}>Schedule Broadcast</button>
        </div>
      </div>
    </div>
  );
}
