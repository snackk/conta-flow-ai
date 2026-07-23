import { useEffect, useState } from 'react';
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.js';

export async function addTaskComment(taskId, text, author) {
  await addDoc(collection(db, 'tasks', taskId, 'comments'), {
    text,
    authorId: author.uid,
    authorFirstName: author.firstName || '',
    authorLastName: author.lastName || '',
    authorPhotoURL: author.photoURL || '',
    createdAt: serverTimestamp(),
  });
}

export function useComments(taskId) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(!!taskId);

  useEffect(() => {
    if (!taskId) {
      setComments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(collection(db, 'tasks', taskId, 'comments'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error('Erro ao carregar comentários:', err);
      setLoading(false);
    });
    return () => unsub();
  }, [taskId]);

  const addComment = (text, author) => addTaskComment(taskId, text, author);

  const deleteComment = async (commentId) => {
    await deleteDoc(doc(db, 'tasks', taskId, 'comments', commentId));
  };

  return { comments, loading, addComment, deleteComment };
}
