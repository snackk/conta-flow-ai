import React, { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Bold, Code, Eye, Heading1, Heading2, Image as ImageIcon, Italic, List, ListOrdered, Loader2, Pencil, Quote,
} from 'lucide-react';

const TOOLBAR_ACTIONS = [
  { icon: Heading1, label: 'Título 1', block: true, wrap: (sel) => `# ${sel || 'Título'}` },
  { icon: Heading2, label: 'Título 2', block: true, wrap: (sel) => `## ${sel || 'Título'}` },
  { icon: Bold, label: 'Negrito', wrap: (sel) => `**${sel || 'texto'}**` },
  { icon: Italic, label: 'Itálico', wrap: (sel) => `*${sel || 'texto'}*` },
  { icon: List, label: 'Lista', block: true, wrap: (sel) => (sel || 'item').split('\n').map((l) => `- ${l}`).join('\n') },
  { icon: ListOrdered, label: 'Lista numerada', block: true, wrap: (sel) => (sel || 'item').split('\n').map((l, i) => `${i + 1}. ${l}`).join('\n') },
  { icon: Quote, label: 'Citação', block: true, wrap: (sel) => (sel || 'citação').split('\n').map((l) => `> ${l}`).join('\n') },
  { icon: Code, label: 'Código', wrap: (sel) => (sel && sel.includes('\n') ? `\`\`\`\n${sel}\n\`\`\`` : `\`${sel || 'código'}\``) },
];

function MarkdownEditor({ value, onChange, placeholder, onUploadImage, className = '' }) {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [mode, setMode] = useState('write');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const insertAtCursor = (insertion, { block = false } = {}) => {
    const ta = textareaRef.current;
    const selectionStart = ta ? ta.selectionStart : value.length;
    const selectionEnd = ta ? ta.selectionEnd : value.length;
    const before = value.slice(0, selectionStart);
    const after = value.slice(selectionEnd);

    let text = insertion;
    if (block && before && !before.endsWith('\n')) text = `\n${text}`;

    const newValue = `${before}${text}${after}`;
    onChange(newValue);

    requestAnimationFrame(() => {
      if (!ta) return;
      ta.focus();
      const cursor = before.length + text.length;
      ta.setSelectionRange(cursor, cursor);
    });
  };

  const applyAction = (action) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const selected = value.slice(ta.selectionStart, ta.selectionEnd);
    insertAtCursor(action.wrap(selected), { block: action.block });
  };

  const handleImageFile = async (file) => {
    if (!file || !onUploadImage) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Só é possível enviar imagens.');
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      const url = await onUploadImage(file);
      const alt = (file.name || 'imagem').replace(/\.[^.]+$/, '');
      insertAtCursor(`![${alt}](${url})`, { block: true });
    } catch (err) {
      console.error(err);
      setUploadError(err.message || 'Não foi possível enviar a imagem.');
    } finally {
      setUploading(false);
    }
  };

  const handlePaste = (e) => {
    const imageItem = Array.from(e.clipboardData?.items || []).find((item) => item.type.startsWith('image/'));
    if (imageItem) {
      e.preventDefault();
      handleImageFile(imageItem.getAsFile());
    }
  };

  const handleDrop = (e) => {
    const file = Array.from(e.dataTransfer?.files || []).find((f) => f.type.startsWith('image/'));
    if (file) {
      e.preventDefault();
      handleImageFile(file);
    }
  };

  return (
    <div className={`flex flex-col border border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden bg-white dark:bg-slate-800 ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-700/40 px-2 py-1.5 shrink-0">
        <div className="flex items-center gap-0.5">
          {TOOLBAR_ACTIONS.map((action, i) => (
            <button
              key={i}
              type="button"
              title={action.label}
              onClick={() => applyAction(action)}
              disabled={mode === 'preview' || uploading}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-600 hover:text-slate-800 dark:hover:text-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <action.icon className="w-4 h-4" />
            </button>
          ))}
          {onUploadImage && (
            <>
              <span className="w-px h-4 bg-slate-200 dark:bg-slate-600 mx-1" />
              <button
                type="button"
                title="Inserir imagem"
                onClick={() => fileInputRef.current?.click()}
                disabled={mode === 'preview' || uploading}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-600 hover:text-slate-800 dark:hover:text-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { handleImageFile(e.target.files?.[0]); e.target.value = ''; }}
              />
            </>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setMode('write')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${mode === 'write' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <Pencil className="w-3.5 h-3.5" /> Escrever
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${mode === 'preview' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <Eye className="w-3.5 h-3.5" /> Pré-visualizar
          </button>
        </div>
      </div>

      {mode === 'write' ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          placeholder={placeholder}
          className="flex-1 w-full resize-none p-4 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
        />
      ) : (
        <div className="flex-1 overflow-y-auto p-4 markdown-preview">
          {value.trim() ? (
            <ReactMarkdown>{value}</ReactMarkdown>
          ) : (
            <p className="text-slate-400 dark:text-slate-500 italic">Nada para pré-visualizar.</p>
          )}
        </div>
      )}

      {uploadError && (
        <div className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-t border-red-100 dark:border-red-500/20">{uploadError}</div>
      )}
    </div>
  );
}

export default MarkdownEditor;
