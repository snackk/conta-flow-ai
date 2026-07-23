import React, { useEffect, useState } from 'react';
import { Moon, Palmtree, Save, Sun } from 'lucide-react';
import Avatar from '../components/Avatar.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { formatDate, isUserOOO } from '../utils/taskLogic.js';

function ProfilePage() {
  const { profile, updateUserProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [oooStart, setOooStart] = useState('');
  const [oooEnd, setOooEnd] = useState('');
  const [oooSaving, setOooSaving] = useState(false);
  const [oooSaved, setOooSaved] = useState(false);
  const [oooError, setOooError] = useState('');

  useEffect(() => {
    setFirstName(profile?.firstName || '');
    setLastName(profile?.lastName || '');
    setOooStart(profile?.oooStart || '');
    setOooEnd(profile?.oooEnd || '');
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await updateUserProfile({ firstName: firstName.trim(), lastName: lastName.trim() });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const handleOooSubmit = async (e) => {
    e.preventDefault();
    setOooError('');
    if (oooStart && oooEnd && oooEnd < oooStart) {
      setOooError('A data de fim não pode ser anterior à data de início.');
      return;
    }
    setOooSaving(true);
    setOooSaved(false);
    try {
      await updateUserProfile({ oooStart: oooStart || null, oooEnd: oooEnd || null });
      setOooSaved(true);
    } finally {
      setOooSaving(false);
    }
  };

  const handleClearOoo = async () => {
    setOooStart('');
    setOooEnd('');
    setOooError('');
    setOooSaving(true);
    setOooSaved(false);
    try {
      await updateUserProfile({ oooStart: null, oooEnd: null });
      setOooSaved(true);
    } finally {
      setOooSaving(false);
    }
  };

  const currentlyOOO = isUserOOO(profile);
  const cardClass = 'bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6';
  const fieldClass = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all';
  const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5';

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">O Meu Perfil</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Se tiver entrado com a Google, a fotografia é obtida automaticamente da sua conta.</p>
      </div>

      <div className={cardClass}>
        <div className="flex items-center gap-4 mb-6">
          <Avatar profile={profile} size="lg" />
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{profile?.email}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{profile?.photoURL ? 'Fotografia sincronizada com a conta Google' : 'Sem fotografia — a usar as iniciais do nome'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Primeiro nome</label>
              <input
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); setSaved(false); }}
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Último nome</label>
              <input
                value={lastName}
                onChange={(e) => { setLastName(e.target.value); setSaved(false); }}
                className={fieldClass}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-colors disabled:opacity-60"
            >
              <Save className="w-4 h-4" /> {saving ? 'A guardar...' : 'Guardar Alterações'}
            </button>
            {saved && <span className="text-sm font-medium text-green-600 dark:text-green-400">Guardado!</span>}
          </div>
        </form>
      </div>

      <div className={cardClass}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 dark:text-slate-100">Aparência</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Escolha o estilo de apresentação da aplicação.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-colors ${
              theme === 'light'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500'
            }`}
          >
            <Sun className="w-4 h-4" /> Claro
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-colors ${
              theme === 'dark'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500'
            }`}
          >
            <Moon className="w-4 h-4" /> Escuro
          </button>
        </div>
      </div>

      <div className={cardClass}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Palmtree className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 dark:text-slate-100">Ausência (Out of Office)</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Enquanto estiver de férias, a sua linha no quadro fica assinalada para que a equipa saiba que as suas tarefas precisam de outro responsável.</p>
          </div>
        </div>

        {currentlyOOO && (
          <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl px-3 py-2">
            <Palmtree className="w-4 h-4" /> Está de férias até {formatDate(profile.oooEnd)}.
          </div>
        )}

        <form onSubmit={handleOooSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Início</label>
              <input
                type="date"
                value={oooStart}
                onChange={(e) => { setOooStart(e.target.value); setOooSaved(false); }}
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Fim</label>
              <input
                type="date"
                value={oooEnd}
                onChange={(e) => { setOooEnd(e.target.value); setOooSaved(false); }}
                className={fieldClass}
              />
            </div>
          </div>

          {oooError && <p className="text-sm text-red-600 dark:text-red-400">{oooError}</p>}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={oooSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 shadow-sm shadow-amber-600/20 transition-colors disabled:opacity-60"
            >
              <Palmtree className="w-4 h-4" /> {oooSaving ? 'A guardar...' : 'Guardar Ausência'}
            </button>
            {(oooStart || oooEnd || profile?.oooStart) && (
              <button
                type="button"
                onClick={handleClearOoo}
                disabled={oooSaving}
                className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-3 py-2.5"
              >
                Remover
              </button>
            )}
            {oooSaved && <span className="text-sm font-medium text-green-600 dark:text-green-400">Guardado!</span>}
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;
