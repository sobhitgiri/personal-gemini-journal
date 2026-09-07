import React, { useState } from 'react';
import { Sparkles, Brain, ListOrdered, MessageSquare, Lightbulb, AlertCircle, RefreshCw } from 'lucide-react';
import { ReflectionMode } from '../types';

interface ReflectionComposerProps {
  onSubmit: (title: string, content: string, mode: ReflectionMode) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
  onClearError: () => void;
}

const PROMPT_TEMPLATES = [
  'Reflecting on a recent challenge and what it revealed about my strengths...',
  'A tough decision I am weighing between two paths forward...',
  'What energized me most today versus what subtly drained my focus...',
  'A goal I want to explore fresh, creative angles to achieve this month...',
];

export const ReflectionComposer: React.FC<ReflectionComposerProps> = ({
  onSubmit,
  isSubmitting,
  error,
  onClearError,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mode, setMode] = useState<ReflectionMode>('reflection');

  const MAX_CHARS = 10000;
  const remainingChars = MAX_CHARS - content.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;
    await onSubmit(title.trim(), content.trim(), mode);
  };

  const handleTemplateClick = (template: string) => {
    if (!content) {
      setContent(template);
    } else {
      setContent((prev) => `${prev}\n\n${template}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Intro Header */}
      <div className="mb-6 space-y-2">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-100">
          New Journal Reflection
        </h2>
        <p className="text-sm text-stone-400">
          Capture your thoughts and let Gemini 3.6 Flash analyze, reflect, or brainstorm with you.
        </p>
      </div>

      {/* Error banner with retry guarantee */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Persistence / Generation Error</p>
              <p className="text-xs text-rose-300 mt-0.5">{error}</p>
              <p className="text-[11px] text-rose-400 mt-1">
                Your draft has been kept safe in the editor below. You can retry immediately.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClearError}
            className="text-xs font-medium px-2.5 py-1 rounded-md bg-rose-900/60 hover:bg-rose-800 text-rose-200 transition-colors cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Mode selection tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        <button
          id="tab-mode-reflection"
          type="button"
          onClick={() => setMode('reflection')}
          className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            mode === 'reflection'
              ? 'bg-indigo-950/60 border-indigo-500/80 text-white shadow-md shadow-indigo-950/40'
              : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className={`w-4 h-4 ${mode === 'reflection' ? 'text-indigo-400' : 'text-stone-500'}`} />
            <span className="text-xs font-semibold uppercase tracking-wider">Reflection</span>
          </div>
          <span className="text-[11px] text-stone-400">Deep emotional insights & self-inquiry</span>
        </button>

        <button
          id="tab-mode-brainstorm"
          type="button"
          onClick={() => setMode('brainstorm')}
          className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            mode === 'brainstorm'
              ? 'bg-amber-950/60 border-amber-500/80 text-white shadow-md shadow-amber-950/40'
              : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb className={`w-4 h-4 ${mode === 'brainstorm' ? 'text-amber-400' : 'text-stone-500'}`} />
            <span className="text-xs font-semibold uppercase tracking-wider">Brainstorm</span>
          </div>
          <span className="text-[11px] text-stone-400">Creative angles & practical solutions</span>
        </button>

        <button
          id="tab-mode-summary"
          type="button"
          onClick={() => setMode('summary')}
          className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            mode === 'summary'
              ? 'bg-emerald-950/60 border-emerald-500/80 text-white shadow-md shadow-emerald-950/40'
              : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <ListOrdered className={`w-4 h-4 ${mode === 'summary' ? 'text-emerald-400' : 'text-stone-500'}`} />
            <span className="text-xs font-semibold uppercase tracking-wider">Summary</span>
          </div>
          <span className="text-[11px] text-stone-400">Executive takeaways & clarity</span>
        </button>

        <button
          id="tab-mode-converse"
          type="button"
          onClick={() => setMode('converse')}
          className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            mode === 'converse'
              ? 'bg-violet-950/60 border-violet-500/80 text-white shadow-md shadow-violet-950/40'
              : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className={`w-4 h-4 ${mode === 'converse' ? 'text-violet-400' : 'text-stone-500'}`} />
            <span className="text-xs font-semibold uppercase tracking-wider">Dialogue</span>
          </div>
          <span className="text-[11px] text-stone-400">Open-ended conversational chat</span>
        </button>
      </div>

      {/* Main Composer Card */}
      <form
        onSubmit={handleSubmit}
        className="p-6 rounded-2xl bg-stone-900/80 border border-stone-800 shadow-xl space-y-5"
      >
        {/* Title Input */}
        <div>
          <label htmlFor="journal-title" className="block text-xs font-medium text-stone-300 mb-1.5">
            Entry Title <span className="text-stone-400">(Optional — Gemini will title it if left blank)</span>
          </label>
          <input
            id="journal-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Reflections on Leadership & Work-Life Balance"
            maxLength={120}
            className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-400 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Prompt Inspiration Templates */}
        <div>
          <span className="text-xs text-stone-400 block mb-2 font-medium">Inspiration Sparks:</span>
          <div className="flex flex-wrap gap-2">
            {PROMPT_TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleTemplateClick(tmpl)}
                className="text-xs px-3 py-1.5 rounded-lg bg-stone-800/70 hover:bg-stone-800 text-stone-300 hover:text-stone-100 border border-stone-700/50 transition-colors text-left cursor-pointer"
              >
                + {tmpl.slice(0, 48)}...
              </button>
            ))}
          </div>
        </div>

        {/* Textarea */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="journal-content" className="block text-xs font-medium text-stone-300">
              Your Reflection / Journal Notes <span className="text-rose-400">*</span>
            </label>
            <span
              className={`text-[11px] ${
                remainingChars < 200 ? 'text-amber-400 font-semibold' : 'text-stone-400'
              }`}
            >
              {content.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
            </span>
          </div>
          <textarea
            id="journal-content"
            required
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write down what's on your mind. What went well? What caused friction? What questions are sitting with you right now?..."
            maxLength={MAX_CHARS}
            className="w-full px-4 py-3 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-400 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-y leading-relaxed font-normal"
          />
        </div>

        {/* Action bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-stone-800/80">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <Brain className="w-4 h-4 text-indigo-400" />
            <span>AI Model: </span>
            <span className="text-stone-300 font-medium bg-stone-800 px-2 py-0.5 rounded-md">
              Gemini 3.6 Flash
            </span>
          </div>

          <div className="flex items-center gap-3">
            {content && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Clear current journal draft?')) {
                    setContent('');
                    setTitle('');
                  }
                }}
                className="text-xs text-stone-400 hover:text-stone-200 px-3 py-2 cursor-pointer transition-colors"
              >
                Clear
              </button>
            )}

            <button
              id="btn-submit-reflection"
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Reflecting with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Reflect with Gemini</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
