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
        : `Here's your generated content based on your prompt:\n\n"${prompt}"\n\nThis is a premium AI-generated response tailored for FixHub's brand voice — trustworthy, warm, and conversion-focused. In production, this connects to your AI model for real-time generation.`;
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
        <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2.5">
          <div className="w-4 h-4 flex items-center justify-center text-blue-400">
            <i className={`${template.icon} text-xs`} />
          </div>
          <span className="text-xs text-blue-300 font-medium">{template.name}</span>
          <span className="text-[10px] text-white/30 ml-1">— {template.description}</span>
        </div>
      )}

      {/* Prompt input */}
      <div className="flex-1 flex flex-col">
        <label className="text-xs text-white/40 mb-2 uppercase tracking-widest">Your Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={template ? `Describe specifics for "${template.name}"... e.g. customer name, product, context` : 'Describe what you want to generate — a follow-up message, product description, campaign copy...'}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white/80 placeholder-white/20 outline-none resize-none focus:border-blue-500/50 transition-all min-h-[120px]"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs text-white/40">Tone:</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/70 outline-none cursor-pointer"
          >
            {['Professional', 'Friendly', 'Urgent', 'Casual', 'Formal'].map((t) => (
              <option key={t} value={t} className="bg-slate-800">{t}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="ml-auto flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all cursor-pointer whitespace-nowrap"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-loader-4-line text-sm animate-spin" />
              </div>
              Generating...
            </>
          ) : (
            <>
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-sparkling-2-line text-sm" />
              </div>
              Generate
            </>
          )}
        </button>
      </div>

      {/* Output */}
      {output && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-white/40 uppercase tracking-widest">Generated Output</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className={`${copied ? 'ri-checkbox-circle-line text-emerald-400' : 'ri-clipboard-line'} text-xs`} />
                </div>
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors cursor-pointer">
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-refresh-line text-xs" />
                </div>
                Regenerate
              </button>
            </div>
          </div>
          <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">{output}</p>
          <div className="flex gap-2 mt-4">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366]/20 text-[#25D366] text-xs font-medium cursor-pointer whitespace-nowrap">
              <div className="w-3 h-3 flex items-center justify-center">
                <i className="ri-whatsapp-line text-xs" />
              </div>
              Send via WhatsApp
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white/60 text-xs font-medium cursor-pointer whitespace-nowrap">
              <div className="w-3 h-3 flex items-center justify-center">
                <i className="ri-save-line text-xs" />
              </div>
              Save Template
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
