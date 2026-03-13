'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table';
import { TableHeader } from '@tiptap/extension-table';
import * as Y from 'yjs';
import { Awareness, encodeAwarenessUpdate, applyAwarenessUpdate } from 'y-protocols/awareness';
import { supabase } from '@/lib/supabase/client';
import { createServerClient } from '@/lib/supabase/client';
import {
  updateDocument, createDocumentVersion, createDocumentComment,
  resolveDocumentComment, archiveDocument,
} from '@/lib/actions';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import {
  ArrowLeft, Bold, Italic, Strikethrough, List, ListOrdered,
  Heading1, Heading2, Heading3, Quote, Code, Table2, Link2,
  Minus, Undo, Redo, MessageSquare, History, Check, Loader2,
  Send, CornerDownRight, Clock, RotateCcw, Settings, X,
  Archive, Globe, Lock, Users, ChevronRight,
} from 'lucide-react';
import type { Editor } from '@tiptap/react';

// ─── User Identity ────────────────────────────────────────────────────────────

const USER_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];

function getOrCreateUser(teamMembers: Array<{ id: string; name: string; color: string; initials: string }>) {
  if (typeof window === 'undefined') return { id: 'anon', name: 'Anonymous', color: '#6366f1' };
  const stored = localStorage.getItem('doc-editor-user');
  if (stored) {
    try { return JSON.parse(stored); } catch {}
  }
  // Pick a random team member
  if (teamMembers.length > 0) {
    const m = teamMembers[Math.floor(Math.random() * teamMembers.length)];
    const user = { id: m.id, name: m.name, color: m.color };
    localStorage.setItem('doc-editor-user', JSON.stringify(user));
    return user;
  }
  const color = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
  const user = { id: `anon-${Date.now()}`, name: `User ${Math.floor(Math.random() * 99)}`, color };
  localStorage.setItem('doc-editor-user', JSON.stringify(user));
  return user;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ id, name, color, size = 28 }: { id: string; name?: string; color?: string; size?: number }) {
  const initials = name ? name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() : '?';
  const bg = color || '#6366f1';
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38, backgroundColor: bg }}
      title={name}
    >
      {initials}
    </div>
  );
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────

