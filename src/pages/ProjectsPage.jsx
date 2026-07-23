import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronRight, FolderKanban, Mail, Plus, Search, UserMinus, UserPlus } from 'lucide-react';
import Avatar from '../components/Avatar.jsx';
import ProjectModal from '../components/ProjectModal.jsx';
import { getFullName } from '../utils/taskLogic.js';

/** Search-by-name picker (same interaction pattern as the assignee/client pickers in the task modal), letting an admin join a project they don't yet belong to. */
function ProjectJoinPicker({ projects, onJoin }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [open]);

  const filteredProjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(q));
  }, [projects, query]);

  const handleJoin = async (project) => {
    setBusy(true);
    try {
      await onJoin(project.id);
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  if (projects.length === 0) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-500/40 text-indigo-600 dark:text-indigo-400 text-sm font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
      >
        <UserPlus className="w-4 h-4" /> Juntar-me a um projeto
      </button>

      {open && (
        <div className="absolute z-20 right-0 mt-1.5 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg overflow-hidden">
          <div className="relative p-2 border-b border-slate-100 dark:border-slate-700">
            <Search className="w-4 h-4 text-slate-400 absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setOpen(false);
                if (e.key === 'Enter' && filteredProjects.length === 1) handleJoin(filteredProjects[0]);
              }}
              placeholder="Pesquisar projeto por nome..."
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filteredProjects.map((p) => (
              <button
                type="button"
                key={p.id}
                disabled={busy}
                onClick={() => handleJoin(p)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors disabled:opacity-50"
              >
                <FolderKanban className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="flex-1 min-w-0 truncate text-left">{p.name}</span>
              </button>
            ))}
            {filteredProjects.length === 0 && (
              <p className="px-3 py-4 text-sm text-slate-400 dark:text-slate-500 text-center">Nenhum projeto encontrado.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectMemberManager({ project, users, onAddMember, onRemoveMember, onInvite }) {
  const [selectedUid, setSelectedUid] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSent, setInviteSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const members = users.filter((u) => project.memberIds?.includes(u.uid));
  const nonMembers = users.filter((u) => !project.memberIds?.includes(u.uid));

  const handleAdd = async () => {
    if (!selectedUid) return;
    setBusy(true);
    try {
      await onAddMember(project.id, selectedUid);
      setSelectedUid('');
    } finally {
      setBusy(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setBusy(true);
    setInviteSent(false);
    try {
      await onInvite(project.id, project.name, inviteEmail.trim());
      setInviteEmail('');
      setInviteSent(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">
          Membros ({members.length})
        </p>
        <div className="space-y-1.5">
          {members.map((member) => (
            <div key={member.uid} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50">
              <Avatar profile={member} size="sm" />
              <span className="flex-1 min-w-0 text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{getFullName(member)}</span>
              {members.length > 1 && (
                <button
                  type="button"
                  title="Remover do projeto"
                  onClick={() => onRemoveMember(project.id, member.uid)}
                  className="text-slate-300 dark:text-slate-500 hover:text-red-600 transition-colors shrink-0"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">Adicionar utilizador existente</p>
          <div className="flex gap-2">
            <select
              value={selectedUid}
              onChange={(e) => setSelectedUid(e.target.value)}
              className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              <option value="">Escolher...</option>
              {nonMembers.map((u) => (
                <option key={u.uid} value={u.uid}>{getFullName(u)}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!selectedUid || busy}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">Convidar por email</p>
          <form onSubmit={handleInvite} className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => { setInviteEmail(e.target.value); setInviteSent(false); }}
              placeholder="email@exemplo.com"
              className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
            <button
              type="submit"
              disabled={!inviteEmail.trim() || busy}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Mail className="w-4 h-4" />
            </button>
          </form>
          {inviteSent && (
            <p className="text-xs font-medium text-green-600 dark:text-green-400 mt-1.5 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Convite registado — fica ativo assim que essa pessoa iniciar sessão.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectsPage({ projects, users, currentProjectId, currentUid, isAdmin, onCreateProject, onSwitchProject, onAddMember, onRemoveMember, onInvite }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(currentProjectId);

  const nonMemberProjects = useMemo(
    () => (isAdmin ? projects.filter((p) => !p.memberIds?.includes(currentUid)) : []),
    [projects, isAdmin, currentUid]
  );

  const handleJoin = async (projectId) => {
    await onAddMember(projectId, currentUid);
    onSwitchProject(projectId);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Projetos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isAdmin
              ? 'Como administrador, vê todos os projetos existentes. Escolha com qual quer trabalhar, geste membros ou junte-se a um projeto.'
              : 'Pode pertencer a vários projetos; escolha com qual quer trabalhar e geste os respetivos membros.'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && <ProjectJoinPicker projects={nonMemberProjects} onJoin={handleJoin} />}
          {isAdmin && (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm shadow-indigo-600/20 transition-colors"
            >
              <Plus className="w-4 h-4" /> Novo Projeto
            </button>
          )}
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-sm bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
          Ainda não pertence a nenhum projeto.
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => {
            const isCurrent = project.id === currentProjectId;
            const isMember = project.memberIds?.includes(currentUid);
            const canManage = project.createdBy === currentUid || isAdmin;
            const expanded = expandedId === project.id;

            return (
              <div key={project.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : project.id)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shrink-0"
                  >
                    {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <FolderKanban className="w-4.5 h-4.5" />
                  </div>
                  <span className="flex-1 min-w-0 font-bold text-slate-800 dark:text-slate-100 truncate">{project.name}</span>
                  {isAdmin && !isMember && (
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full shrink-0">
                      Não é membro
                    </span>
                  )}
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 shrink-0">
                    {project.memberIds?.length || 0} {project.memberIds?.length === 1 ? 'membro' : 'membros'}
                  </span>
                  {isCurrent ? (
                    <span className="shrink-0 flex items-center gap-1 text-xs font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2.5 py-1 rounded-full">
                      <Check className="w-3.5 h-3.5" /> Atual
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSwitchProject(project.id)}
                      className="shrink-0 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-full transition-colors"
                    >
                      Mudar para este
                    </button>
                  )}
                </div>

                {expanded && canManage && (
                  <ProjectMemberManager
                    project={project}
                    users={users}
                    onAddMember={onAddMember}
                    onRemoveMember={onRemoveMember}
                    onInvite={onInvite}
                  />
                )}
                {expanded && !canManage && (
                  <p className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 text-sm text-slate-400 dark:text-slate-500">
                    Só quem criou o projeto ou um administrador pode gerir os membros.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ProjectModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={onCreateProject} />
    </div>
  );
}

export default ProjectsPage;
