import React, { useMemo, useState } from 'react';
import {
  ArrowDownAZ, ArrowDownWideNarrow, ArrowDownZA, ArrowUpNarrowWide, ChevronDown, ChevronRight, Palmtree, Plus,
} from 'lucide-react';
import Avatar from '../components/Avatar.jsx';
import TaskCard from '../components/TaskCard.jsx';
import { STAGE_LABELS, STAGE_ORDER, STAGES, formatDate, getFullName, isUserOOO } from '../utils/taskLogic.js';

const COLUMN_TO_PROGRESS = {
  [STAGES.BLOCKED]: 'todo',
  [STAGES.READY]: 'todo',
  [STAGES.IN_PROGRESS]: 'in_progress',
  [STAGES.DONE]: 'done',
};

function BoardPage({ tasks, tasksById, users, templates, clients, currentUserId, onNewTask, onEditTask, onMoveTask }) {
  const templatesById = useMemo(() => new Map(templates.map((tpl) => [tpl.id, tpl])), [templates]);
  const clientsById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const [dragTaskId, setDragTaskId] = useState(null);
  const [hoverCell, setHoverCell] = useState(null);

  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('due_asc');
  const [nameSortDir, setNameSortDir] = useState('asc');
  const [expandedOverrides, setExpandedOverrides] = useState({});

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (assigneeFilter !== 'all') {
        const taskAssignee = task.assignedTo || 'unassigned';
        if (taskAssignee !== assigneeFilter) return false;
      }
      if (clientFilter !== 'all' && (task.clientId || '') !== clientFilter) return false;
      return true;
    });
  }, [tasks, assigneeFilter, clientFilter]);

  const lanes = useMemo(() => {
    const byUser = new Map();
    for (const user of users) {
      if (assigneeFilter !== 'all' && assigneeFilter !== user.uid) continue;
      byUser.set(user.uid, { user, tasks: [] });
    }
    const unassigned = { user: null, tasks: [] };

    for (const task of filteredTasks) {
      if (task.assignedTo && byUser.has(task.assignedTo)) {
        byUser.get(task.assignedTo).tasks.push(task);
      } else if (assigneeFilter === 'all' || assigneeFilter === 'unassigned') {
        unassigned.tasks.push(task);
      }
    }

    const assignedLanes = Array.from(byUser.values())
      .filter((lane) => lane.tasks.length > 0 || assigneeFilter !== 'all' || users.length <= 12)
      .sort((a, b) => {
        const cmp = getFullName(a.user).localeCompare(getFullName(b.user), 'pt', { sensitivity: 'base' });
        return nameSortDir === 'asc' ? cmp : -cmp;
      });

    if (unassigned.tasks.length > 0 || assigneeFilter === 'unassigned') assignedLanes.push(unassigned);
    return assignedLanes;
  }, [filteredTasks, users, assigneeFilter, nameSortDir]);

  const sortTasks = (list) => {
    const sorted = [...list].sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
    return sortOrder === 'due_desc' ? sorted.reverse() : sorted;
  };

  const isLaneExpanded = (laneKey) => {
    if (laneKey in expandedOverrides) return expandedOverrides[laneKey];
    return laneKey === currentUserId;
  };

  const toggleLane = (laneKey) => {
    setExpandedOverrides((prev) => ({ ...prev, [laneKey]: !isLaneExpanded(laneKey) }));
  };

  const handleDragStart = (e, task) => {
    setDragTaskId(task.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  };

  const handleDragEnd = () => {
    setDragTaskId(null);
    setHoverCell(null);
  };

  const handleDrop = (e, stage, userId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || dragTaskId;
    setHoverCell(null);
    setDragTaskId(null);
    if (!taskId) return;

    const task = tasksById.get(taskId);
    if (!task) return;

    if ((stage === STAGES.IN_PROGRESS || stage === STAGES.DONE) && task.stage === STAGES.BLOCKED) {
      return;
    }

    const nextProgress = COLUMN_TO_PROGRESS[stage];
    const nextAssignee = userId || null;
    const progressChanged = nextProgress !== task.progress;
    const assigneeChanged = nextAssignee !== (task.assignedTo || null);

    if (progressChanged || assigneeChanged) {
      const patch = {};
      if (progressChanged) patch.progress = nextProgress;
      if (assigneeChanged) patch.assignedTo = nextAssignee;
      onMoveTask(taskId, patch);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Quadro de Tarefas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Arraste as tarefas entre colunas ou linhas para atualizar o estado e o responsável.</p>
        </div>
        <button
          onClick={onNewTask}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm shadow-indigo-600/20 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nova Tarefa
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Responsável</label>
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          >
            <option value="all">Todos</option>
            {users.map((u) => (
              <option key={u.uid} value={u.uid}>{getFullName(u)}</option>
            ))}
            <option value="unassigned">Sem responsável</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Cliente</label>
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          >
            <option value="all">Todos</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Prioridade (prazo)</label>
          <button
            type="button"
            onClick={() => setSortOrder((s) => (s === 'due_asc' ? 'due_desc' : 'due_asc'))}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-100 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            title="Alternar ordenação por data de entrega"
          >
            {sortOrder === 'due_asc' ? (
              <><ArrowUpNarrowWide className="w-4 h-4 text-indigo-600" /> Mais urgente primeiro</>
            ) : (
              <><ArrowDownWideNarrow className="w-4 h-4 text-indigo-600" /> Mais distante primeiro</>
            )}
          </button>
        </div>

        {(assigneeFilter !== 'all' || clientFilter !== 'all') && (
          <button
            type="button"
            onClick={() => { setAssigneeFilter('all'); setClientFilter('all'); }}
            className="text-xs font-semibold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 px-2"
          >
            Limpar filtros
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60">
        <div className="min-w-[1100px]">
          <div className="grid sticky top-0 z-10 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700" style={{ gridTemplateColumns: '260px repeat(4, minmax(240px, 1fr))' }}>
            <div className="px-4 py-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Responsável
              <button
                type="button"
                onClick={() => setNameSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                title="Alternar ordem alfabética dos responsáveis"
                className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {nameSortDir === 'asc' ? <ArrowDownAZ className="w-3.5 h-3.5" /> : <ArrowDownZA className="w-3.5 h-3.5" />}
              </button>
            </div>
            {STAGE_ORDER.map((stage) => (
              <div key={stage} className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 border-l border-slate-100 dark:border-slate-700">
                {STAGE_LABELS[stage]}
              </div>
            ))}
          </div>

          {lanes.length === 0 && (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-sm">Nenhuma tarefa corresponde aos filtros selecionados.</div>
          )}

          {lanes.map((lane) => {
            const laneKey = lane.user?.uid || 'unassigned';
            const expanded = isLaneExpanded(laneKey);
            const totalCount = lane.tasks.length;
            const oooActive = lane.user ? isUserOOO(lane.user) : false;

            return (
              <div key={laneKey} className="grid border-b border-slate-100 dark:border-slate-700 last:border-b-0" style={{ gridTemplateColumns: '260px repeat(4, minmax(240px, 1fr))' }}>
                <button
                  type="button"
                  onClick={() => toggleLane(laneKey)}
                  title={oooActive ? `De férias até ${formatDate(lane.user.oooEnd)} — reatribua as tarefas urgentes a outro responsável` : undefined}
                  className={`px-4 py-4 flex items-center gap-2 transition-colors text-left border-l-4 ${oooActive ? 'bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100/70 dark:hover:bg-amber-500/20 border-amber-400' : 'bg-slate-50/60 dark:bg-slate-700/40 hover:bg-slate-100/70 dark:hover:bg-slate-700/70 border-transparent'}`}
                >
                  {expanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                  )}
                  {lane.user ? (
                    <>
                      <Avatar profile={lane.user} size="sm" />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{getFullName(lane.user)}</span>
                      {oooActive && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/20 rounded-full px-2 py-0.5 shrink-0">
                          <Palmtree className="w-3 h-3" /> Férias
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 italic">Sem responsável</span>
                  )}
                  {!expanded && totalCount > 0 && (
                    <span className="ml-auto text-[11px] font-bold text-slate-400 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-600/70 rounded-full px-2 py-0.5 shrink-0">
                      {totalCount}
                    </span>
                  )}
                </button>

                {STAGE_ORDER.map((stage) => {
                  const cellId = `${laneKey}:${stage}`;
                  const cellTasks = sortTasks(lane.tasks.filter((t) => t.stage === stage));
                  const isHover = hoverCell === cellId;
                  return (
                    <div
                      key={stage}
                      onDragOver={(e) => { e.preventDefault(); setHoverCell(cellId); }}
                      onDragLeave={() => setHoverCell((c) => (c === cellId ? null : c))}
                      onDrop={(e) => handleDrop(e, stage, lane.user?.uid)}
                      className={`border-l border-slate-100 dark:border-slate-700 transition-colors ${isHover ? 'task-drop-target' : ''} ${expanded ? 'px-3 py-3 space-y-3 min-h-[96px]' : 'px-3 py-4 flex items-center min-h-[52px]'}`}
                    >
                      {expanded ? (
                        cellTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            blockerTitle={task.precedingTaskId ? tasksById.get(task.precedingTaskId)?.title : null}
                            templateName={task.templateId ? templatesById.get(task.templateId)?.name : null}
                            clientName={task.clientId ? clientsById.get(task.clientId)?.name : null}
                            onClick={onEditTask}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                          />
                        ))
                      ) : (
                        cellTasks.length > 0 && (
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-full px-2.5 py-1">
                            {cellTasks.length} {cellTasks.length === 1 ? 'tarefa' : 'tarefas'}
                          </span>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default BoardPage;
