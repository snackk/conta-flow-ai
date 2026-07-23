import React from 'react';
import { Coffee, Workflow } from 'lucide-react';

const PAYPAL_URL = 'https://paypal.me/snackk026';

function AboutPage() {
  const cardClass = 'bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6';

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">Sobre</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Informação sobre esta aplicação.</p>
      </div>

      <div className={cardClass}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
            <Workflow className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 dark:text-slate-100">ContaFlow AI</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">Quadro de tarefas em equipa, com precedências e recorrência</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300">
          Desenvolvido por <span className="font-semibold text-slate-800 dark:text-slate-100">Diogo Santos</span>.
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
          Versão <span className="font-mono">{__APP_VERSION__}</span>
        </p>
      </div>

      <div className={cardClass}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 dark:text-slate-100">Oferece-me um café</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Se esta aplicação lhe é útil, considere apoiar o seu desenvolvimento.</p>
          </div>
        </div>

        <a
          href={PAYPAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 shadow-sm shadow-amber-600/20 transition-colors"
        >
          <Coffee className="w-4 h-4" /> Pagar um café via PayPal
        </a>
      </div>
    </div>
  );
}

export default AboutPage;
