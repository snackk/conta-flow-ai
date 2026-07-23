import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useProjects } from '../hooks/useProjects.js';

const ProjectContext = createContext(null);

function storageKey(uid) {
  return `contaflow:project:${uid}`;
}

export function ProjectProvider({ children }) {
  const { profile, isAdmin } = useAuth();
  const uid = profile?.uid;
  const projectsApi = useProjects(uid, { isAdmin });
  const { projects, loading } = projectsApi;

  const [currentProjectId, setCurrentProjectIdState] = useState(() => {
    try { return uid ? localStorage.getItem(storageKey(uid)) : null; } catch { return null; }
  });

  // Re-read the persisted choice whenever the signed-in user changes.
  useEffect(() => {
    if (!uid) { setCurrentProjectIdState(null); return; }
    try { setCurrentProjectIdState(localStorage.getItem(storageKey(uid))); } catch { setCurrentProjectIdState(null); }
  }, [uid]);

  useEffect(() => {
    if (loading || !uid) return;
    const stillValid = currentProjectId && projects.some((p) => p.id === currentProjectId);
    if (stillValid) return;

    if (projects.length === 1) {
      setCurrentProjectId(projects[0].id);
    } else if (currentProjectId) {
      // Previously selected project no longer exists / no longer a member.
      setCurrentProjectId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, projects, uid]);

  const setCurrentProjectId = (projectId) => {
    setCurrentProjectIdState(projectId);
    try {
      if (uid) {
        if (projectId) localStorage.setItem(storageKey(uid), projectId);
        else localStorage.removeItem(storageKey(uid));
      }
    } catch { /* ignore */ }
  };

  const currentProject = useMemo(
    () => projects.find((p) => p.id === currentProjectId) || null,
    [projects, currentProjectId]
  );

  const value = {
    ...projectsApi,
    currentProjectId,
    currentProject,
    setCurrentProjectId,
    needsProjectSelection: !loading && !currentProject && projects.length !== 1,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within a ProjectProvider');
  return ctx;
}
