import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { MessageSquare, Trash2 } from 'lucide-react';
import Avatar from './Avatar.jsx';
import MarkdownEditor from './MarkdownEditor.jsx';
import { useComments } from '../hooks/useComments.js';
import { getFullName } from '../utils/taskLogic.js';

function formatCommentTime(timestamp) {
  const date = timestamp?.toDate ? timestamp.toDate() : null;
  if (!date) return 'agora mesmo';
  return date.toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function authorProfile(comment) {
  return {
    uid: comment.authorId,
    firstName: comment.authorFirstName,
    lastName: comment.authorLastName,
    photoURL: comment.authorPhotoURL,
  };
}

function TaskComments({ taskId, currentProfile, onUploadImage }) {
  const { comments, addComment, deleteComment } = useComments(taskId);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);

  if (!taskId) {
    return (
      <div className="mt-8">
        <label className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" /> Comentários
        </label>
        <p className="text-sm text-slate-400 dark:text-slate-500 italic bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700 rounded-xl p-4">
          Guarde a tarefa para poder adicionar comentários.
        </p>
      </div>
    );
  }

  const handlePost = async () => {
    if (!draft.trim() || !currentProfile) return;
    setPosting(true);
    try {
      await addComment(draft.trim(), currentProfile);
      setDraft('');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="mt-8">
      <label className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
        <MessageSquare className="w-3.5 h-3.5" /> Comentários {comments.length > 0 && `(${comments.length})`}
      </label>

      <div className="space-y-4 mb-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <Avatar profile={authorProfile(comment)} size="sm" />
            <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{getFullName(authorProfile(comment))}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-400 dark:text-slate-500">{formatCommentTime(comment.createdAt)}</span>
                  {comment.authorId === currentProfile?.uid && (
                    <button
                      type="button"
                      title="Remover comentário"
                      onClick={() => deleteComment(comment.id)}
                      className="text-slate-300 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="markdown-preview text-sm">
                <ReactMarkdown>{comment.text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Avatar profile={currentProfile} size="sm" />
        <div className="flex-1 min-w-0">
          <MarkdownEditor
            value={draft}
            onChange={setDraft}
            onUploadImage={onUploadImage}
            placeholder="Escreva um comentário... suporta Markdown e imagens."
            className="min-h-[140px]"
          />
          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={handlePost}
              disabled={posting || !draft.trim()}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-colors disabled:opacity-50"
            >
              {posting ? 'A publicar...' : 'Comentar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskComments;
