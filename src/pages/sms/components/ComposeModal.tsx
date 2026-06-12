interface SmsTemplate { id: string; name: string; message: string }
interface SmsSegment { id: string; name: string; count: number }

interface Props {
  templates: SmsTemplate[];
  segments: SmsSegment[];
  selectedTemplate: string;
  selectedSegment: string;
  messageText: string;
  onTemplateChange: (id: string) => void;
  onSegmentChange: (id: string) => void;
  onMessageChange: (text: string) => void;
  onClose: () => void;
}

export default function ComposeModal({
  templates, segments, selectedTemplate, selectedSegment,
  messageText, onTemplateChange, onSegmentChange, onMessageChange, onClose
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">Compose SMS Campaign</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 cursor-pointer">
            <i className="ri-close-line text-slate-400" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Campaign Name</label>
            <input type="text" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200" placeholder="e.g. Weekend Flash Sale" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Select Template</label>
            <select
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
              value={selectedTemplate}
              onChange={(e) => {
                const t = templates.find(t => t.id === e.target.value);
                onTemplateChange(e.target.value);
                if (t) onMessageChange(t.message);
              }}
            >
              <option value="">No template (custom message)</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Target Segment</label>
            <select
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
              value={selectedSegment}
              onChange={(e) => onSegmentChange(e.target.value)}
            >
              <option value="">Select audience...</option>
              {segments.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.count.toLocaleString()})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Message</label>
            <textarea
              value={messageText}
              onChange={(e) => onMessageChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 resize-none"
              rows={4}
              placeholder="Type your message..."
              maxLength={500}
            />
            <p className="text-[10px] text-slate-400 mt-1 text-right">{messageText.length}/500 chars · {Math.ceil(messageText.length / 160)} SMS</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Schedule Date</label>
              <input type="date" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Time</label>
              <input type="time" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200" />
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl">
            <i className="ri-information-line text-amber-500" />
            <p className="text-xs text-amber-700">Promotional SMS can only be sent between 8AM - 8PM per NCA regulations.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold text-slate-500 border border-slate-200 cursor-pointer whitespace-nowrap">
              Save Draft
            </button>
            <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap" style={{ background: '#DC1F1F' }}>
              Send Campaign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
