import { useEffect, useState } from 'react';
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where,
} from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { DEFAULT_TASK_COLOR } from '../utils/taskLogic.js';

const COLLECTION = 'taskTemplates';

export function useTaskTemplates(projectId) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(!!projectId);

  useEffect(() => {
    if (!projectId) {
      setTemplates([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(collection(db, COLLECTION), where('projectId', '==', projectId), orderBy('name', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setTemplates(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error('Erro ao carregar templates:', err);
      setLoading(false);
    });
    return () => unsub();
  }, [projectId]);

  const createTemplate = async (data, createdBy) => {
    const ref = await addDoc(collection(db, COLLECTION), {
      projectId,
      name: data.name,
      description: data.description || '',
      color: data.color || DEFAULT_TASK_COLOR,
      recurrence: data.recurrence || { enabled: false, dayOfMonth: 1 },
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  };

  const updateTemplate = async (templateId, data) => {
    await updateDoc(doc(db, COLLECTION, templateId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  };

  const deleteTemplate = async (templateId) => {
    await deleteDoc(doc(db, COLLECTION, templateId));
  };

  return { templates, loading, createTemplate, updateTemplate, deleteTemplate };
}
