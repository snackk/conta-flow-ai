import React, { useState } from 'react';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import ClientModal from '../components/ClientModal.jsx';

function ClientsPage({ clients, onCreate, onUpdate, onDelete }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const openCreate = () => { setEditingClient(null); setModalOpen(true); };
  const openEdit = (client) => { setEditingClient(client); setModalOpen(true); };

  const handleSave = async (data, clientId) => {
    if (clientId) {
      await onUpdate(clientId, data);
    } else {
      await onCreate(data);
    }
  };

  const handleDelete = async (clientId) => {
    if (window.confirm('Remover este cliente? As tarefas já associadas mantêm a referência, mas deixam de mostrar o nome.')) {
      await onDelete(clientId);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Clientes</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Geste os clientes disponíveis para associar às tarefas.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm shadow-indigo-600/20 transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo Cliente
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-sm bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
          Ainda não existem clientes. Crie o primeiro para poder associá-lo às tarefas.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <div key={client.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Users className="w-4.5 h-4.5" />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 pt-1.5">{client.name}</h3>
              </div>
              {client.notes && <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 line-clamp-3">{client.notes}</p>}

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => openEdit(client)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </button>
                <button
                  onClick={() => handleDelete(client.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ClientModal
        open={modalOpen}
        client={editingClient}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}

export default ClientsPage;
