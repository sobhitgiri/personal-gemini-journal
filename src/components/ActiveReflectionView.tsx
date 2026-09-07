import React, { useState } from 'react';
import Markdown from 'react-markdown';
import {
  Sparkles,
  ArrowLeft,
  Copy,
  Check,
  Trash2,
  Send,
  RefreshCw,
  Clock,
  User as UserIcon,
  Bot,
  AlertCircle,
} from 'lucide-react';
import { Interaction, ReflectionMode } from '../types';

interface ActiveReflectionViewProps {
  interaction: Interaction;
  onBack: () => void;
  onDelete: (id: string) => Promise<void>;
  onSendFollowUp: (interactionId: string, prompt: string) => Promise<void>;
  isReplying: boolean;
  replyError: string | null;
  onClearReplyError: () => void;
}

export const ActiveReflectionView: React.FC<ActiveReflectionViewProps> = ({
  interaction,
  onBack,
  onDelete,
  onSendFollowUp,
  isReplying,
  replyError,
  onClearReplyError,
}) => {
  const [followUpText, setFollowUpText] = useState('');
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCopyAll = async () => {
    try {
      let fullText = `# ${interaction.title}\n\n*Date: ${new Date(
        interaction.createdAt
      ).toLocaleDateString()} | Mode: ${interaction.mode}*\n\n`;

      if (interaction.turns && interaction.turns.length > 0) {
        interaction.turns.forEach((turn) => {
          fullText += `### ${turn.role === 'user' ? 'My Reflection' : 'Gemini AI'}\n\n${turn.text}\n\n---\n\n`;
        });
      } else {
        fullText += `### My Reflection\n\n${interaction.content}\n\n### Gemini AI\n\n${interaction.aiResponse}\n\n`;
      }

      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to permanently delete this journal entry from Firestore?')) {
      setIsDeleting(true);
      try {
        await onDelete(interaction.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpText.trim() || isReplying) return;
    const text = followUpText.trim();
    setFollowUpText('');
    await onSendFollowUp(interaction.id, text);
  };

  const getModeBadge = (mode: ReflectionMode) => {
    switch (mode) {
      case 'reflection':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
            Reflection
          </span>
        );
      case 'brainstorm':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/60">
            Brainstorm
          </span>
        );
      case 'summary':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
            Summary
          </span>
        );
      case 'converse':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-violet-950/80 text-violet-300 border border-violet-800/60">
            Dialogue
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top navigation & action bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <button
          id="btn-back-to-composer"
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-medium text-stone-300 hover:text-white bg-stone-900 hover:bg-stone-800 px-3 py-1.5 rounded-lg border border-stone-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to New Entry</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            id="btn-copy-entry"
            type="button"
            onClick={handleCopyAll}
            className="inline-flex items-center gap-1.5 text-xs text-stone-300 hover:text-white bg-stone-900 hover:bg-stone-800 px-3 py-1.5 rounded-lg border border-stone-800 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy All</span>
              </>
            )}
          </button>

          <button
            id="btn-delete-entry"
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 bg-stone-900 hover:bg-rose-950/40 px-3 py-1.5 rounded-lg border border-stone-800 hover:border-rose-900/60 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
          </button>
        </div>
      </div>

      {/* Header details */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {getModeBadge(interaction.mode)}
          <span className="flex items-center gap-1 text-xs text-stone-400">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            {new Date(interaction.createdAt).toLocaleDateString(undefined, {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-100">
          {interaction.title || 'Journal Reflection'}
        </h1>
      </div>

      {/* Reply Error Banner */}
      {replyError && (
        <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Follow-up Error</p>
              <p className="text-xs text-rose-300 mt-0.5">{replyError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClearReplyError}
            className="text-xs font-medium px-2.5 py-1 rounded-md bg-rose-900/60 hover:bg-rose-800 text-rose-200 transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Multi-turn conversation display */}
      <div className="space-y-6 pt-2">
        {interaction.turns && interaction.turns.length > 0 ? (
          interaction.turns.map((turn, index) => (
            <div
              key={turn.id || index}
              className={`p-5 rounded-2xl border transition-all ${
                turn.role === 'user'
                  ? 'bg-stone-900/70 border-stone-800 ml-4 sm:ml-12'
                  : 'bg-stone-900/95 border-indigo-900/40 mr-4 sm:mr-12 shadow-md shadow-indigo-950/20'
              }`}
            >
              {/* Turn Header */}
              <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-stone-800/60">
                <div className="flex items-center gap-2">
                  {turn.role === 'user' ? (
                    <>
                      <div className="w-6 h-6 rounded-full bg-stone-800 flex items-center justify-center text-stone-300">
                        <UserIcon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-medium text-stone-300">My Reflection</span>
                    </>
                  ) : (
                    <>
                      <div className="w-6 h-6 rounded-full bg-indigo-950 text-indigo-400 flex items-center justify-center border border-indigo-800/60">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-medium text-indigo-300">Gemini 3.6 Flash</span>
                      {turn.modelUsed && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-stone-800 text-stone-400">
                          {turn.modelUsed}
                        </span>
                      )}
                    </>
                  )}
                </div>
                <span className="text-[11px] text-stone-400">
                  {new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Turn Content */}
              {turn.role === 'user' ? (
                <div className="text-sm text-stone-200 whitespace-pre-wrap leading-relaxed">
                  {turn.text}
                </div>
              ) : (
                <div className="markdown-body text-sm text-stone-100 leading-relaxed space-y-3 prose prose-invert prose-stone max-w-none">
                  <Markdown>{turn.text}</Markdown>
                </div>
              )}
            </div>
          ))
        ) : (
          /* Fallback if turns array is empty */
          <>
            <div className="p-5 rounded-2xl bg-stone-900/70 border border-stone-800 ml-4 sm:ml-12">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-stone-800/60">
                <UserIcon className="w-4 h-4 text-stone-400" />
                <span className="text-xs font-medium text-stone-300">My Reflection</span>
              </div>
              <div className="text-sm text-stone-200 whitespace-pre-wrap leading-relaxed">
                {interaction.content}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-stone-900/95 border border-indigo-900/40 mr-4 sm:mr-12 shadow-md shadow-indigo-950/20">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-stone-800/60">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-medium text-indigo-300">Gemini 3.6 Flash</span>
              </div>
              <div className="markdown-body text-sm text-stone-100 leading-relaxed space-y-3 prose prose-invert prose-stone max-w-none">
                <Markdown>{interaction.aiResponse}</Markdown>
              </div>
            </div>
          </>
        )}

        {isReplying && (
          <div className="p-5 rounded-2xl bg-stone-900/90 border border-indigo-900/40 mr-4 sm:mr-12 flex items-center gap-3">
            <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
            <span className="text-xs text-indigo-300">Gemini is reflecting on your follow-up...</span>
          </div>
        )}
      </div>

      {/* Multi-turn continuation input */}
      <div className="pt-6">
        <form
          onSubmit={handleSendReply}
          className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-3"
        >
          <label htmlFor="followup-input" className="block text-xs font-medium text-stone-300">
            Continue this conversation with Gemini
          </label>
          <div className="relative">
            <textarea
              id="followup-input"
              rows={3}
              value={followUpText}
              onChange={(e) => setFollowUpText(e.target.value)}
              placeholder="Ask a question, elaborate on a thought, or request a deeper drilldown..."
              maxLength={4000}
              className="w-full px-4 py-2.5 pb-12 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-400 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
            <div className="absolute right-2.5 bottom-2.5 flex items-center gap-2">
              <button
                id="btn-send-followup"
                type="submit"
                disabled={isReplying || !followUpText.trim()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-xs shadow transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isReplying ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Send</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
