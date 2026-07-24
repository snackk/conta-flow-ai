import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Pencil, Plus, Repeat, Trash2 } from 'lucide-react';
import TemplateModal from '../components/TemplateModal.jsx';
import { normalizeTemplateGroups, planTemplateApply } from '../utils/taskLogic.js';

function GroupSummaryRow({ group, clients }) {
  const count = group.allClients ? clients.length : group.clientIds.length;
  return (
    <div className="flex items-center justify-between gap-2 text-sm bg-slate-50 dark:bg-slate-700/40 rounded-xl px-3 py-2">
      <span className="text-slate-600 dark:text-slate-300">
        {group.allClients ? 'Todos os clientes' : `${count} ${count === 1 ? 'cliente' : 'clientes'}`}
      </span>
      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 shrink-0">
        a cada {group.recurrenceMonths} {Number(group.recurrenceMonths) === 1 ? 'mês' : 'meses'}
      </span>
    </div>
  );
}

function TemplateCard({ tpl, clients, tasks, onEdit, onDelete, onApply }) {
  const [expanded, setExpanded] = useState(false);
  const [applying, setApplying] = useState(false);

  const groups = useMemo(() => normalizeTemplateGroups(tpl), [tpl]);
  const dayOfMonth = tpl.dayOfMonth || tpl.recurrence?.dayOfMonth || 1;
  const allClientIds = useMemo(() => clients.map((c) => c.id), [clients]);
  const tasksForTemplate = useMemo(() => tasks.filter((t) => t.templateId === tpl.id), [tasks, tpl.id]);
  const plan = useMemo(
    () => planTemplateApply(groups, allClientIds, tasksForTemplate, dayOfMonth),
    [groups, allClientIds, tasksForTemplate, dayOfMonth]
  );
  const pendingCount = plan.toCreate.length + plan.toUpdate.length;

  const handleApply = async () => {
    setApplying(true);
    try {
      await onApply(tpl);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5" style={{ borderTop: `4px solid ${tpl.color}` }}>
      <div className="flex items-start gap-2">
        <button type="button" onClick={() => setExpanded((e) => !e)} className="flex items-start gap-2 text-left flex-1 min-w-0">
          <span className="text-slate-400 dark:text-slate-500 mt-0.5 shrink-0">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </span>
          <span className="min-w-0">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate">{tpl.name}</h3>
            {tpl.description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{tpl.description}</p>}
          </span>
        </button>
        <span title={`Data de entrega: dia ${dayOfMonth}`} className="text-slate-400 dark:text-slate-500 shrink-0 mt-0.5">
          <Repeat className="w-4 h-4" />
        </span>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Grupos de clientes · entrega no dia {dayOfMonth}
          </p>
          <div className="space-y-2">
            {groups.map((group) => (
              <GroupSummaryRow key={group.id} group={group} clients={clients} />
            ))}
          </div>

          {pendingCount > 0 ? (
            <div className="rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 p-3 text-sm text-indigo-700 dark:text-indigo-300">
              {plan.toCreate.length > 0 && (
                <p>Serão criadas <strong>{plan.toCreate.length}</strong> {plan.toCreate.length === 1 ? 'tarefa nova' : 'tarefas novas'}.</p>
              )}
              {plan.toUpdate.length > 0 && (
                <p>Serão atualizadas <strong>{plan.toUpdate.length}</strong> {plan.toUpdate.length === 1 ? 'tarefa existente' : 'tarefas existentes'} (recorrência/data de entrega).</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500">Sem alterações pendentes — tudo atualizado.</p>
          )}

          <button
            type="button"
            onClick={handleApply}
            disabled={applying || pendingCount === 0}
            className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {applying ? 'A aplicar...' : 'Aplicar alterações'}
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
        <button
          onClick={() => onEdit(tpl)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" /> Editar
        </button>
        <button
          onClick={() => onDelete(tpl.id)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" /> Remover
        </button>
      </div>
    </div>
  );
}

function TemplatesPage({ templates, clients, tasks, onUploadImage, onCreate, onUpdate, onDelete, onApply }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const openCreate = () => { setEditingTemplate(null); setModalOpen(true); };
  const openEdit = (tpl) => { setEditingTemplate(tpl); setModalOpen(true); };

  const handleSave = async (data, templateId) => {
    if (templateId) {
      await onUpdate(templateId, data);
    } else {
      await onCreate(data);
    }
  };

  const handleDelete = async (templateId) => {
    if (window.confirm('Remover este modelo de tarefa? As tarefas já criadas com este modelo não são afetadas.')) {
      await onDelete(templateId);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Modelos de Tarefa</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Divida os clientes em grupos com recorrências diferentes e gere as tarefas quando quiser, expandindo o modelo.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm shadow-indigo-600/20 transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo Modelo
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-sm bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
          Ainda não existem modelos de tarefa. Crie um modelo para agilizar a criação de tarefas recorrentes como o SAFT ou o IVA.
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              tpl={tpl}
              clients={clients}
              tasks={tasks}
              onEdit={openEdit}
              onDelete={handleDelete}
              onApply={onApply}
            />
          ))}
        </div>
      )}

      <TemplateModal
        open={modalOpen}
        template={editingTemplate}
        clients={clients}
        onUploadImage={onUploadImage}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}

export default TemplatesPage;
