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

/** Initials from a single free-form name (e.g. a client's name), for entities with no first/last name split. */
export function getInitialsFromName(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0].charAt(0);
  const second = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return `${first}${second}`.toUpperCase() || '?';
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

/** Formats a local Date as YYYY-MM-DD without going through UTC (avoids the off-by-one that `toISOString()` causes in timezones ahead of UTC). */
function toDateStr(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function nextDueDateForCycle(referenceDate, dayOfMonth) {
  const d = new Date(referenceDate);
  return toDateStr(new Date(d.getFullYear(), d.getMonth(), dayOfMonth));
}

/**
 * Due date for a newly created recurring task: the given day of the month,
 * `intervalMonths` after referenceDate's month (e.g. created in July with
 * interval 1 for day 5 → 5 Aug, interval 3 → 5 Oct), since a recurring task
 * is prepared ahead of its next occurrence.
 */
export function nextTemplateDueDate(referenceDate, dayOfMonth, intervalMonths = 1) {
  const d = new Date(referenceDate);
  return toDateStr(new Date(d.getFullYear(), d.getMonth() + intervalMonths, dayOfMonth));
}

/**
 * Recurring tasks only ever reset once they've been marked Done — an
 * unfinished recurring task (e.g. still overdue from last cycle) keeps its
 * current due date and stage untouched, it never gets auto-reset out from
 * under someone. Once Done, the task waits there until the calendar reaches
 * its next scheduled cycle (`intervalMonths` after its due date's month —
 * 1 for a monthly task, 3 for quarterly, etc.), at which point it reopens as
 * 'todo' with a fresh due date for the day-of-month on the *current* month
 * (catching up to now rather than replaying every missed cycle in between).
 * This runs client-side on load/poll rather than via a backend job, so the
 * reset only actually happens once some signed-in client is open.
 */
export function getRecurrenceReset(task, now = new Date()) {
  if (!task.recurrence?.enabled) return null;
  if (task.progress !== STAGES.DONE) return null;
  if (!task.dueDate) return null;

  const intervalMonths = task.recurrence.intervalMonths || 1;
  const due = new Date(`${task.dueDate}T00:00:00`);
  const nextCycle = new Date(due.getFullYear(), due.getMonth() + intervalMonths, 1);
  const nextCycleKey = `${nextCycle.getFullYear()}-${String(nextCycle.getMonth() + 1).padStart(2, '0')}`;
  const currentCycleKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  if (currentCycleKey < nextCycleKey) return null;

  const dayOfMonth = task.recurrence.dayOfMonth || 1;
  return {
    progress: 'todo',
    dueDate: nextDueDateForCycle(now, dayOfMonth),
    lastCycleKey: currentCycleKey,
  };
}

/** "Cliente - Título do Modelo", used to name each task generated from a task template for a client. */
export function buildTemplateTaskTitle(clientName, templateTitle) {
  return `${clientName} - ${templateTitle}`;
}

export function makeTemplateGroupId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `grp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function emptyTemplateGroup() {
  return { id: makeTemplateGroupId(), allClients: true, clientIds: [], recurrenceMonths: 1 };
}

/**
 * Templates saved before per-group client recurrence existed have no `groups` field —
 * synthesize a single "all clients, monthly" group so they display and apply the same
 * way going forward, with no separate migration step needed.
 */
export function normalizeTemplateGroups(template) {
  if (template.groups && template.groups.length > 0) return template.groups;
  return [{ id: 'legacy', allClients: true, clientIds: [], recurrenceMonths: 1 }];
}

/**
 * Diffs a template's client groups against its already-generated tasks (matched by
 * clientId, since a client is only ever meant to hold one active task per template)
 * to decide what "Aplicar alterações" needs to do: create a task for any client newly
 * covered by a group, and update the recurrence/due date on existing tasks whose
 * group recurrence (interval or day-of-month) has changed since they were created.
 * Clients whose task is already correctly configured are left untouched — this keeps
 * the plan (and its on-screen preview) empty when there's genuinely nothing to do.
 */
export function planTemplateApply(groups, allClientIds, tasksForTemplate, dayOfMonth) {
  const taskByClientId = new Map(tasksForTemplate.filter((t) => t.clientId).map((t) => [t.clientId, t]));
  const toCreate = [];
  const toUpdate = [];

  for (const group of groups) {
    const targetIds = group.allClients ? allClientIds : group.clientIds;
    for (const clientId of targetIds) {
      const existingTask = taskByClientId.get(clientId);
      if (!existingTask) {
        toCreate.push({ clientId, recurrenceMonths: group.recurrenceMonths });
        continue;
      }
      const currentInterval = existingTask.recurrence?.intervalMonths || 1;
      const currentDay = existingTask.recurrence?.dayOfMonth || 1;
      if (currentInterval !== group.recurrenceMonths || currentDay !== dayOfMonth) {
        toUpdate.push({ taskId: existingTask.id, recurrenceMonths: group.recurrenceMonths });
      }
    }
  }

  return { toCreate, toUpdate };
}

/** "Nome da tarefa completado no dia X do mês Y do ano Z", auto-posted as a comment when a templated task is moved to Done. */
export function formatCompletionComment(taskTitle, now = new Date()) {
  const monthName = now.toLocaleDateString('pt-PT', { month: 'long' });
  const monthCapitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  return `${taskTitle} completado no dia ${now.getDate()} do mês ${monthCapitalized} do ano ${now.getFullYear()}`;
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
