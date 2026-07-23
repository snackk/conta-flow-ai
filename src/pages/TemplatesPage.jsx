import React, { useState } from 'react';
import { Pencil, Plus, Repeat, Trash2 } from 'lucide-react';
import TemplateModal from '../components/TemplateModal.jsx';

function TemplatesPage({ templates, onCreate, onUpdate, onDelete }) {
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
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Defina modelos reutilizáveis (ex: SAFT) com cor e recorrência predefinidas.</p>
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
          Ainda não existem modelos de tarefa. Crie um modelo para agilizar a criação de tarefas recorrentes como o SAFT.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => (
            <div key={tpl.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5" style={{ borderTop: `4px solid ${tpl.color}` }}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-slate-800 dark:text-slate-100">{tpl.name}</h3>
                {tpl.recurrence?.enabled && (
                  <span title={`Data de entrega: dia ${tpl.recurrence.dayOfMonth} de cada mês`} className="text-slate-400 dark:text-slate-500 shrink-0">
                    <Repeat className="w-4 h-4" />
                  </span>
                )}
              </div>
              {tpl.description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-3">{tpl.description}</p>}

              {tpl.recurrence?.enabled && (
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-3">Entrega no dia {tpl.recurrence.dayOfMonth} de cada mês · renova dia 1</p>
              )}

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => openEdit(tpl)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </button>
                <button
                  onClick={() => handleDelete(tpl.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <TemplateModal
        open={modalOpen}
        template={editingTemplate}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}

export default TemplatesPage;
