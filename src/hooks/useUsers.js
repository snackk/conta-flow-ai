import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase.js';

// `enabled` should wait for Firebase Auth to be signed in — subscribing before that
// sends the query with no ID token attached. Even gated on sign-in, this listener is
// set up in the same render tick as several others, and the Firestore SDK's credential
// can occasionally still lag one tick behind for the earliest of them; one retry on
// permission-denied clears it rather than leaving the list permanently empty.
export function useUsers(enabled) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(!!enabled);

  useEffect(() => {
    if (!enabled) {
      setUsers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let unsub = () => {};
    let retryTimer = null;
    let cancelled = false;

    const subscribe = () => {
      const q = query(collection(db, 'users'), orderBy('firstName', 'asc'));
      unsub = onSnapshot(q, (snap) => {
        setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
        setLoading(false);
      }, (err) => {
        if (cancelled) return;
        if (err.code === 'permission-denied') {
          retryTimer = setTimeout(subscribe, 300);
          return;
        }
        console.error('Erro ao carregar utilizadores:', err);
        setLoading(false);
      });
    };
    subscribe();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      unsub();
    };
  }, [enabled]);

  return { users, loading };
}
