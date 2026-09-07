import React from 'react';
import { Sparkles, Shield, Lock, Brain, MessageSquare, History, ArrowRight } from 'lucide-react';

interface LandingViewProps {
  onSignIn: () => void;
  isLoading: boolean;
  authError: string | null;
}

export const LandingView: React.FC<LandingViewProps> = ({ onSignIn, isLoading, authError }) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl w-full text-center space-y-8">
        {/* Top badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Powered by Gemini 3.6 Flash & Cloud Firestore</span>
        </div>

        {/* Hero headline & description */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-stone-100 leading-tight">
            Your Private AI Journal <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-300">
              for Mindful Self-Reflection
            </span>
          </h1>
          <p className="text-base sm:text-lg text-stone-400 max-w-2xl mx-auto leading-relaxed">
            Express your thoughts freely. Engage in multi-turn dialogues, explore brainstorming angles,
            and gain summaries — all securely isolated to your private account in Cloud Firestore.
          </p>
        </div>

        {/* Error notification banner */}
        {authError && (
          <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-200 text-sm max-w-md mx-auto text-left">
            <span className="font-semibold">Authentication Notice:</span> {authError}
          </div>
        )}

        {/* Main CTA */}
        <div className="pt-2">
          <button
            id="btn-landing-signin"
            type="button"
            onClick={onSignIn}
            disabled={isLoading}
            className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-base shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Sign In with Google</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <p className="text-xs text-stone-400 mt-2">
            Instant federated sign-in • No passwords stored • Zero tracking cookies
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left pt-6">
          <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-2">
            <div className="w-9 h-9 rounded-lg bg-indigo-950/80 border border-indigo-800/40 text-indigo-400 flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-stone-200">Gemini 3.6 Flash</h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Provides deep reflections, structured summaries, and creative brainstorming tailored to your mindset.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-stone-200">Strict Data Isolation</h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Entries are stored under your unique user UID in Cloud Firestore with hardened, owner-bound security rules.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-2">
            <div className="w-9 h-9 rounded-lg bg-violet-950/80 border border-violet-800/40 text-violet-400 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-stone-200">Continuous Dialogue</h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Resume prior reflections at any time with multi-turn conversations and keyword-filtered history.
            </p>
          </div>
        </div>

        {/* Security transparency footer */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-stone-400 border-t border-stone-800/60">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-stone-400" />
            <span>Server-side Secret Management</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-stone-400" />
            <span>Zero Default-Allow Firestore Rules</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-stone-400" />
            <span>Resilient Gemini Fallback Ladder</span>
          </div>
        </div>
      </div>
    </div>
  );
};
