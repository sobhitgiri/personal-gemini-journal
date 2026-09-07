import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  auth,
  signInWithGoogle,
  signOutUser,
  testConnection,
  saveInteraction,
  updateInteraction,
  deleteInteraction,
  subscribeUserInteractions,
} from './lib/firebase';
import { Interaction, InteractionTurn, ReflectionMode } from './types';
import { Header } from './components/Header';
import { LandingView } from './components/LandingView';
import { ReflectionComposer } from './components/ReflectionComposer';
import { ActiveReflectionView } from './components/ActiveReflectionView';
import { HistoryView } from './components/HistoryView';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Firestore sync state
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [interactionsLoading, setInteractionsLoading] = useState(false);
  const [activeInteractionId, setActiveInteractionId] = useState<string | null>(null);

  // Active view: 'compose' | 'view' | 'history'
  const [activeView, setActiveView] = useState<'compose' | 'view' | 'history'>('compose');

  // Async action states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);

  const [isReplying, setIsReplying] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  // 1. Initial Firestore connectivity verification
  useEffect(() => {
    testConnection().then((connected) => {
      if (!connected) {
        console.warn('Firestore initial test connection note: Operating in standard mode.');
      }
    });
  }, []);

  // 2. Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);
        if (!currentUser) {
          setInteractions([]);
          setActiveInteractionId(null);
          setActiveView('compose');
        }
      },
      (error) => {
        console.error('Auth state listener error:', error);
        setAuthError(error.message);
        setAuthLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 3. Subscribe to real-time interactions when authenticated
  useEffect(() => {
    if (!user) return;

    setInteractionsLoading(true);
    const unsubscribe = subscribeUserInteractions(
      user.uid,
      (data) => {
        setInteractions(data);
        setInteractionsLoading(false);
      },
      (err) => {
        console.error('Error fetching user interactions from Firestore:', err);
        setInteractionsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Auth Handlers
  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Sign-in error:', err);
      // Suppress popup closed by user or display helpful message
      if (err?.code !== 'auth/popup-closed-by-user') {
        setAuthError(err?.message || 'Failed to sign in with Google.');
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (err: any) {
      console.error('Sign-out error:', err);
    }
  };

  // Create new journal reflection with Gemini API
  const handleCreateReflection = async (
    title: string,
    content: string,
    mode: ReflectionMode
  ) => {
    if (!user) {
      setComposerError('You must be signed in to reflect.');
      return;
    }

    setIsSubmitting(true);
    setComposerError(null);

    try {
      // 1. Call server-side Express Gemini endpoint
      const response = await fetch('/api/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: content,
          mode,
          title: title || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error (${response.status})`);
      }

      const data = await response.json();
      const generatedTitle = data.title || title || 'Journal Reflection';
      const aiResponse = data.aiResponse;
      const modelUsed = data.modelUsed;

      const now = new Date().toISOString();
      const interactionId = `int_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      // 2. Prepare Interaction Document for Firestore
      const newInteraction: Interaction = {
        id: interactionId,
        userId: user.uid,
        title: generatedTitle,
        content,
        mode,
        aiResponse,
        turns: [
          {
            id: `turn_1_${Date.now()}`,
            role: 'user',
            text: content,
            timestamp: now,
          },
          {
            id: `turn_2_${Date.now()}`,
            role: 'model',
            text: aiResponse,
            timestamp: new Date().toISOString(),
            modelUsed,
          },
        ],
        createdAt: now,
        updatedAt: now,
      };

      // 3. Guaranteed Persistence Verification: Save to Cloud Firestore
      await saveInteraction(user.uid, newInteraction);

      // 4. Update UI State to display active reflection
      setActiveInteractionId(newInteraction.id);
      setActiveView('view');
    } catch (err: any) {
      console.error('Failed to create or persist reflection:', err);
      // Ensure input is not wiped and user gets clear feedback with retry capability
      setComposerError(err?.message || 'An error occurred while generating or saving your reflection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Multi-turn follow up conversation
  const handleSendFollowUp = async (interactionId: string, prompt: string) => {
    if (!user) return;
    const current = interactions.find((item) => item.id === interactionId);
    if (!current) return;

    setIsReplying(true);
    setReplyError(null);

    try {
      // Build history payload for Gemini
      const historyPayload = (current.turns || []).map((t) => ({
        role: t.role,
        text: t.text,
      }));

      const response = await fetch('/api/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          mode: current.mode,
          history: historyPayload,
          title: current.title,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error (${response.status})`);
      }

      const data = await response.json();
      const now = new Date().toISOString();

      const newTurns: InteractionTurn[] = [
        ...(current.turns || []),
        {
          id: `turn_user_${Date.now()}`,
          role: 'user',
          text: prompt,
          timestamp: now,
        },
        {
          id: `turn_model_${Date.now()}`,
          role: 'model',
          text: data.aiResponse,
          timestamp: new Date().toISOString(),
          modelUsed: data.modelUsed,
        },
      ];

      // Update Firestore document
      await updateInteraction(user.uid, interactionId, {
        turns: newTurns,
        aiResponse: data.aiResponse,
        updatedAt: now,
      });
    } catch (err: any) {
      console.error('Follow-up turn failed:', err);
      setReplyError(err?.message || 'Failed to send follow-up message.');
    } finally {
      setIsReplying(false);
    }
  };

  // Delete an interaction
  const handleDeleteInteraction = async (id: string) => {
    if (!user) return;
    try {
      await deleteInteraction(user.uid, id);
      if (activeInteractionId === id) {
        setActiveInteractionId(null);
        setActiveView('history');
      }
    } catch (err: any) {
      console.error('Delete interaction failed:', err);
      alert('Failed to delete interaction: ' + err.message);
    }
  };

  // Find current active interaction object
  const activeInteraction = interactions.find((item) => item.id === activeInteractionId) || null;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <p className="text-sm text-stone-400">Verifying secure Firebase authentication...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top persistent header */}
      <Header
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onNewReflection={() => {
          setActiveInteractionId(null);
          setActiveView('compose');
        }}
        onOpenHistory={() => setActiveView('history')}
        activeView={activeView}
      />

      {/* Main View Area */}
      <main className="pb-16">
        {!user ? (
          <LandingView
            onSignIn={handleSignIn}
            isLoading={authLoading}
            authError={authError}
          />
        ) : activeView === 'compose' ? (
          <ReflectionComposer
            onSubmit={handleCreateReflection}
            isSubmitting={isSubmitting}
            error={composerError}
            onClearError={() => setComposerError(null)}
          />
        ) : activeView === 'view' && activeInteraction ? (
          <ActiveReflectionView
            interaction={activeInteraction}
            onBack={() => {
              setActiveInteractionId(null);
              setActiveView('compose');
            }}
            onDelete={handleDeleteInteraction}
            onSendFollowUp={handleSendFollowUp}
            isReplying={isReplying}
            replyError={replyError}
            onClearReplyError={() => setReplyError(null)}
          />
        ) : (
          <HistoryView
            interactions={interactions}
            onSelectInteraction={(selected) => {
              setActiveInteractionId(selected.id);
              setActiveView('view');
            }}
            onDeleteInteraction={handleDeleteInteraction}
            onNewReflection={() => {
              setActiveInteractionId(null);
              setActiveView('compose');
            }}
            isLoading={interactionsLoading}
          />
        )}
      </main>
    </div>
  );
}
