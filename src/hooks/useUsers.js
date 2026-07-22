import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase.js';

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('firstName', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error('Erro ao carregar utilizadores:', err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { users, loading };
}
