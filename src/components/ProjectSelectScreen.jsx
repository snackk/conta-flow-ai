import React, { useState } from 'react';
import { FolderKanban, LogOut, Plus, Workflow } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useProject } from '../contexts/ProjectContext.jsx';
import ProjectModal from './ProjectModal.jsx';

function ProjectSelectScreen() {
  const { profile, isAdmin, logout } = useAuth();
  const { projects, setCurrentProjectId, createProject } = useProject();
  const [modalOpen, setModalOpen] = useState(false);

  const handleCreate = async (name) => {
    const projectId = await createProject(name, profile.uid);
    setCurrentProjectId(projectId);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center p-4 safe-pt safe-pb">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
        <div className="bg-indigo-600 px-6 py-10 text-center relative overflow-hidden">
          <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm shadow-inner">
            <Workflow className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">
            {projects.length > 0 ? 'Escolha um projeto' : 'Sem projetos'}
          </h1>
          <p className="text-indigo-100 mt-1 text-sm">
            {projects.length > 0
              ? 'Pertence a mais do que um projeto. Selecione com qual quer trabalhar.'
              : 'Ainda não pertence a nenhum projeto no ContaFlow AI.'}
          </p>
        </div>

        <div className="p-6">
          {projects.length > 0 ? (
            <div className="space-y-2">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setCurrentProjectId(project.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <FolderKanban className="w-4.5 h-4.5" />
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{project.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
              {isAdmin
                ? 'Como é administrador, pode criar o primeiro projeto.'
                : 'Peça a um administrador para o adicionar a um projeto.'}
            </p>
          )}

          {isAdmin && (
            <button
              onClick={() => setModalOpen(true)}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-3 rounded-xl shadow-sm shadow-indigo-600/20 transition-colors"
            >
              <Plus className="w-4 h-4" /> Novo Projeto
            </button>
          )}

          <button
            onClick={logout}
            className="w-full mt-2 flex items-center justify-center gap-2 text-sm font-medium text-slate-400 dark:text-slate-500 hover:text-red-600 px-4 py-2.5 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" /> Terminar Sessão
          </button>
        </div>
      </div>

      <ProjectModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreate} />
    </div>
  );
}

export default ProjectSelectScreen;
