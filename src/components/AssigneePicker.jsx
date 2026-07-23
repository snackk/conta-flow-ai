import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import Avatar from './Avatar.jsx';
import { getFullName } from '../utils/taskLogic.js';

function AssigneePicker({ users, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectedUser = users.find((u) => u.uid === value) || null;

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
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

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => getFullName(u).toLowerCase().includes(q));
  }, [users, query]);

  const select = (uid) => {
    onChange(uid);
    setOpen(false);
  };

  const fieldClass = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all';

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${fieldClass} flex items-center justify-between gap-2 text-left`}
      >
        <span className="flex items-center gap-2 min-w-0">
          {selectedUser ? (
            <>
              <Avatar profile={selectedUser} size="sm" />
              <span className="truncate">{getFullName(selectedUser)}</span>
            </>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">Sem responsável</span>
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
                  if (filteredUsers.length === 1) select(filteredUsers[0].uid);
                }
              }}
              placeholder="Pesquisar por nome..."
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => select('')}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
            >
              Sem responsável
              {!value && <Check className="w-4 h-4 text-indigo-600" />}
            </button>
            {filteredUsers.map((u) => (
              <button
                type="button"
                key={u.uid}
                onClick={() => select(u.uid)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
              >
                <Avatar profile={u} size="sm" />
                <span className="flex-1 min-w-0 truncate text-left">{getFullName(u)}</span>
                {value === u.uid && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
              </button>
            ))}
            {filteredUsers.length === 0 && (
              <p className="px-3 py-4 text-sm text-slate-400 dark:text-slate-500 text-center">Nenhum utilizador encontrado.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AssigneePicker;
