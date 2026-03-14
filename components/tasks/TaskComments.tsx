'use client';

import { useState, useEffect, useTransition } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createTaskComment, getTaskComments } from '@/lib/actions';
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

              <div className="space-y-3">
                {group.comments.map(comment => {
                  const author = TEAM_MEMBERS.find(m => m.id === comment.author_id);
                  const initials = author?.initials || comment.author_id.slice(0, 2).toUpperCase();
                  const color = author?.color || 'var(--color-primary)';
                  const name = author?.name || comment.author_id;

                  return (
                    <div key={comment.id} className="flex items-start gap-3">
                      {/* Avatar */}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: color }}
                      >
                        {initials}
                      </div>
                      {/* Bubble */}
                      <div
                        className="flex-1 rounded-lg px-5 py-4"
                        style={{
                          backgroundColor: 'var(--color-white)',
                          border: '1px solid var(--color-border)',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                            {name}
                          </span>
                          <span
                            className="text-[11px] uppercase font-medium"
                            style={{ color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}
                          >
                            {timeAgo(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment input */}
      <form onSubmit={handleSubmit} className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ backgroundColor: currentColor }}
        >
          {currentInitials}
        </div>
        <div className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1"
            style={{
              height: '44px',
              border: '1px solid #D0D6E0',
              borderRadius: '8px',
              backgroundColor: 'var(--color-white)',
              fontSize: '14px',
              color: 'var(--color-text-primary)',
              padding: '0 14px',
              outline: 'none',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 91, 219,0.15)';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = '#D0D6E0';
              e.currentTarget.style.boxShadow = 'none';
            }}
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={!text.trim() || submitting}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-white transition-colors flex-shrink-0"
            style={{ backgroundColor: text.trim() && !submitting ? 'var(--color-primary)' : '#D0D6E0' }}
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </form>
    </div>
  );
}
