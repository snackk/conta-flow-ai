import React, { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { DEFAULT_TASK_COLOR, TASK_COLOR_PRESETS, formatDate, nextTemplateDueDate } from '../utils/taskLogic.js';
import AssigneePicker from './AssigneePicker.jsx';
import ClientModal from './ClientModal.jsx';
import MarkdownEditor from './MarkdownEditor.jsx';
import TaskComments from './TaskComments.jsx';

function emptyForm() {
  return {
    title: '',
    description: '',
    clientId: '',
    dueDate: '',
    assignedTo: '',
    precedingTaskId: '',
    templateId: '',
    color: DEFAULT_TASK_COLOR,
    recurrenceEnabled: false,
    recurrenceDay: 1,
  };
}

function SidebarField({ label, action, children, hint }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</label>
        {action}
      </div>
      {children}
      {hint && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">{hint}</p>}
    </div>
  );
}

function TaskModal({ open, task, users, templates, tasks, clients, currentProfile, onUploadImage, onCreateClient, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        clientId: task.clientId || '',
        dueDate: task.dueDate || '',
        assignedTo: task.assignedTo || '',
        precedingTaskId: task.precedingTaskId || '',
        templateId: task.templateId || '',
        color: task.color || DEFAULT_TASK_COLOR,
        recurrenceEnabled: !!task.recurrence?.enabled,
        recurrenceDay: task.recurrence?.dayOfMonth || 1,
      });
    } else {
      setForm(emptyForm());
    }
  }, [open, task]);

  if (!open) return null;

  const handleCreateClient = async (data) => {
    const newClientId = await onCreateClient(data);
    setForm((f) => ({ ...f, clientId: newClientId }));
  };

  const applyTemplate = (templateId) => {
    const tpl = templates.find((t) => t.id === templateId);
    setForm((f) => {
      const recurrenceEnabled = tpl ? !!tpl.recurrence?.enabled : f.recurrenceEnabled;
      const recurrenceDay = tpl?.recurrence?.dayOfMonth || f.recurrenceDay;
      return {
        ...f,
        templateId,
        title: f.title || tpl?.name || '',
        color: tpl?.color || f.color,
        recurrenceEnabled,
        recurrenceDay,
        dueDate: recurrenceEnabled ? nextTemplateDueDate(new Date(), recurrenceDay) : f.dueDate,
      };
    });
  };

  const setRecurrenceEnabled = (enabled) => {
    setForm((f) => ({
      ...f,
      recurrenceEnabled: enabled,
      dueDate: enabled ? nextTemplateDueDate(new Date(), f.recurrenceDay) : f.dueDate,
    }));
  };

  const setRecurrenceDay = (day) => {
    setForm((f) => ({
      ...f,
      recurrenceDay: day,
      dueDate: f.recurrenceEnabled ? nextTemplateDueDate(new Date(), Number(day) || 1) : f.dueDate,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        title: form.title.trim(),
        description: form.description,
        clientId: form.clientId || null,
        dueDate: form.dueDate,
        assignedTo: form.assignedTo || null,
        precedingTaskId: form.precedingTaskId || null,
        templateId: form.templateId || null,
        color: form.color,
        recurrence: { enabled: form.recurrenceEnabled, dayOfMonth: Number(form.recurrenceDay) || 1 },
      }, task?.id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const otherTasks = tasks.filter((t) => t.id !== task?.id);
  const fieldClass = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-6xl h-[88vh] bg-white dark:bg-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">{task ? 'Editar Tarefa' : 'Nova Tarefa'}</span>
          <div className="flex items-center gap-1">
            {task && (
              <button
                type="button"
                onClick={() => { onDelete(task.id); onClose(); }}
                title="Remover tarefa"
                className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4.5 h-4.5" />
              </button>
            )}
            <button type="button" onClick={onClose} title="Fechar" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <input
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Título da tarefa"
            className="w-full text-2xl font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none border-b-2 border-transparent focus:border-indigo-200 dark:focus:border-indigo-500/40 pb-2 mb-6 transition-colors"
          />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            <div className="lg:col-span-3 flex flex-col min-w-0">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">Descrição</label>
              <MarkdownEditor
                value={form.description}
                onChange={(description) => setForm((f) => ({ ...f, description }))}
                onUploadImage={onUploadImage}
                placeholder="Descreva o que é preciso fazer... suporta Markdown (títulos, negrito, itálico, listas, citações, código) e imagens."
                className="min-h-[360px]"
              />

              <TaskComments taskId={task?.id} currentProfile={currentProfile} onUploadImage={onUploadImage} />
            </div>

            <div className="lg:col-span-1 flex flex-col gap-5 bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700 rounded-2xl p-4">
              <SidebarField
                label="Cliente"
                action={(
                  <button
                    type="button"
                    onClick={() => setClientModalOpen(true)}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    <Plus className="w-3.5 h-3.5" /> Novo
                  </button>
                )}
              >
                <select
                  value={form.clientId}
                  onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
                  className={fieldClass}
                >
                  <option value="">Sem cliente</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </SidebarField>

              <SidebarField label="Responsável">
                <AssigneePicker
                  users={users}
                  value={form.assignedTo}
                  onChange={(uid) => setForm((f) => ({ ...f, assignedTo: uid }))}
                />
              </SidebarField>

              <SidebarField
                label="Data de Entrega"
                hint={form.recurrenceEnabled ? 'Calculada automaticamente a partir da recorrência (dia definido, do mês seguinte).' : undefined}
              >
                {form.recurrenceEnabled ? (
                  <div className={`${fieldClass} bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed`}>
                    {formatDate(form.dueDate)}
                  </div>
                ) : (
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                    className={fieldClass}
                  />
                )}
              </SidebarField>

              <SidebarField label="Depende de" hint="Enquanto a tarefa selecionada não estiver Terminada, esta fica Bloqueada.">
                <select
                  value={form.precedingTaskId}
                  onChange={(e) => setForm((f) => ({ ...f, precedingTaskId: e.target.value }))}
                  className={fieldClass}
                >
                  <option value="">Nenhuma</option>
                  {otherTasks.map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </SidebarField>

              <SidebarField label="Modelo de Tarefa">
                <select
                  value={form.templateId}
                  onChange={(e) => applyTemplate(e.target.value)}
                  className={fieldClass}
                >
                  <option value="">Sem modelo</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </SidebarField>

              <SidebarField label="Cor de destaque">
                <div className="flex flex-wrap gap-2">
                  {TASK_COLOR_PRESETS.map((preset) => (
                    <button
                      type="button"
                      key={preset.value}
                      title={preset.label}
                      onClick={() => setForm((f) => ({ ...f, color: preset.value }))}
                      className={`w-7 h-7 rounded-full ring-2 transition-all ${form.color === preset.value ? 'ring-slate-800 scale-110' : 'ring-transparent'}`}
                      style={{ backgroundColor: preset.value }}
                    />
                  ))}
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                    className="w-7 h-7 rounded-full overflow-hidden border border-slate-200 dark:border-slate-600 cursor-pointer"
                  />
                </div>
              </SidebarField>

              <div className="pt-1 border-t border-slate-200 dark:border-slate-700">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 pt-4">
                  <input
                    type="checkbox"
                    checked={form.recurrenceEnabled}
                    onChange={(e) => setRecurrenceEnabled(e.target.checked)}
                    className="w-4 h-4 rounded accent-indigo-600"
                  />
                  Tarefa cíclica (recorrente)
                </label>
                {form.recurrenceEnabled && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    Reinicia no dia
                    <input
                      type="number"
                      min={1}
                      max={28}
                      value={form.recurrenceDay}
                      onChange={(e) => setRecurrenceDay(e.target.value)}
                      className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 text-center"
                    />
                    de cada mês
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-700 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-colors disabled:opacity-60">
            {saving ? 'A guardar...' : 'Guardar'}
          </button>
        </div>
      </form>

      <ClientModal
        open={clientModalOpen}
        client={null}
        onClose={() => setClientModalOpen(false)}
        onSave={handleCreateClient}
      />
    </div>
  );
}

export default TaskModal;
