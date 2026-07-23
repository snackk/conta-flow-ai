import React, { useMemo, useState } from 'react';
import {
  ChevronLeft, ChevronRight, Contact, FolderKanban, Info, KanbanSquare, LayoutTemplate, LogOut, Menu, Workflow, X,
} from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { ProjectProvider, useProject } from './contexts/ProjectContext.jsx';
import { firebaseConfig, useEmulators } from './config/firebase.js';
import { useUsers } from './hooks/useUsers.js';
import { useTaskTemplates } from './hooks/useTaskTemplates.js';
import { useTasks } from './hooks/useTasks.js';
import { useClients } from './hooks/useClients.js';
import { addTaskComment } from './hooks/useComments.js';

import Avatar from './components/Avatar.jsx';
import NavItem from './components/NavItem.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import TaskModal from './components/TaskModal.jsx';
import ProjectSelectScreen from './components/ProjectSelectScreen.jsx';
import NotificationBell from './components/NotificationBell.jsx';

import BoardPage from './pages/BoardPage.jsx';
import TemplatesPage from './pages/TemplatesPage.jsx';
import ClientsPage from './pages/ClientsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ProjectsPage from './pages/ProjectsPage.jsx';
import AboutPage from './pages/AboutPage.jsx';

import { buildTemplateTaskTitle, formatCompletionComment, getFullName, nextTemplateDueDate } from './utils/taskLogic.js';
import { uploadTaskImage } from './utils/uploadImage.js';

const SIDEBAR_COLLAPSED_KEY = 'contaflow:sidebarCollapsed';