function ToolbarButton({
  onClick, active, disabled, children, title,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition-colors text-sm ${
        active
          ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function Toolbar({
  editor,
  saveStatus,
  onToggleComments,
  onToggleHistory,
  showComments,
  showHistory,
  onToggleSettings,
}: {
  editor: Editor | null;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  onToggleComments: () => void;
  onToggleHistory: () => void;
  showComments: boolean;
  showHistory: boolean;
  onToggleSettings: () => void;
}) {
  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt('URL:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="flex items-center gap-0.5 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex-wrap bg-white dark:bg-gray-800 sticky top-0 z-10">
      {/* Headings */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1"><Heading1 size={14} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2"><Heading2 size={14} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3"><Heading3 size={14} /></ToolbarButton>

      <div className="w-px h-4 bg-gray-200 dark:bg-gray-600 mx-1" />

      {/* Text formatting */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><Bold size={14} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><Italic size={14} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><Strikethrough size={14} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight">
        <span className="text-xs font-bold" style={{ background: 'linear-gradient(180deg, transparent 50%, #fef08a 50%)' }}>H</span>
      </ToolbarButton>

      <div className="w-px h-4 bg-gray-200 dark:bg-gray-600 mx-1" />

      {/* Lists */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list"><List size={14} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered list"><ListOrdered size={14} /></ToolbarButton>

      <div className="w-px h-4 bg-gray-200 dark:bg-gray-600 mx-1" />

      {/* Block elements */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote"><Quote size={14} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block"><Code size={14} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule"><Minus size={14} /></ToolbarButton>

      <div className="w-px h-4 bg-gray-200 dark:bg-gray-600 mx-1" />

      {/* Table */}
      <ToolbarButton
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        title="Insert table"
      ><Table2 size={14} /></ToolbarButton>

      {/* Link */}
      <ToolbarButton onClick={addLink} active={editor.isActive('link')} title="Link"><Link2 size={14} /></ToolbarButton>

      <div className="w-px h-4 bg-gray-200 dark:bg-gray-600 mx-1" />

      {/* History */}
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo"><Undo size={14} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo"><Redo size={14} /></ToolbarButton>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Save status */}
      <span className={`text-xs font-medium px-2 py-1 rounded-full mr-2 ${
        saveStatus === 'saved' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
        saveStatus === 'saving' ? 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400' :
        'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
      }`}>
        {saveStatus === 'saved' ? <span className="flex items-center gap-1"><Check size={10} /> Saved</span> :
         saveStatus === 'saving' ? <span className="flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Saving...</span> :
         'Unsaved'}
      </span>

      {/* Panel toggles */}
      <ToolbarButton onClick={onToggleComments} active={showComments} title="Comments">
        <MessageSquare size={14} />
      </ToolbarButton>
      <ToolbarButton onClick={onToggleHistory} active={showHistory} title="Version history">
        <Clock size={14} />
      </ToolbarButton>
      <ToolbarButton onClick={onToggleSettings} title="Document settings">
        <Settings size={14} />
      </ToolbarButton>
    </div>
  );
}

// ─── Comments Sidebar ─────────────────────────────────────────────────────────

type CommentRow = {
  id: string;
  author_id: string;
  text: string;
  created_at: string;
  resolved: boolean;
  parent_comment_id: string | null;
};

function CommentsSidebar({
  documentId,
  currentUser,
  teamMembers,
  onClose,
}: {
  documentId: string;
  currentUser: { id: string; name: string; color: string };
  teamMembers: Array<{ id: string; name: string; color: string }>;
  onClose: () => void;
}) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [newText, setNewText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('comments')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setComments((data as CommentRow[]) || []);
        setLoading(false);
      });
  }, [documentId]);

  const getAuthor = (id: string) => teamMembers.find(m => m.id === id) || { name: id, color: '#6366f1' };

  const submitComment = async (text: string, parentId?: string) => {
    if (!text.trim()) return;
    try {
      const id = await createDocumentComment({
        documentId,
        authorId: currentUser.id,
        text: text.trim(),
        parentCommentId: parentId,
      });
      const newComment: CommentRow = {
        id,
        author_id: currentUser.id,
        text: text.trim(),
        created_at: new Date().toISOString(),
        resolved: false,
        parent_comment_id: parentId || null,
      };
      setComments(prev => [...prev, newComment]);
      if (parentId) { setReplyTo(null); setReplyText(''); } else { setNewText(''); }
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const toggleResolve = async (comment: CommentRow) => {
    try {
      await resolveDocumentComment(comment.id, !comment.resolved);
      setComments(prev => prev.map(c => c.id === comment.id ? { ...c, resolved: !c.resolved } : c));
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const topComments = comments.filter(c => !c.parent_comment_id);

  return (
    <div className="w-80 flex-shrink-0 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageSquare size={14} className="text-indigo-500" /> Comments
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"><X size={14} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center py-4"><Loader2 size={20} className="animate-spin mx-auto text-gray-400" /></div>
        ) : topComments.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">No comments yet. Start a discussion!</p>
        ) : (
          topComments.map(comment => {
            const author = getAuthor(comment.author_id);
            const replies = comments.filter(c => c.parent_comment_id === comment.id);
            return (
              <div key={comment.id} className={`rounded-lg border p-3 ${comment.resolved ? 'opacity-60 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30' : 'border-gray-200 dark:border-gray-600'}`}>
                <div className="flex items-start gap-2 mb-2">
                  <Avatar id={comment.author_id} name={author.name} color={author.color} size={24} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{author.name}</span>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">{format(parseISO(comment.created_at), 'MMM d, h:mm a')}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">{comment.text}</p>
                  </div>
                </div>

                {/* Replies */}
                {replies.map(reply => {
                  const replyAuthor = getAuthor(reply.author_id);
                  return (
                    <div key={reply.id} className="ml-6 mt-2 flex gap-2">
                      <Avatar id={reply.author_id} name={replyAuthor.name} color={replyAuthor.color} size={18} />
                      <div className="flex-1">
                        <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">{replyAuthor.name}</span>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">{reply.text}</p>
                      </div>
                    </div>
                  );
                })}

                {/* Reply input */}
                {replyTo === comment.id && (
                  <div className="mt-2 flex gap-2 ml-6">
                    <input
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') submitComment(replyText, comment.id); }}
                      placeholder="Write a reply..."
                      autoFocus
                      className="flex-1 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button onClick={() => submitComment(replyText, comment.id)} className="p-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"><Send size={10} /></button>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                    className="text-[10px] text-gray-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                  >
                    <CornerDownRight size={9} /> Reply
                  </button>
                  <button
                    onClick={() => toggleResolve(comment)}
                    className={`text-[10px] flex items-center gap-1 transition-colors ${comment.resolved ? 'text-green-600 hover:text-red-500' : 'text-gray-400 hover:text-green-600'}`}
                  >
                    <Check size={9} /> {comment.resolved ? 'Resolved' : 'Resolve'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New comment */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <Avatar id={currentUser.id} name={currentUser.name} color={currentUser.color} size={24} />
          <div className="flex-1">
            <textarea
              value={newText}
              onChange={e => setNewText(e.target.value)}
              placeholder="Add a comment..."
              rows={2}
              className="w-full text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
            <button
              onClick={() => submitComment(newText)}
              className="mt-1 flex items-center gap-1 text-xs font-medium bg-indigo-600 text-white px-2.5 py-1 rounded hover:bg-indigo-700 transition-colors"
            >
              <Send size={10} /> Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Version History Panel ────────────────────────────────────────────────────

type VersionRow = {
  id: string;
  document_id: string;
  version: string;
  author_id: string;
  summary: string;
  created_at: string;
};

function VersionHistoryPanel({
  documentId,
  teamMembers,
  onRestore,
  onClose,
}: {
  documentId: string;
  teamMembers: Array<{ id: string; name: string; color: string }>;
  onRestore: (content: string) => void;
  onClose: () => void;
}) {
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<VersionRow | null>(null);

  useEffect(() => {
    supabase
      .from('document_versions')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setVersions((data as VersionRow[]) || []);
        setLoading(false);
      });
  }, [documentId]);

  const getAuthor = (id: string) => teamMembers.find(m => m.id === id) || { name: id, color: '#6366f1' };

  return (
    <div className="w-72 flex-shrink-0 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <History size={14} className="text-indigo-500" /> Version History
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"><X size={14} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="text-center py-4"><Loader2 size={18} className="animate-spin mx-auto text-gray-400" /></div>
        ) : versions.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">No versions saved yet</p>
        ) : (
          versions.map(v => {
            const author = getAuthor(v.author_id);
            return (
              <div
                key={v.id}
                onClick={() => setPreview(v)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  preview?.id === v.id
                    ? 'border-indigo-300 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{v.version}</span>
                  <span className="text-[10px] text-gray-400">{format(parseISO(v.created_at), 'MMM d, h:mm a')}</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1.5 line-clamp-2">{v.summary || 'Auto-saved'}</p>
                <div className="flex items-center gap-1.5">
                  <Avatar id={v.author_id} name={author.name} color={author.color} size={16} />
                  <span className="text-[10px] text-gray-400">{author.name.split(' ')[0]}</span>
                </div>
                {preview?.id === v.id && (
                  <button
                    onClick={e => { e.stopPropagation(); onRestore(v.version); }}
                    className="mt-2 w-full flex items-center justify-center gap-1 text-[11px] font-medium bg-indigo-600 text-white py-1 rounded hover:bg-indigo-700 transition-colors"
                  >
                    <RotateCcw size={10} /> Restore this version
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Document Settings Panel ──────────────────────────────────────────────────

function DocumentSettingsPanel({
  document: doc,
  clients,
  teamMembers,
  onClose,
  onUpdate,
}: {
  document: { id: string; title: string; clientId: string; type: string; collaborators: string[] };
  clients: Array<{ id: string; name: string; color: string }>;
  teamMembers: Array<{ id: string; name: string; color: string; initials: string }>;
  onClose: () => void;
  onUpdate: (data: { title: string; clientId: string; type: string; collaboratorIds: string[] }) => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(doc.title);
  const [type, setType] = useState(doc.type || 'client');
  const [clientId, setClientId] = useState(doc.clientId || '');
  const [collaboratorIds, setCollaboratorIds] = useState<string[]>(doc.collaborators || []);
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDocument(doc.id, {
        title,
        type: type as 'client' | 'internal',
        clientId: type === 'client' ? clientId : undefined,
        collaboratorIds,
      });
      onUpdate({ title, clientId, type, collaboratorIds });
      toast.success('Document updated');
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    try {
      await archiveDocument(doc.id);
      toast.success('Document archived');
      router.push('/documents');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="w-72 flex-shrink-0 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Settings size={14} className="text-indigo-500" /> Settings
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"><X size={14} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type</label>
          <div className="grid grid-cols-2 gap-1.5">
            {(['client', 'internal'] as const).map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`py-1.5 px-2 rounded text-xs font-medium transition-colors capitalize ${
                  type === t ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                }`}
              >{t}</button>
            ))}
          </div>
        </div>

        {type === 'client' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Client</label>
            <select
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Collaborators</label>
          <div className="flex flex-wrap gap-1.5">
            {teamMembers.map(m => (
              <button
                key={m.id}
                onClick={() => setCollaboratorIds(prev =>
                  prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id]
                )}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                  collaboratorIds.includes(m.id) ? 'ring-1 ring-indigo-500' : 'opacity-50 hover:opacity-100'
                }`}
                style={{ backgroundColor: m.color + '20', color: m.color }}
              >
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ backgroundColor: m.color }}>{m.initials}</span>
                {m.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          Save Changes
        </button>
        {!archiveConfirm ? (
          <button
            onClick={() => setArchiveConfirm(true)}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Archive size={12} /> Archive Document
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setArchiveConfirm(false)} className="flex-1 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
            <button onClick={handleArchive} className="flex-1 py-2 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Confirm Archive</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Document Editor ─────────────────────────────────────────────────────

export default function DocumentEditorPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;

  // State
  const [docData, setDocData] = useState<{
    id: string; title: string; clientId: string; type: string;
    yjsState?: string; collaborators: string[];
  } | null>(null);
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string; color: string; initials: string }>>([]);
  const [clients, setClients] = useState<Array<{ id: string; name: string; color: string }>>([]);
  const [notFound, setNotFound] = useState(false);

  // Yjs refs
  const ydocRef = useRef<Y.Doc | null>(null);
  const awarenessRef = useRef<Awareness | null>(null);
  const [yjsReady, setYjsReady] = useState(false);
  const currentUserRef = useRef<{ id: string; name: string; color: string } | null>(null);

  // Presence
  const [presenceUsers, setPresenceUsers] = useState<Array<{ clientId: number; name: string; color: string }>>([]);

  // Auto-save
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const versionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasChangesRef = useRef(false);

  // Panels
  const [showComments, setShowComments] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Load document data
  useEffect(() => {
    const db = createServerClient();
    Promise.all([
      supabase.from('documents').select('*').eq('id', documentId).single(),
      supabase.from('document_collaborators').select('team_member_id').eq('document_id', documentId),
      supabase.from('team_members').select('*').is('archived_at', null),
      supabase.from('clients').select('id,name,color').is('archived_at', null),
    ]).then(([docRes, collabRes, teamRes, clientsRes]) => {
      if (!docRes.data || docRes.error) { setNotFound(true); return; }
      const collaborators = (collabRes.data || []).map((c: { team_member_id: string }) => c.team_member_id);
      const members = (teamRes.data || []) as Array<{ id: string; name: string; color: string; initials: string }>;
      setTeamMembers(members);
      setClients((clientsRes.data || []) as Array<{ id: string; name: string; color: string }>);
      setDocData({
        id: docRes.data.id,
        title: docRes.data.title,
        clientId: docRes.data.client_id,
        type: docRes.data.type || 'client',
        yjsState: docRes.data.yjs_state,
        collaborators,
      });
      // Init user
      currentUserRef.current = getOrCreateUser(members);
    });
  }, [documentId]);

  // Init Yjs when doc data is loaded
  useEffect(() => {
    if (!docData) return;
    const doc = new Y.Doc();
    if (docData.yjsState) {
      try {
        const state = new Uint8Array(Buffer.from(docData.yjsState, 'base64'));
        Y.applyUpdate(doc, state);
      } catch (e) {
        console.warn('Failed to load yjs state:', e);
      }
    }
    const awareness = new Awareness(doc);
    ydocRef.current = doc;
    awarenessRef.current = awareness;

    // Set local user
    if (currentUserRef.current) {
      awareness.setLocalStateField('user', currentUserRef.current);
    }

    // Update presence list
    awareness.on('update', () => {
      const states = Array.from(awareness.getStates().entries()).map(([clientId, state]) => ({
        clientId,
        name: (state.user as { name?: string })?.name || 'Anonymous',
        color: (state.user as { color?: string })?.color || '#6366f1',
      }));
      setPresenceUsers(states.filter(s => s.clientId !== awareness.clientID));
    });

    setYjsReady(true);

    return () => {
      awareness.destroy();
      doc.destroy();
      setYjsReady(false);
    };
  }, [docData]);

  // Supabase Realtime after Yjs ready
  useEffect(() => {
    if (!yjsReady || !ydocRef.current || !awarenessRef.current) return;
    const ydoc = ydocRef.current;
    const awareness = awarenessRef.current;

    const channel = supabase.channel(`document:${documentId}`, {
      config: { broadcast: { self: false } },
    });

    // Send Yjs updates
    const handleUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin !== 'remote') {
        channel.send({
          type: 'broadcast',
          event: 'yjs-update',
          payload: { update: Buffer.from(update).toString('base64') },
        });
      }
    };
    ydoc.on('update', handleUpdate);

    // Receive Yjs updates
    channel.on('broadcast', { event: 'yjs-update' }, ({ payload }) => {
      const update = new Uint8Array(Buffer.from(payload.update as string, 'base64'));
      Y.applyUpdate(ydoc, update, 'remote');
    });

    // Send awareness updates
    const handleAwareness = ({ updated }: { updated: number[] }) => {
      const update = encodeAwarenessUpdate(awareness, updated);
      channel.send({
        type: 'broadcast',
        event: 'yjs-awareness',
        payload: { update: Buffer.from(update).toString('base64') },
      });
    };
    awareness.on('update', handleAwareness);

    // Receive awareness updates
    channel.on('broadcast', { event: 'yjs-awareness' }, ({ payload }) => {
      applyAwarenessUpdate(awareness, Buffer.from(payload.update as string, 'base64'), 'remote');
    });

    channel.subscribe();

    return () => {
      ydoc.off('update', handleUpdate);
      awareness.off('update', handleAwareness);
      supabase.removeChannel(channel);
    };
  }, [yjsReady, documentId]);

  // Auto-save
  const doSave = useCallback(async (editorInstance: Editor) => {
    if (!docData) return;
    setSaveStatus('saving');
    try {
      const content = JSON.stringify(editorInstance.getJSON());
      const yjsState = ydocRef.current
        ? Buffer.from(Y.encodeStateAsUpdate(ydocRef.current)).toString('base64')
        : undefined;
      await updateDocument(docData.id, { content, yjsState });
      setSaveStatus('saved');
    } catch (e) {
      console.error('Auto-save failed:', e);
      setSaveStatus('unsaved');
    }
  }, [docData]);

  // Version snapshot timer
  useEffect(() => {
    if (!docData || !currentUserRef.current) return;
    const interval = setInterval(async () => {
      if (!hasChangesRef.current) return;
      try {
        await createDocumentVersion({
          documentId: docData.id,
          content: '',
          authorId: currentUserRef.current!.id,
          summary: 'Auto-saved',
        });
        hasChangesRef.current = false;
      } catch {}
    }, 30000);
    versionTimerRef.current = interval;
    return () => clearInterval(interval);
  }, [docData]);

  // Editor
  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: yjsReady && ydocRef.current && awarenessRef.current && currentUserRef.current ? [
        StarterKit.configure({ undoRedo: false }),
        Collaboration.configure({ document: ydocRef.current }),
        CollaborationCursor.configure({
          provider: { awareness: awarenessRef.current },
          user: currentUserRef.current,
        }),
        Placeholder.configure({ placeholder: 'Start writing...' }),
        Link.configure({ openOnClick: false }),
        Highlight,
        Table.configure({ resizable: true }),
        TableRow,
        TableCell,
        TableHeader,
      ] : [
        StarterKit,
        Placeholder.configure({ placeholder: 'Loading editor...' }),
      ],
      onUpdate: ({ editor: e }) => {
        hasChangesRef.current = true;
        setSaveStatus('unsaved');
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => doSave(e), 5000);
      },
    },
    [yjsReady]
  );

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (versionTimerRef.current) clearInterval(versionTimerRef.current);
    };
  }, []);

  if (notFound) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-3">Document not found</p>
          <button onClick={() => router.push('/documents')} className="flex items-center gap-2 text-sm text-indigo-600 hover:underline">
            <ArrowLeft size={14} /> Back to documents
          </button>
        </div>
      </div>
    );
  }

  if (!docData) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  const client = clients.find(c => c.id === docData.clientId);
  const currentUser = currentUserRef.current || { id: 'anon', name: 'Anonymous', color: '#6366f1' };

  return (
    <div className="pt-16 h-screen flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
        <button
          onClick={() => router.push('/documents')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={14} />
          <span className="hidden sm:inline">Documents</span>
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gray-900 dark:text-white truncate">{docData.title}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            {client ? (
              <span className="text-xs font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: client.color + '20', color: client.color }}>
                {client.name}
              </span>
            ) : docData.type === 'internal' ? (
              <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center gap-0.5">
                <Lock size={9} /> Internal
              </span>
            ) : null}
          </div>
        </div>

        {/* Presence */}
        {presenceUsers.length > 0 && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xs text-gray-400 hidden sm:block">{presenceUsers.length} viewing</span>
            <div className="flex -space-x-2">
              {presenceUsers.slice(0, 5).map(u => (
                <Avatar key={u.clientId} id={String(u.clientId)} name={u.name} color={u.color} size={26} />
              ))}
            </div>
          </div>
        )}

        {/* Current user indicator */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Avatar id={currentUser.id} name={currentUser.name} color={currentUser.color} size={26} />
          <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{currentUser.name}</span>
        </div>
      </div>

      {/* Editor area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Toolbar
            editor={editor}
            saveStatus={saveStatus}
            onToggleComments={() => { setShowComments(s => !s); setShowHistory(false); setShowSettings(false); }}
            onToggleHistory={() => { setShowHistory(s => !s); setShowComments(false); setShowSettings(false); }}
            showComments={showComments}
            showHistory={showHistory}
            onToggleSettings={() => { setShowSettings(s => !s); setShowComments(false); setShowHistory(false); }}
          />

          <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
            <div className="max-w-4xl mx-auto tiptap-editor">
              {!yjsReady && (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={20} className="animate-spin text-indigo-400" />
                  <span className="ml-2 text-sm text-gray-400">Initializing editor...</span>
                </div>
              )}
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>

        {/* Panels */}
        {showComments && currentUser && (
          <CommentsSidebar
            documentId={documentId}
            currentUser={currentUser}
            teamMembers={teamMembers}
            onClose={() => setShowComments(false)}
          />
        )}
        {showHistory && (
          <VersionHistoryPanel
            documentId={documentId}
            teamMembers={teamMembers}
            onRestore={(version) => {
              toast.success(`Previewing version ${version}`);
            }}
            onClose={() => setShowHistory(false)}
          />
        )}
        {showSettings && docData && (
          <DocumentSettingsPanel
            document={{ ...docData, collaborators: docData.collaborators }}
            clients={clients}
            teamMembers={teamMembers}
            onClose={() => setShowSettings(false)}
            onUpdate={(data) => {
              setDocData(prev => prev ? { ...prev, ...data, clientId: data.clientId, type: data.type } : null);
            }}
          />
        )}
      </div>
    </div>
  );
}
