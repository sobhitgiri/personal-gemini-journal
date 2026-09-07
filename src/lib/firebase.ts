import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  onSnapshot,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Interaction, OperationType, FirestoreErrorInfo } from '../types';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass firebaseConfig.firestoreDatabaseId as second argument
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Google Sign-In via popup (safe in iFrame preview environments)
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In failed:', error);
    throw error;
  }
}

// Sign-Out
export async function signOutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out failed:', error);
    throw error;
  }
}

/**
 * Handle Firestore Error conforming to FirestoreErrorInfo specification
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo:
        currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Strict Undefined-Stripping Utility
 * Strips all undefined properties from objects to prevent Firestore driver crashes
 */
export function stripUndefined<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_, value) => (value === undefined ? null : value))
  );
}

/**
 * Test Connection to Firestore as recommended by Firebase Skill
 */
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Firestore offline or misconfigured:', error.message);
    }
    return false;
  }
}

/**
 * Save a new interaction document to /users/{userId}/interactions/{interactionId}
 */
export async function saveInteraction(userId: string, interaction: Interaction): Promise<void> {
  const interactionPath = `users/${userId}/interactions/${interaction.id}`;
  try {
    const cleaned = stripUndefined(interaction);
    await setDoc(doc(db, 'users', userId, 'interactions', interaction.id), cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, interactionPath);
  }
}

/**
 * Update an existing interaction document with follow-up turns
 */
export async function updateInteraction(
  userId: string,
  interactionId: string,
  updates: Partial<Interaction>
): Promise<void> {
  const interactionPath = `users/${userId}/interactions/${interactionId}`;
  try {
    const cleaned = stripUndefined(updates);
    await updateDoc(doc(db, 'users', userId, 'interactions', interactionId), cleaned as any);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, interactionPath);
  }
}

/**
 * Delete an interaction
 */
export async function deleteInteraction(userId: string, interactionId: string): Promise<void> {
  const interactionPath = `users/${userId}/interactions/${interactionId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'interactions', interactionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, interactionPath);
  }
}

/**
 * Subscribe to real-time updates for user's private interactions
 */
export function subscribeUserInteractions(
  userId: string,
  onUpdate: (data: Interaction[]) => void,
  onError: (err: any) => void
) {
  const interactionsPath = `users/${userId}/interactions`;
  const colRef = collection(db, 'users', userId, 'interactions');
  const q = query(colRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Interaction[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      // Sort client-side by createdAt desc to avoid composite index requirements
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, interactionsPath);
      onError(error);
    }
  );
}