function AppShell() {
  const { profile, isReady, isAuthenticated, isAdmin, logout } = useAuth();
  const {
    projects, currentProjectId, currentProject, needsProjectSelection,
    setCurrentProjectId, createProject, addMemberToProject, removeMemberFromProject, inviteByEmail,
  } = useProject();

  const [activeTab, setActiveTab] = useState('board');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'; } catch { return false; }
  });
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const { users } = useUsers();
  const { templates, createTemplate, updateTemplate, deleteTemplate } = useTaskTemplates(currentProjectId);
  const { tasks, tasksById, createTask, updateTask, deleteTask } = useTasks(currentProjectId);
  const { clients, createClient, updateClient, deleteClient } = useClients(currentProjectId);

  const projectUsers = useMemo(
    () => users.filter((u) => currentProject?.memberIds?.includes(u.uid)),
    [users, currentProject]
  );

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next)); } catch { /* ignore */ }
      return next;
    });
  };

  if (Object.keys(firebaseConfig).length === 0) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-6 text-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Firebase não configurado</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Defina a variável de ambiente VITE_FIREBASE_CONFIG (veja .env.example) ou corra os emuladores locais (veja o README).</p>
      </div>
    );
  }

  if (!isReady) {
    return <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400">A carregar...</div>;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  if (needsProjectSelection) {
    return <ProjectSelectScreen />;
  }

  const openNewTask = () => { setEditingTask(null); setTaskModalOpen(true); };
  const openEditTask = (task) => { setEditingTask(task); setTaskModalOpen(true); };

  const handleSaveTask = async (data, taskId) => {
    if (taskId) {
      await updateTask(taskId, data);
    } else {
      await createTask(data, profile?.uid);
    }
  };

  const handleMoveTask = async (taskId, patch) => {
    await updateTask(taskId, patch);
    if (patch.progress === 'done') {
      const task = tasksById.get(taskId);
      if (task?.templateId) {
        await addTaskComment(taskId, formatCompletionComment(task.title), profile);
      }
    }
  };

  const handleUploadImage = (file) => uploadTaskImage(file, profile.uid);

  const handleCreateTemplate = async (data) => {
    const templateId = await createTemplate(data, profile?.uid);
    const dueDate = data.recurrence?.enabled ? nextTemplateDueDate(new Date(), data.recurrence.dayOfMonth) : '';
    await Promise.all(clients.map((client) => createTask({
      title: buildTemplateTaskTitle(client.name, data.name),
      description: data.description,
      clientId: client.id,
      dueDate,
      assignedTo: profile?.uid,
      templateId,
      color: data.color,
      recurrence: data.recurrence,
    }, profile?.uid)));
  };

  const goToTab = (tab) => { setActiveTab(tab); setIsMobileMenuOpen(false); };

  const renderContent = () => {
    switch (activeTab) {
      case 'board':
        return (
          <BoardPage
            tasks={tasks}
            tasksById={tasksById}
            users={projectUsers}
            templates={templates}
            clients={clients}
            currentUserId={profile?.uid}
            onNewTask={openNewTask}
            onEditTask={openEditTask}
            onMoveTask={handleMoveTask}
          />
        );
      case 'templates':
        return (
          <TemplatesPage
            templates={templates}
            clientsCount={clients.length}
            onUploadImage={handleUploadImage}
            onCreate={handleCreateTemplate}
            onUpdate={updateTemplate}
            onDelete={deleteTemplate}
          />
        );
      case 'clients':
        return (
          <ClientsPage
            clients={clients}
            onCreate={(data) => createClient(data, profile?.uid)}
            onUpdate={updateClient}
            onDelete={deleteClient}
          />
        );
      case 'projects':
        return (
          <ProjectsPage
            projects={projects}
            users={users}
            currentProjectId={currentProjectId}
            currentUid={profile?.uid}
            isAdmin={isAdmin}
            onCreateProject={(name) => createProject(name, profile.uid)}
            onSwitchProject={setCurrentProjectId}
            onAddMember={addMemberToProject}
            onRemoveMember={removeMemberFromProject}
            onInvite={(projectId, projectName, email) => inviteByEmail(projectId, projectName, email, profile.uid)}
          />
        );
      case 'profile':
        return <ProfilePage />;
      case 'about':
        return <AboutPage />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-100 safe-pl safe-pr">
      {useEmulators && (
        <div className="fixed bottom-3 right-3 z-[60] text-[11px] font-bold uppercase tracking-wide bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 px-3 py-1.5 rounded-full shadow-sm">
          Modo Emulador Local
        </div>
      )}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-800/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 ${collapsed ? 'w-20' : 'w-72'} bg-white dark:bg-slate-800 shadow-2xl transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex lg:flex-col lg:shadow-none lg:border-r lg:border-slate-200 dark:lg:border-slate-700 safe-pt safe-pb flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className={`flex items-center h-16 border-b border-slate-100 dark:border-slate-700 shrink-0 ${collapsed ? 'justify-center px-2' : 'justify-between px-6'}`}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="bg-indigo-600 p-1.5 rounded-lg shrink-0"><Workflow className="w-5 h-5 text-white" /></div>
            {!collapsed && (
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-indigo-500 dark:from-indigo-400 dark:to-indigo-300 truncate">ContaFlow AI</span>
            )}
          </div>
          {!collapsed && (
            <button className="lg:hidden text-slate-400 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full shrink-0" onClick={() => setIsMobileMenuOpen(false)}><X className="w-6 h-6" /></button>
          )}
        </div>

        {projects.length > 1 && (
          <button
            onClick={() => goToTab('projects')}
            title={currentProject?.name}
            className={`flex items-center gap-2 mx-3 mt-3 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left ${collapsed ? 'justify-center' : ''}`}
          >
            <FolderKanban className="w-4 h-4 text-indigo-500 shrink-0" />
            {!collapsed && <span className="flex-1 min-w-0 text-xs font-bold text-slate-600 dark:text-slate-300 truncate">{currentProject?.name}</span>}
          </button>
        )}

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
          <NavItem icon={<KanbanSquare />} label="Quadro de Tarefas" active={activeTab === 'board'} onClick={() => goToTab('board')} collapsed={collapsed} />
          <NavItem icon={<LayoutTemplate />} label="Modelos de Tarefa" active={activeTab === 'templates'} onClick={() => goToTab('templates')} collapsed={collapsed} />
          <NavItem icon={<Contact />} label="Clientes" active={activeTab === 'clients'} onClick={() => goToTab('clients')} collapsed={collapsed} />
          <NavItem icon={<FolderKanban />} label="Projetos" active={activeTab === 'projects'} onClick={() => goToTab('projects')} collapsed={collapsed} />
        </nav>

        <div className={`border-t border-slate-100 dark:border-slate-700 shrink-0 ${collapsed ? 'p-2' : 'p-4'}`}>
          <button
            onClick={() => goToTab('profile')}
            title={collapsed ? getFullName(profile) : undefined}
            className={`flex items-center gap-3 w-full rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors mb-2 text-left ${collapsed ? 'justify-center p-2' : 'px-4 py-3 bg-slate-50 dark:bg-slate-700/60'}`}
          >
            <Avatar profile={profile} size="md" />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{getFullName(profile)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{profile?.email}</p>
              </div>
            )}
          </button>
          <button
            onClick={logout}
            title={collapsed ? 'Terminar Sessão' : undefined}
            className={`flex items-center gap-3 w-full py-3 text-sm font-medium text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors ${collapsed ? 'justify-center px-0' : 'px-4'}`}
          >
            <LogOut className="w-5 h-5 shrink-0" /> {!collapsed && 'Terminar Sessão'}
          </button>

          <button
            onClick={toggleCollapsed}
            className={`hidden lg:flex items-center gap-2 w-full py-2.5 mt-2 text-xs font-semibold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${collapsed ? 'justify-center px-0' : 'px-4'}`}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /> Colapsar</>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <header className="mobile-header bg-indigo-600 lg:bg-white lg:dark:bg-slate-800 text-white lg:text-slate-800 lg:dark:text-slate-100 h-16 flex items-center justify-between px-4 lg:px-8 shrink-0 shadow-md lg:shadow-none lg:border-b lg:border-slate-100 lg:dark:border-slate-700">
          <div className="flex items-center gap-1 min-w-0">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors lg:hidden shrink-0"><Menu className="w-6 h-6" /></button>
            <span className="font-semibold text-lg tracking-wide truncate lg:text-xs lg:font-bold lg:uppercase lg:tracking-wide lg:text-slate-400 lg:dark:text-slate-500">{currentProject?.name || 'ContaFlow AI'}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => goToTab('about')}
              title="Sobre"
              className="p-2 rounded-full hover:bg-white/10 lg:hover:bg-slate-100 lg:dark:hover:bg-slate-700 transition-colors"
            >
              <Info className="w-5 h-5" />
            </button>
            <NotificationBell tasks={tasks} users={projectUsers} clients={clients} onOpenTask={openEditTask} />
            <button onClick={() => goToTab('profile')} className="lg:hidden"><Avatar profile={profile} size="sm" /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 safe-pb bg-slate-50/50 dark:bg-slate-900">
          <div className={`${activeTab === 'board' ? 'max-w-full' : 'max-w-6xl'} mx-auto h-full flex flex-col`}>
            {renderContent()}
          </div>
        </div>
      </main>

      <TaskModal
        open={taskModalOpen}
        task={editingTask}
        users={projectUsers}
        tasks={tasks}
        clients={clients}
        currentProfile={profile}
        onUploadImage={handleUploadImage}
        onCreateClient={(data) => createClient(data, profile?.uid)}
        onClose={() => setTaskModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={deleteTask}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ProjectProvider>
          <AppShell />
        </ProjectProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
