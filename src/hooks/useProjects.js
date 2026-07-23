import { useEffect, useState } from 'react';
import {
  addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query,
  serverTimestamp, setDoc, updateDoc, where,
} from 'firebase/firestore';
import { db } from '../config/firebase.js';

/**
 * Projects the given user belongs to — or, for admins, every project that
 * exists, since admins can browse and join any project without being a
 * member first.
 */
export function useProjects(uid, { isAdmin = false } = {}) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(!!uid);

  useEffect(() => {
    if (!uid) {
      setProjects([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = isAdmin
      ? query(collection(db, 'projects'), orderBy('name', 'asc'))
      : query(collection(db, 'projects'), where('memberIds', 'array-contains', uid), orderBy('name', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error('Erro ao carregar projetos:', err);
      setLoading(false);
    });
    return () => unsub();
  }, [uid, isAdmin]);

  // The creator isn't added as a member automatically — an admin creating a
  // project for a team doesn't necessarily work in it themselves; they join
  // explicitly afterwards (self-join, below) if they need to.
  const createProject = async (name, createdBy) => {
    const ref = await addDoc(collection(db, 'projects'), {
      name: name.trim(),
      createdBy,
      memberIds: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  };

  const addMemberToProject = async (projectId, memberUid) => {
    await updateDoc(doc(db, 'projects', projectId), { memberIds: arrayUnion(memberUid), updatedAt: serverTimestamp() });
  };

  const removeMemberFromProject = async (projectId, memberUid) => {
    await updateDoc(doc(db, 'projects', projectId), { memberIds: arrayRemove(memberUid), updatedAt: serverTimestamp() });
  };

  const inviteByEmail = async (projectId, projectName, email, invitedBy) => {
    const emailKey = email.trim().toLowerCase();
    const inviteRef = doc(db, 'invites', emailKey);
    const existing = await getDoc(inviteRef);
    const projectsMap = existing.exists() ? (existing.data().projects || {}) : {};
    projectsMap[projectId] = { projectName, invitedBy, invitedAt: serverTimestamp() };
    await setDoc(inviteRef, { email: emailKey, projects: projectsMap }, { merge: true });
  };

  const deleteProject = async (projectId) => {
    await deleteDoc(doc(db, 'projects', projectId));
  };

  return {
    projects, loading, createProject, addMemberToProject, removeMemberFromProject, inviteByEmail, deleteProject,
  };
}
