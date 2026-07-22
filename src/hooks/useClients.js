import { useEffect, useState } from 'react';
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where,
} from 'firebase/firestore';
import { db } from '../config/firebase.js';

const COLLECTION = 'clients';

export function useClients(projectId) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(!!projectId);

  useEffect(() => {
    if (!projectId) {
      setClients([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(collection(db, COLLECTION), where('projectId', '==', projectId), orderBy('name', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error('Erro ao carregar clientes:', err);
      setLoading(false);
    });
    return () => unsub();
  }, [projectId]);

  const createClient = async (data, createdBy) => {
    const ref = await addDoc(collection(db, COLLECTION), {
      projectId,
      name: data.name,
      notes: data.notes || '',
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  };

  const updateClient = async (clientId, data) => {
    await updateDoc(doc(db, COLLECTION, clientId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  };

  const deleteClient = async (clientId) => {
    await deleteDoc(doc(db, COLLECTION, clientId));
  };

  return { clients, loading, createClient, updateClient, deleteClient };
}
