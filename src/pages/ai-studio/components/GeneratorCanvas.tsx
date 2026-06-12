import { useState } from 'react';
import { promptTemplates } from '@/mocks/aiStudio';

interface GeneratorCanvasProps {
  selectedTemplate: string | null;
}

const sampleOutputs: Record<string, string> = {};

export default function GeneratorCanvas({ selectedTemplate }: GeneratorCanvasProps) {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('Professional');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const template = promptTemplates.find((t) => t.id === selectedTemplate);

  const handleGenerate = () => {
    if (!selectedTemplate && !prompt.trim()) return;
    setLoading(true);
    setOutput('');
    setTimeout(() => {
      const result = selectedTemplate && sampleOutputs[selectedTemplate]
        ? sampleOutputs[selectedTemplate]
        : `Here's your generated content based on your prompt:\n\n"${prompt}"\n\nThis is a premium AI-generated response tailored for Wireless's brand voice — trustworthy, warm, and conversion-focused. In production, this connects to your AI model for real-time generation.`;
      setOutput(result);
      setLoading(false);
    }, 1800);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full gap-4">

      {/* Template indicator */}
      {template && (
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 border"
          style={{ background: 'rgba(220,31,31,0.06)', borderColor: 'rgba(220,31,31,0.15)' }}
        >
          <i className={`${template.icon} text-xs`} style={{ color: '#DC1F1F' }} />
          <span className="text-xs font-medium" style={{ color: '#DC1F1F' }}>{template.name}</span>
          <span className="text-[10px] text-slate-400 ml-1">— {template.description}</span>
        </div>
      )}

      {/* Prompt input */}
      <div className="flex-1 flex flex-col">
        <label className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Your Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            template
              ? `Describe specifics for "${template.name}"... e.g. customer name, product, context`
              : 'Describe what you want to generate — a follow-up message, product description, campaign copy...'
          }
          className="flex-1 rounded-xl p-4 text-sm text-slate-700 placeholder-slate-300 outline-none resize-none transition-all min-h-[120px]"
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(220,31,31,0.40)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Tone:</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none cursor-pointer"
          >
            {['Professional', 'Friendly', 'Urgent', 'Casual', 'Formal'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="ml-auto flex items-center gap-2 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all cursor-pointer disabled:opacity-50"
          style={{ background: loading ? '#B81616' : '#DC1F1F' }}
          onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#B81616'; }}
          onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#DC1F1F'; }}
        >
          {loading ? (
            <>
              <i className="ri-loader-4-line text-sm animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <i className="ri-sparkling-2-line text-sm" />
              Generate
            </>
          )}
        </button>
      </div>

      {/* Output */}
      {output && (
        <div className="rounded-xl p-4 border border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generated Output</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <i className={`${copied ? 'ri-checkbox-circle-line text-emerald-500' : 'ri-clipboard-line'} text-xs`} />
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                <i className="ri-refresh-line text-xs" />
                Regenerate
              </button>
            </div>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{output}</p>
          <div className="flex gap-2 mt-4">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer" style={{ background: 'rgba(37,211,102,0.12)', color: '#25D366' }}>
              <i className="ri-whatsapp-line text-xs" />
              Send via WhatsApp
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-medium cursor-pointer">
              <i className="ri-save-line text-xs" />
              Save Template
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
