import React, { useMemo, useState } from 'react';
import { Bell, Clock } from 'lucide-react';
import Avatar from './Avatar.jsx';
import { formatDate, getFullName, getTaskUrgency, URGENCY } from '../utils/taskLogic.js';

const URGENCY_STYLES = {
  [URGENCY.URGENT]: {
    dot: 'bg-red-500',
    row: 'bg-red-50 dark:bg-red-500/10 hover:bg-red-100/70 dark:hover:bg-red-500/20',
    badge: 'bg-red-600',
    text: 'text-red-700 dark:text-red-300',
  },
  [URGENCY.WARNING]: {
    dot: 'bg-amber-500',
    row: 'bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100/70 dark:hover:bg-amber-500/20',
    badge: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
  },
};

function NotificationBell({ tasks, users, onOpenTask }) {
  const [open, setOpen] = useState(false);
  const usersById = useMemo(() => new Map(users.map((u) => [u.uid, u])), [users]);

  const notifications = useMemo(() => {
    return tasks
      .map((task) => ({ task, urgency: getTaskUrgency(task) }))
      .filter((n) => n.urgency !== null)
      .sort((a, b) => {
        if (a.urgency !== b.urgency) return a.urgency === URGENCY.URGENT ? -1 : 1;
        return (a.task.dueDate || '').localeCompare(b.task.dueDate || '');
      });
  }, [tasks]);

  const handleOpenNotification = (task) => {
    setOpen(false);
    onOpenTask(task);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Notificações"
        className="relative p-2 rounded-full text-white lg:text-slate-500 dark:lg:text-slate-400 hover:bg-white/10 lg:hover:bg-slate-100 lg:dark:hover:bg-slate-700 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {notifications.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold ring-2 ring-indigo-600 lg:ring-white lg:dark:ring-slate-800">
            {notifications.length > 99 ? '99+' : notifications.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Notificações</span>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">{notifications.length}</span>
            </div>

            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">Sem notificações. Tudo em dia!</p>
            ) : (
              <div className="max-h-[22rem] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                {notifications.map(({ task, urgency }) => {
                  const style = URGENCY_STYLES[urgency];
                  const assignee = usersById.get(task.assignedTo);
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => handleOpenNotification(task)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${style.row}`}
                    >
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${style.dot}`} />
                      <Avatar profile={assignee} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {assignee ? getFullName(assignee) : 'Sem responsável'} — {task.title}
                        </p>
                        <p className={`text-xs font-medium mt-0.5 flex items-center gap-1 ${style.text}`}>
                          <Clock className="w-3 h-3" /> {formatDate(task.dueDate)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationBell;
