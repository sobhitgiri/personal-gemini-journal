import React from 'react';
import { Sparkles, LogOut, ShieldCheck, LogIn, BookOpen } from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onNewReflection: () => void;
  onOpenHistory: () => void;
  activeView: 'compose' | 'view' | 'history';
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onSignIn,
  onSignOut,
  onNewReflection,
  onOpenHistory,
  activeView,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-stone-900/90 backdrop-blur-md border-b border-stone-800 text-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight text-lg text-stone-100">
                Gemini Reflection Journal
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                <ShieldCheck className="w-3 h-3" />
                Isolated Firestore
              </span>
            </div>
            <p className="text-xs text-stone-400 hidden sm:block">
              Private AI reflections with Gemini 3.6 Flash
            </p>
          </div>
        </div>

        {/* Navigation & User actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <button
                id="btn-nav-history"
                type="button"
                onClick={onOpenHistory}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  activeView === 'history'
                    ? 'bg-stone-800 text-white'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Journal History</span>
              </button>

              <button
                id="btn-nav-compose"
                type="button"
                onClick={onNewReflection}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  activeView === 'compose'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-stone-800 text-indigo-300 hover:bg-stone-700 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">New Entry</span>
              </button>

              {/* User profile dropdown / sign out */}
              <div className="flex items-center gap-2 pl-2 border-l border-stone-800">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User profile'}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full border border-stone-700 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-900/60 border border-indigo-700 flex items-center justify-center text-xs font-semibold text-indigo-300">
                    {user.email ? user.email.slice(0, 2).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-medium text-stone-200 truncate max-w-[120px]">
                    {user.displayName || user.email?.split('@')[0]}
                  </div>
                  <div className="text-[10px] text-stone-400 truncate max-w-[120px]">
                    {user.email}
                  </div>
                </div>

                <button
                  id="btn-header-signout"
                  type="button"
                  onClick={onSignOut}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-800/80 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <button
              id="btn-header-signin"
              type="button"
              onClick={onSignIn}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In with Google</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
