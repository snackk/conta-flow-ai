import { useEffect, useMemo, useRef, useState } from 'react';
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where,
} from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { DEFAULT_TASK_COLOR, computeStage, getRecurrenceReset } from '../utils/taskLogic.js';

const COLLECTION = 'tasks';

export function useTasks(projectId) {
  const [rawTasks, setRawTasks] = useState([]);
  const [loading, setLoading] = useState(!!projectId);
  const resetInFlight = useRef(new Set());

  useEffect(() => {
    if (!projectId) {
      setRawTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(collection(db, COLLECTION), where('projectId', '==', projectId), orderBy('dueDate', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setRawTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error('Erro ao carregar tarefas:', err);
      setLoading(false);
    });
    return () => unsub();
  }, [projectId]);

  // Opportunistically roll recurring tasks into a new cycle once their reset
  // day has passed. Runs on every snapshot from any connected client.
  useEffect(() => {
    const now = new Date();
    for (const task of rawTasks) {
      if (resetInFlight.current.has(task.id)) continue;
      const reset = getRecurrenceReset(task, now);
      if (reset) {
        resetInFlight.current.add(task.id);
        updateDoc(doc(db, COLLECTION, task.id), {
          ...reset,
          updatedAt: serverTimestamp(),
        }).catch((err) => console.error('Erro ao reiniciar tarefa recorrente:', err))
          .finally(() => resetInFlight.current.delete(task.id));
      }
    }
  }, [rawTasks]);

  const tasksById = useMemo(() => new Map(rawTasks.map((t) => [t.id, t])), [rawTasks]);

  const tasks = useMemo(
    () => rawTasks.map((task) => ({ ...task, stage: computeStage(task, tasksById) })),
    [rawTasks, tasksById]
  );

  const createTask = async (data, createdBy) => {
    await addDoc(collection(db, COLLECTION), {
      projectId,
      title: data.title,
      description: data.description || '',
      clientId: data.clientId || null,
      dueDate: data.dueDate || '',
      assignedTo: data.assignedTo || null,
      precedingTaskId: data.precedingTaskId || null,
      templateId: data.templateId || null,
      color: data.color || DEFAULT_TASK_COLOR,
      recurrence: data.recurrence || { enabled: false, dayOfMonth: 1 },
      progress: 'todo',
      lastCycleKey: null,
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const updateTask = async (taskId, data) => {
    await updateDoc(doc(db, COLLECTION, taskId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  };

  const deleteTask = async (taskId) => {
    await deleteDoc(doc(db, COLLECTION, taskId));
  };

  const reassignTask = async (taskId, userId) => {
    await updateTask(taskId, { assignedTo: userId });
  };

  const setTaskProgress = async (taskId, progress) => {
    await updateTask(taskId, { progress });
  };

  return {
    tasks, tasksById, loading, createTask, updateTask, deleteTask, reassignTask, setTaskProgress,
  };
}
