import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Sparkles,
  Lightbulb,
  ListOrdered,
  MessageSquare,
  Clock,
  ArrowRight,
  Trash2,
  Filter,
} from 'lucide-react';
import { Interaction, ReflectionMode } from '../types';

interface HistoryViewProps {
  interactions: Interaction[];
  onSelectInteraction: (interaction: Interaction) => void;
  onDeleteInteraction: (id: string) => Promise<void>;
  onNewReflection: () => void;
  isLoading: boolean;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  interactions,
  onSelectInteraction,
  onDeleteInteraction,
  onNewReflection,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | ReflectionMode>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredInteractions = useMemo(() => {
    return interactions.filter((item) => {
      const matchesFilter = selectedFilter === 'all' || item.mode === selectedFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.content && item.content.toLowerCase().includes(q)) ||
        (item.aiResponse && item.aiResponse.toLowerCase().includes(q));

      return matchesFilter && matchesSearch;
    });
  }, [interactions, selectedFilter, searchQuery]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this journal reflection from your Firestore storage?')) {
      setDeletingId(id);
      try {
        await onDeleteInteraction(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const getModeBadge = (mode: ReflectionMode) => {
    switch (mode) {
      case 'reflection':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 font-medium">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            Reflection
          </span>
        );
      case 'brainstorm':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/60 font-medium">
            <Lightbulb className="w-3 h-3 text-amber-400" />
            Brainstorm
          </span>
        );
      case 'summary':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-medium">
            <ListOrdered className="w-3 h-3 text-emerald-400" />
            Summary
          </span>
        );
      case 'converse':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-violet-950/80 text-violet-300 border border-violet-800/60 font-medium">
            <MessageSquare className="w-3 h-3 text-violet-400" />
            Dialogue
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-100 flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            <span>Reflection History</span>
          </h2>
          <p className="text-sm text-stone-400 mt-1">
            Browse and resume all past journal entries saved in your isolated Cloud Firestore store.
          </p>
        </div>

        <button
          id="btn-history-new"
          type="button"
          onClick={onNewReflection}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors cursor-pointer shadow-sm shadow-indigo-600/30 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>New Reflection</span>
        </button>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-history"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keywords in titles or entries..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 placeholder-stone-400 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-stone-200 text-stone-900 font-semibold'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-800 border border-stone-800'
            }`}
          >
            All ({interactions.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('reflection')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              selectedFilter === 'reflection'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-800 border border-stone-800'
            }`}
          >
            Reflections
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('brainstorm')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              selectedFilter === 'brainstorm'
                ? 'bg-amber-600 text-white font-semibold'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-800 border border-stone-800'
            }`}
          >
            Brainstorms
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('summary')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              selectedFilter === 'summary'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-800 border border-stone-800'
            }`}
          >
            Summaries
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('converse')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              selectedFilter === 'converse'
                ? 'bg-violet-600 text-white font-semibold'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-800 border border-stone-800'
            }`}
          >
            Dialogues
          </button>
        </div>
      </div>

      {/* Entries List */}
      {isLoading ? (
        <div className="py-16 text-center text-stone-400 space-y-3">
          <div className="w-7 h-7 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm">Loading your private Firestore entries...</p>
        </div>
      ) : filteredInteractions.length === 0 ? (
        <div className="py-16 px-4 text-center rounded-2xl bg-stone-900/40 border border-stone-800/80 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-stone-800 text-stone-400 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-medium text-stone-200">
              {searchQuery ? 'No matching reflections found' : 'No journal reflections yet'}
            </p>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              {searchQuery
                ? 'Try adjusting your search terms or filter selection.'
                : 'Write your first thoughts and let Gemini 3.6 Flash provide meaningful insights.'}
            </p>
          </div>
          {!searchQuery && (
            <button
              type="button"
              onClick={onNewReflection}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Start Your First Reflection</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInteractions.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectInteraction(item)}
              className="p-5 rounded-2xl bg-stone-900/80 hover:bg-stone-800/80 border border-stone-800 hover:border-stone-700 transition-all cursor-pointer group shadow-sm hover:shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getModeBadge(item.mode)}
                    <span className="flex items-center gap-1 text-xs text-stone-400">
                      <Clock className="w-3 h-3 text-stone-400" />
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    {item.turns && item.turns.length > 2 && (
                      <span className="text-[10px] text-stone-400 bg-stone-800/80 px-2 py-0.5 rounded">
                        {item.turns.length} turns
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-stone-100 group-hover:text-indigo-300 transition-colors line-clamp-1">
                    {item.title || 'Untitled Reflection'}
                  </h3>

                  <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
                    {item.content}
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-800/60 shrink-0">
                  <span className="inline-flex items-center gap-1 text-xs text-indigo-400 font-medium group-hover:translate-x-0.5 transition-transform">
                    <span>Open thread</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>

                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, item.id)}
                    disabled={deletingId === item.id}
                    title="Delete Entry"
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
