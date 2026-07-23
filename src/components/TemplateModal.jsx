import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { DEFAULT_TASK_COLOR, TASK_COLOR_PRESETS } from '../utils/taskLogic.js';

function emptyForm() {
  return { name: '', description: '', color: DEFAULT_TASK_COLOR, recurrenceEnabled: false, recurrenceDay: 1 };
}

function TemplateModal({ open, template, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (template) {
      setForm({
        name: template.name || '',
        description: template.description || '',
        color: template.color || DEFAULT_TASK_COLOR,
        recurrenceEnabled: !!template.recurrence?.enabled,
        recurrenceDay: template.recurrence?.dayOfMonth || 1,
      });
    } else {
      setForm(emptyForm());
    }
  }, [open, template]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: form.name.trim(),
        description: form.description.trim(),
        color: form.color,
        recurrence: { enabled: form.recurrenceEnabled, dayOfMonth: Number(form.recurrenceDay) || 1 },
      }, template?.id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{template ? 'Editar Modelo' : 'Novo Modelo de Tarefa'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nome do modelo</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: SAFT"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder="Descrição opcional do que esta tarefa envolve"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
            />
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

          <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={form.recurrenceEnabled}
                onChange={(e) => setForm((f) => ({ ...f, recurrenceEnabled: e.target.checked }))}
                className="w-4 h-4 rounded accent-indigo-600"
              />
              Recorrente (renova mensalmente)
            </label>
            {form.recurrenceEnabled && (
              <>
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  Data de entrega: dia
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={form.recurrenceDay}
                    onChange={(e) => setForm((f) => ({ ...f, recurrenceDay: e.target.value }))}
                    className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 text-center"
                  />
                  de cada mês
                </div>
                <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Ao ser terminada, a tarefa renova automaticamente no dia 1 do mês seguinte.</p>
              </>
            )}
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
