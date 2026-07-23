import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword,
  signInWithPopup, signOut, updateProfile,
} from 'firebase/auth';
import {
  arrayUnion, collection, deleteDoc, doc, getCountFromServer, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../config/firebase.js';

const AuthContext = createContext(null);

function splitDisplayName(displayName = '') {
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  return { firstName, lastName };
}

function inviteDocId(email) {
  return (email || '').trim().toLowerCase();
}

// Set synchronously (before any await) by registerWithEmail so the onAuthStateChanged
// bootstrap below can pick up the entered name instead of the auth user's displayName,
// which updateProfile() may not have finished writing back by the time that handler
// reads it — a real race, since both kick off as soon as the account is created.
let pendingRegistrationName = null;

/**
 * Merges any pending project invites for this email into the invited
 * projects' memberIds, then removes the invite record. Runs on every login
 * (cheap single-doc read when there's nothing pending) so an admin can
 * invite someone by email before they've ever signed in.
 */
async function acceptPendingInvites(uid, email) {
  const inviteRef = doc(db, 'invites', inviteDocId(email));
  const inviteSnap = await getDoc(inviteRef);
  if (!inviteSnap.exists()) return;

  const projects = inviteSnap.data().projects || {};
  const projectIds = Object.keys(projects);
  if (projectIds.length === 0) {
    await deleteDoc(inviteRef);
    return;
  }

  // Committed as a single atomic batch (rather than separate updateDoc calls)
  // so any client listening to "my projects" sees every newly-joined project
  // in one consistent snapshot, instead of momentarily seeing just the first
  // one to land — which would otherwise race the ProjectContext auto-select
  // effect into locking onto the wrong project when someone is invited to
  // more than one project before their first login.
  const batch = writeBatch(db);
  for (const projectId of projectIds) {
    batch.update(doc(db, 'projects', projectId), { memberIds: arrayUnion(uid) });
  }
  batch.delete(inviteRef);
  await batch.commit();
}

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let unsubProfile = null;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubProfile) { unsubProfile(); unsubProfile = null; }
      setFirebaseUser(user);

      if (!user) {
        setProfile(null);
        setIsReady(true);
        return;
      }

      const userRef = doc(db, 'users', user.uid);
      const existing = await getDoc(userRef);

      if (!existing.exists()) {
        const { firstName, lastName } = pendingRegistrationName || splitDisplayName(user.displayName || '');
        pendingRegistrationName = null;
        // The very first person to ever sign in becomes the platform admin,
        // so there's always someone able to create the first project without
        // any manual database setup.
        const usersCount = await getCountFromServer(collection(db, 'users'));
        const role = usersCount.data().count === 0 ? 'admin' : 'member';
        await setDoc(userRef, {
          email: user.email || '',
          photoURL: user.photoURL || '',
          firstName,
          lastName,
          role,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        // Keep the Google avatar/email fresh, but never clobber a name the user edited themselves.
        await setDoc(userRef, {
          email: user.email || '',
          photoURL: user.photoURL || '',
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }

      if (user.email) {
        acceptPendingInvites(user.uid, user.email).catch((err) => console.error('Erro ao aceitar convites:', err));
      }

      unsubProfile = onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          setProfile({ uid: user.uid, ...snap.data() });
        }
        setIsReady(true);
      });
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const loginWithGoogle = () => signInWithPopup(auth, googleProvider);

  const loginWithEmail = (email, password) => signInWithEmailAndPassword(auth, email, password);

  const registerWithEmail = async (email, password, firstName, lastName) => {
    pendingRegistrationName = { firstName, lastName };
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const displayName = `${firstName} ${lastName}`.trim();
      if (displayName) {
        await updateProfile(credential.user, { displayName });
      }
      return credential.user;
    } catch (err) {
      pendingRegistrationName = null;
      throw err;
    }
  };

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  const logout = () => signOut(auth);

  const updateUserProfile = async (fields) => {
    if (!firebaseUser) return;
    await updateDoc(doc(db, 'users', firebaseUser.uid), {
      ...fields,
      updatedAt: serverTimestamp(),
    });
  };

  const value = {
    firebaseUser,
    profile,
    isReady,
    isAuthenticated: !!firebaseUser,
    isAdmin: profile?.role === 'admin',
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    resetPassword,
    logout,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
