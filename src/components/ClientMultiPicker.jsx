import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import Avatar from './Avatar.jsx';

/** Search-by-name multi-select for clients (same interaction as the assignee/client pickers elsewhere), used to pick which clients a task-template recurrence group applies to. Stays open across selections so several clients can be picked in a row. */
function ClientMultiPicker({ clients, selectedIds, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedClients = useMemo(() => clients.filter((c) => selectedSet.has(c.id)), [clients, selectedSet]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [open]);

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [clients, query]);

  const toggle = (clientId) => {
    if (selectedSet.has(clientId)) {
      onChange(selectedIds.filter((id) => id !== clientId));
    } else {
      onChange([...selectedIds, clientId]);
    }
  };

  const fieldClass = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all';

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${fieldClass} flex items-center justify-between gap-2 text-left`}
      >
        <span className="flex items-center gap-1.5 min-w-0 flex-wrap">
          {selectedClients.length === 0 ? (
            <span className="text-slate-400 dark:text-slate-500">Pesquisar e selecionar clientes...</span>
          ) : (
            <>
              {selectedClients.slice(0, 3).map((c) => (
                <span key={c.id} className="flex items-center gap-1 bg-slate-100 dark:bg-slate-600 rounded-full pl-1 pr-2 py-0.5">
                  <Avatar name={c.name} size="sm" />
                  <span className="truncate max-w-[8rem]">{c.name}</span>
                </span>
              ))}
              {selectedClients.length > 3 && (
                <span className="text-slate-500 dark:text-slate-400 font-medium">+{selectedClients.length - 3}</span>
              )}
            </>
          )}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg overflow-hidden">
          <div className="relative p-2 border-b border-slate-100 dark:border-slate-700">
            <Search className="w-4 h-4 text-slate-400 absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setOpen(false);
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (filteredClients.length === 1) toggle(filteredClients[0].id);
                }
              }}
              placeholder="Pesquisar por nome..."
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filteredClients.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => toggle(c.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
              >
                <Avatar name={c.name} size="sm" />
                <span className="flex-1 min-w-0 truncate text-left">{c.name}</span>
                {selectedSet.has(c.id) && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
              </button>
            ))}
            {filteredClients.length === 0 && (
              <p className="px-3 py-4 text-sm text-slate-400 dark:text-slate-500 text-center">Nenhum cliente encontrado.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientMultiPicker;
