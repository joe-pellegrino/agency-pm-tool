'use client';

import { useState, useEffect, useTransition } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createTaskComment, getTaskComments, updateTaskComment, deleteTaskComment } from '@/lib/actions';
import { useAppData } from '@/lib/contexts/AppDataContext';

interface CommentRow {
  id: string;
  task_id: string;
  author_id: string;
  text: string;
  created_at: string;
  resolved: boolean;
}

const CURRENT_USER_ID = 'joe';

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'JUST NOW';
  if (diffMin < 60) return `${diffMin} MINUTE${diffMin !== 1 ? 'S' : ''} AGO`;
  if (diffHr < 24) return `${diffHr} HOUR${diffHr !== 1 ? 'S' : ''} AGO`;
  if (diffDay === 1) return 'YESTERDAY';
  if (diffDay < 7) return `${diffDay} DAYS AGO`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

function dateGroupLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const commentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (commentDate.getTime() === today.getTime()) return 'TODAY';
  if (commentDate.getTime() === yesterday.getTime()) return 'YESTERDAY';
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
}

interface TaskCommentsProps {
  taskId: string;
}

export default function TaskComments({ taskId }: TaskCommentsProps) {
  const { TEAM_MEMBERS = [] } = useAppData();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    setLoading(true);
    getTaskComments(taskId)
      .then(rows => setComments(rows as CommentRow[]))
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [taskId]);

  const currentUser = TEAM_MEMBERS.find(m => m.id === CURRENT_USER_ID);
  const currentInitials = currentUser?.initials || 'JP';
  const currentColor = currentUser?.color || 'var(--color-primary)';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    const optimistic: CommentRow = {
      id: `temp-${Date.now()}`,
      task_id: taskId,
      author_id: CURRENT_USER_ID,
      text: text.trim(),
      created_at: new Date().toISOString(),
      resolved: false,
    };
    setComments(prev => [...prev, optimistic]);
    setText('');
    startTransition(async () => {
      try {
        await createTaskComment({ taskId, authorId: CURRENT_USER_ID, text: optimistic.text });
        // Refresh comments from server
        const fresh = await getTaskComments(taskId);
        setComments(fresh as CommentRow[]);
      } catch (err) {
        toast.error('Failed to post comment: ' + (err as Error).message);
        setComments(prev => prev.filter(c => c.id !== optimistic.id));
        setText(optimistic.text);
      } finally {
        setSubmitting(false);
      }
    });
  };

  // Group comments by date
  const grouped: { label: string; comments: CommentRow[] }[] = [];
  let lastLabel = '';
  for (const c of comments) {
    const label = dateGroupLabel(c.created_at);
    if (label !== lastLabel) {
      grouped.push({ label, comments: [c] });
      lastLabel = label;
    } else {
      grouped[grouped.length - 1].comments.push(c);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Comments</span>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ backgroundColor: 'var(--color-donut-track)', color: '#4338CA' }}
        >
          {comments.length}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={18} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-muted)' }}>
          No comments yet. Be the first to add one.
        </p>
      ) : (
        <div className="space-y-4 mb-4">
          {grouped.map(group => (
            <div key={group.label}>
              {/* Date grouper */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', letterSpacing: '1px' }}>
                  {group.label}
                </span>
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
              </div>

              <div className="space-y-4">
                {group.comments.map(comment => {
                  const author = TEAM_MEMBERS.find(m => m.id === comment.author_id);
                  const initials = author?.initials || comment.author_id.slice(0, 2).toUpperCase();
                  const color = author?.color || '#000000';
                  const name = author?.name || comment.author_id;

                  return (
                    <div key={comment.id} className="flex space-x-3">
                      {/* Avatar */}
                      <div className="shrink-0">
                        <span
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: color }}
                        >
                          {initials}
                        </span>
                      </div>
                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                            {name}
                          </p>
                          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            {timeAgo(comment.created_at)}
                          </span>
                        </div>

                        {editingId === comment.id ? (
                          /* Edit mode */
                          <div className="mt-1">
                            <textarea
                              value={editText}
                              onChange={e => setEditText(e.target.value)}
                              rows={2}
                              className="block w-full rounded-md border-0 py-1.5 text-sm shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-gray-800 dark:text-white dark:ring-gray-600"
                              style={{
                                color: 'var(--color-text-primary)',
                                backgroundColor: 'var(--color-white)',
                              }}
                            />
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={async () => {
                                  if (!editText.trim()) return;
                                  try {
                                    await updateTaskComment({ id: comment.id, text: editText.trim() });
                                    setComments(prev => prev.map(c => c.id === comment.id ? { ...c, text: editText.trim() } : c));
                                    setEditingId(null);
                                    toast.success('Comment updated');
                                  } catch (err) {
                                    toast.error('Failed to update comment: ' + (err as Error).message);
                                  }
                                }}
                                className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="text-xs font-medium"
                                style={{ color: 'var(--color-text-muted)' }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* View mode */
                          <div className="mt-1">
                            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                              {comment.text}
                            </p>
                            {comment.author_id === CURRENT_USER_ID && (
                              <div className="mt-1 flex gap-3">
                                <button
                                  onClick={() => { setEditingId(comment.id); setEditText(comment.text); }}
                                  className="text-xs"
                                  style={{ color: 'var(--color-text-muted)', cursor: 'pointer' }}
                                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={async () => {
                                    try {
                                      setComments(prev => prev.filter(c => c.id !== comment.id));
                                      await deleteTaskComment(comment.id);
                                      toast.success('Comment deleted');
                                    } catch (err) {
                                      toast.error('Failed to delete comment: ' + (err as Error).message);
                                      setComments(prev => [...prev, comment]);
                                    }
                                  }}
                                  className="text-xs"
                                  style={{ color: 'var(--color-text-muted)', cursor: 'pointer' }}
                                  onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
                                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment input - Tailwind UI "with avatar and action" pattern */}
      <div className="flex items-start space-x-4">
        {/* Left: commenter avatar */}
        <div className="shrink-0">
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: currentColor }}
          >
            {currentInitials}
          </span>
        </div>
        {/* Right: textarea + actions */}
        <div className="min-w-0 flex-1">
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="task-comment" className="sr-only">
                Add your comment
              </label>
              <textarea
                id="task-comment"
                name="task-comment"
                rows={3}
                value={text}
                onChange={e => setText(e.target.value)}
                disabled={submitting}
                placeholder="Add a comment..."
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-500 dark:focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--color-white)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>
            <div className="mt-2 flex justify-between">
              {/* Left side - optional action buttons (skipped for now) */}
              <div />
              {/* Right side - submit button */}
              <div className="shrink-0">
                <button
                  type="submit"
                  disabled={!text.trim() || submitting}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin mr-2" />
                      Posting...
                    </>
                  ) : (
                    'Post'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
