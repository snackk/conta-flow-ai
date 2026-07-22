import React from 'react';
import { Ban, CalendarClock, Link2, Repeat, Text, User2 } from 'lucide-react';
import { formatDate, getTaskUrgency, isOverdue, STAGES, URGENCY } from '../utils/taskLogic.js';

const URGENCY_CARD_STYLES = {
  [URGENCY.URGENT]: 'ring-2 ring-red-400 dark:ring-red-500/60 bg-red-50/70 dark:bg-red-500/10',
  [URGENCY.WARNING]: 'ring-2 ring-amber-400 dark:ring-amber-500/60 bg-amber-50/70 dark:bg-amber-500/10',
};

function TaskCard({ task, blockerTitle, templateName, clientName, onClick, onDragStart, onDragEnd, draggable = true }) {
  const overdue = isOverdue(task.dueDate, task.progress);
  const blocked = task.stage === STAGES.BLOCKED;
  const urgency = getTaskUrgency(task);

  return (
    <div
      role="button"
      tabIndex={0}
      draggable={draggable}
      onDragStart={(e) => onDragStart?.(e, task)}
      onDragEnd={onDragEnd}
      onClick={() => onClick?.(task)}
      className={`group relative rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all p-4 cursor-grab active:cursor-grabbing ${blocked ? 'opacity-80' : ''} ${urgency ? URGENCY_CARD_STYLES[urgency] : 'bg-white dark:bg-slate-800'}`}
      style={{ borderLeft: `4px solid ${task.color}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-100 leading-snug line-clamp-2">{task.title}</h4>
        <div className="flex items-center gap-1.5 shrink-0 text-slate-400 dark:text-slate-500">
          {task.description?.trim() && (
            <span title="Tem descrição"><Text className="w-3.5 h-3.5" /></span>
          )}
          {task.recurrence?.enabled && (
            <span title={`Recorrente, dia ${task.recurrence.dayOfMonth} de cada mês`}><Repeat className="w-4 h-4" /></span>
          )}
        </div>
      </div>

      {clientName && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{clientName}</p>
      )}

      <div className="flex items-center justify-between mt-3">
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${overdue ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
          <CalendarClock className="w-3.5 h-3.5" />
          {formatDate(task.dueDate)}
        </span>
        <span
          className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full"
          style={{ backgroundColor: `${task.color}1a`, color: task.color }}
        >
          {templateName || 'Tarefa'}
        </span>
      </div>

      {blocked && blockerTitle && (
        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-lg px-2 py-1.5">
          <Ban className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Depende de: {blockerTitle}</span>
        </div>
      )}

      {!task.assignedTo && (
        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
          <User2 className="w-3.5 h-3.5" /> Sem responsável
        </div>
      )}

      {task.precedingTaskId && !blocked && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
          <Link2 className="w-3 h-3" /> tem precedência
        </div>
      )}
    </div>
  );
}

export default TaskCard;
