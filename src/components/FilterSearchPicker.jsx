import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import Avatar from './Avatar.jsx';

/**
 * Search-by-name dropdown for board filters (responsável/cliente), matching the
 * assignee/client picker interaction from the task modal — an "Todos" option plus
 * an optional extra special entry (e.g. "Sem responsável") always sit above the
 * searchable, avatar-led list.
 */
function FilterSearchPicker({ options, value, onChange, placeholder, extraOption }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selected = value === 'all'
    ? null
    : (extraOption && extraOption.value === value ? extraOption : options.find((o) => o.value === value)) || null;

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

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const select = (v) => {
    onChange(v);
    setOpen(false);
  };

  const fieldClass = 'px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-100 text-sm';

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${fieldClass} flex items-center gap-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors min-w-[9rem]`}
      >
        <span className="flex items-center gap-2 min-w-0 flex-1">
          {selected ? (
            <>
              <Avatar profile={selected.profile} name={selected.avatarName} size="sm" />
              <span className="truncate">{selected.label}</span>
            </>
          ) : (
            <span>Todos</span>
          )}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg overflow-hidden">
          <div className="relative p-2 border-b border-slate-100 dark:border-slate-700">
            <Search className="w-4 h-4 text-slate-400 absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setOpen(false);
                if (e.key === 'Enter' && filteredOptions.length === 1) select(filteredOptions[0].value);
              }}
              placeholder={placeholder}
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => select('all')}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
            >
              Todos
              {value === 'all' && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
            </button>
            {extraOption && (
              <button
                type="button"
                onClick={() => select(extraOption.value)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
              >
                {extraOption.label}
                {value === extraOption.value && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
              </button>
            )}
            {filteredOptions.map((o) => (
              <button
                type="button"
                key={o.value}
                onClick={() => select(o.value)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
              >
                <Avatar profile={o.profile} name={o.avatarName} size="sm" />
                <span className="flex-1 min-w-0 truncate text-left">{o.label}</span>
                {value === o.value && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
              </button>
            ))}
            {filteredOptions.length === 0 && (
              <p className="px-3 py-4 text-sm text-slate-400 dark:text-slate-500 text-center">Nenhum resultado encontrado.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FilterSearchPicker;
