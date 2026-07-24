import React, { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { DEFAULT_TASK_COLOR, TASK_COLOR_PRESETS, emptyTemplateGroup, normalizeTemplateGroups } from '../utils/taskLogic.js';
import ClientMultiPicker from './ClientMultiPicker.jsx';
import MarkdownEditor from './MarkdownEditor.jsx';

function emptyForm() {
  return { name: '', description: '', color: DEFAULT_TASK_COLOR, dayOfMonth: 1, groups: [emptyTemplateGroup()] };
}

function GroupRow({ group, clients, onChange, onRemove, canRemove }) {
  const clientCount = group.allClients ? clients.length : group.clientIds.length;
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-3.5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={group.allClients}
            onChange={(e) => onChange({ ...group, allClients: e.target.checked, clientIds: [] })}
            className="w-4 h-4 rounded accent-indigo-600"
          />
          Todos os clientes
        </label>
        {canRemove && (
          <button type="button" onClick={onRemove} title="Remover grupo" className="text-slate-300 dark:text-slate-500 hover:text-red-600 transition-colors shrink-0">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {!group.allClients && (
        <ClientMultiPicker
          clients={clients}
          selectedIds={group.clientIds}
          onChange={(clientIds) => onChange({ ...group, clientIds })}
        />
      )}

      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
        <span>Renovação a cada</span>
        <input
          type="number"
          min={1}
          max={36}
          value={group.recurrenceMonths}
          onChange={(e) => onChange({ ...group, recurrenceMonths: Number(e.target.value) || 1 })}
          className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 text-center"
        />
        <span>{Number(group.recurrenceMonths) === 1 ? 'mês' : 'meses'}</span>
        <span className="ml-auto text-xs text-slate-400 dark:text-slate-500 shrink-0">
          {clientCount} {clientCount === 1 ? 'cliente' : 'clientes'}
        </span>
      </div>
    </div>
  );
}

function TemplateModal({ open, template, clients, onUploadImage, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (template) {
      setForm({
        name: template.name || '',
        description: template.description || '',
        color: template.color || DEFAULT_TASK_COLOR,
        dayOfMonth: template.dayOfMonth || template.recurrence?.dayOfMonth || 1,
        groups: normalizeTemplateGroups(template),
      });
    } else {
      setForm(emptyForm());
    }
  }, [open, template]);

  if (!open) return null;

  const updateGroup = (index, nextGroup) => {
    setForm((f) => ({ ...f, groups: f.groups.map((g, i) => (i === index ? nextGroup : g)) }));
  };

  const removeGroup = (index) => {
    setForm((f) => ({ ...f, groups: f.groups.filter((_, i) => i !== index) }));
  };

  const addGroup = () => {
    setForm((f) => ({ ...f, groups: [...f.groups, emptyTemplateGroup()] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: form.name.trim(),
        description: form.description.trim(),
        color: form.color,
        dayOfMonth: Number(form.dayOfMonth) || 1,
        groups: form.groups,
      }, template?.id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{template ? 'Editar Modelo' : 'Novo Modelo de Tarefa'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Título do modelo</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: IVA"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
            <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
              Cada tarefa gerada é nomeada "Cliente - {form.name.trim() || 'Título do modelo'}".
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Descrição</label>
            <MarkdownEditor
              value={form.description}
              onChange={(description) => setForm((f) => ({ ...f, description }))}
              onUploadImage={onUploadImage}
              placeholder="Descreva o que esta tarefa envolve... suporta Markdown (títulos, negrito, itálico, listas, citações, código) e imagens."
              className="min-h-[220px]"
            />
            <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">Esta descrição é copiada para cada tarefa gerada por este modelo.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Cor de destaque</label>
            <div className="flex flex-wrap gap-2">
              {TASK_COLOR_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.value}
                  title={preset.label}
                  onClick={() => setForm((f) => ({ ...f, color: preset.value }))}
                  className={`w-8 h-8 rounded-full ring-2 transition-all ${form.color === preset.value ? 'ring-slate-800 scale-110' : 'ring-transparent'}`}
                  style={{ backgroundColor: preset.value }}
                />
              ))}
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-slate-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span>Data de entrega: dia</span>
            <input
              type="number"
              min={1}
              max={28}
              value={form.dayOfMonth}
              onChange={(e) => setForm((f) => ({ ...f, dayOfMonth: e.target.value }))}
              className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 text-center"
            />
            <span>de cada ciclo (partilhado por todos os grupos abaixo)</span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Grupos de clientes e recorrência</label>
              <button
                type="button"
                onClick={addGroup}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar grupo
              </button>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
              Divida os clientes em grupos com recorrências diferentes — por exemplo, alguns entregam mensalmente e outros trimestralmente.
            </p>
            <div className="space-y-3">
              {form.groups.map((group, index) => (
                <GroupRow
                  key={group.id}
                  group={group}
                  clients={clients}
                  onChange={(next) => updateGroup(index, next)}
                  onRemove={() => removeGroup(index)}
                  canRemove={form.groups.length > 1}
                />
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 p-4 text-sm text-indigo-700 dark:text-indigo-300">
            Guardar aqui só grava a configuração — as tarefas só são criadas/atualizadas quando carregar em "Aplicar alterações" no cartão do modelo.
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-colors disabled:opacity-60">
              {saving ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TemplateModal;
