export const STAGES = {
  BLOCKED: 'blocked',
  READY: 'ready',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
};

export const STAGE_ORDER = [STAGES.BLOCKED, STAGES.READY, STAGES.IN_PROGRESS, STAGES.DONE];

export const STAGE_LABELS = {
  [STAGES.BLOCKED]: 'Bloqueado',
  [STAGES.READY]: 'Pronto para Começar',
  [STAGES.IN_PROGRESS]: 'Em Progresso',
  [STAGES.DONE]: 'Terminado',
};

export function getInitials(firstName = '', lastName = '') {
  const first = firstName?.trim()?.charAt(0) || '';
  const last = lastName?.trim()?.charAt(0) || '';
  const initials = `${first}${last}`.toUpperCase();
  return initials || '?';
}

export function getFullName(profile) {
  if (!profile) return 'Utilizador';
  const name = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
  return name || profile.email || 'Utilizador';
}

/**
 * A task's persisted `progress` field only tracks whether a user has started
 * or finished working on it ('todo' | 'in_progress' | 'done'). Whether it is
 * actually workable (blocked by an unfinished predecessor) is derived here so
 * that completing the blocking task instantly frees up dependents without a
 * separate write.
 */
export function computeStage(task, tasksById) {
  if (task.progress === STAGES.IN_PROGRESS) return STAGES.IN_PROGRESS;
  if (task.progress === STAGES.DONE) return STAGES.DONE;

  if (task.precedingTaskId) {
    const blocker = tasksById.get(task.precedingTaskId);
    if (blocker && blocker.progress !== STAGES.DONE) {
      return STAGES.BLOCKED;
    }
  }
  return STAGES.READY;
}

export function isTaskDone(task) {
  return task.progress === STAGES.DONE;
}

export function nextDueDateForCycle(referenceDate, dayOfMonth) {
  const d = new Date(referenceDate);
  const due = new Date(d.getFullYear(), d.getMonth(), dayOfMonth);
  return due.toISOString().slice(0, 10);
}

/**
 * Recurring tasks reset to 'todo' (re-entering Ready/Blocked) once the
 * cycle's reset day has passed and they haven't already been reset for that
 * cycle. This runs client-side on load/poll rather than via a backend job,
 * so the reset only actually happens once some signed-in client is open.
 */
export function getRecurrenceReset(task, now = new Date()) {
  if (!task.recurrence?.enabled) return null;

  const dayOfMonth = task.recurrence.dayOfMonth || 1;
  const currentCycleKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const hasPassedResetDay = now.getDate() >= dayOfMonth;

  if (!hasPassedResetDay) return null;
  if (task.lastCycleKey === currentCycleKey) return null;

  return {
    progress: 'todo',
    dueDate: nextDueDateForCycle(now, dayOfMonth),
    lastCycleKey: currentCycleKey,
  };
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function isOverdue(dateStr, progress) {
  if (!dateStr || progress === STAGES.DONE) return false;
  const d = new Date(`${dateStr}T23:59:59`);
  return d.getTime() < Date.now();
}

export const URGENCY = {
  WARNING: 'warning',
  URGENT: 'urgent',
};

/**
 * Deadline urgency used to drive the notification bell and the matching
 * highlight on task cards. Derived purely from `dueDate`/`progress` (never
 * persisted) so a notification can only ever disappear by the task being
 * marked done — there is no separate "read"/dismiss state to manage.
 *
 * < 2 days left (including overdue) → urgent (red)
 * <= 5 days left → warning (yellow)
 * otherwise, or already done → not a notification
 */
export function getTaskUrgency(task, now = new Date()) {
  if (!task?.dueDate || task.progress === STAGES.DONE) return null;
  const due = new Date(`${task.dueDate}T23:59:59`);
  const daysLeft = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (daysLeft < 2) return URGENCY.URGENT;
  if (daysLeft <= 5) return URGENCY.WARNING;
  return null;
}

function todayStr(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

/**
 * A user is Out of Office when both dates are set and today falls within
 * [oooStart, oooEnd] inclusive (plain YYYY-MM-DD string comparison, same
 * convention as task.dueDate elsewhere in this file).
 */
export function isUserOOO(user, now = new Date()) {
  if (!user?.oooStart || !user?.oooEnd) return false;
  const today = todayStr(now);
  return today >= user.oooStart && today <= user.oooEnd;
}

export const DEFAULT_TASK_COLOR = '#6366f1';

export const TASK_COLOR_PRESETS = [
  { label: 'Índigo', value: '#6366f1' },
  { label: 'Verde', value: '#16a34a' },
  { label: 'Âmbar', value: '#d97706' },
  { label: 'Rosa', value: '#db2777' },
  { label: 'Azul', value: '#2563eb' },
  { label: 'Vermelho', value: '#dc2626' },
  { label: 'Roxo', value: '#9333ea' },
  { label: 'Cinza', value: '#475569' },
];
