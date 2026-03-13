'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table';
import { TableHeader } from '@tiptap/extension-table';
import { supabase } from '@/lib/supabase/client';
import { updateKBArticle, archiveKBArticle } from '@/lib/actions';
import { toast } from 'sonner';
import {
  ArrowLeft, Bold, Italic, Strikethrough, List, ListOrdered,
  Heading1, Heading2, Heading3, Quote, Code, Table2, Link2,
  Minus, Check, Loader2, Archive, Globe, Lock, Hash, X, Tag,
  Folder, ChevronDown,
} from 'lucide-react';
import type { Editor } from '@tiptap/react';

type ArticleData = {
  id: string;
  title: string;
  content: Record<string, unknown> | null;
  category_id: string | null;
  tags: string[];
  visibility: 'internal' | 'all';
  author_id: string | null;
  updated_at: string;
};

type TeamMember = { id: string; name: string; color: string; initials: string };
type Category = { id: string; name: string };

// ─── Toolbar ─────────────────────────────────────────────────────────────────

function ToolbarBtn({
  onClick, active, disabled, children, title,
}: { onClick: () => void; active?: boolean; disabled?: boolean; children: React.ReactNode; title?: string }) {
  return (
    <button
      onClick={onClick} disabled={disabled} title={title}
      className={`p-1.5 rounded text-sm transition-colors ${
        active ? 'bg-[#E0E7FF] dark:bg-indigo-900/40 text-[#3B5BDB] dark:text-indigo-300'
               : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >{children}</button>
  );
}

function ArticleToolbar({ editor, saveStatus }: { editor: Editor | null; saveStatus: 'saved' | 'saving' | 'unsaved' }) {
  if (!editor) return null;
  const addLink = () => {
    const url = window.prompt('URL:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };
  return (
    <div className="flex items-center gap-0.5 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex-wrap bg-white dark:bg-gray-800">
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="H1"><Heading1 size={14} /></ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="H2"><Heading2 size={14} /></ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="H3"><Heading3 size={14} /></ToolbarBtn>
      <div className="w-px h-4 bg-gray-200 dark:bg-gray-600 mx-1" />
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><Bold size={14} /></ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><Italic size={14} /></ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strike"><Strikethrough size={14} /></ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight">
        <span className="text-xs font-bold" style={{ background: 'linear-gradient(180deg, transparent 50%, #fef08a 50%)' }}>H</span>
      </ToolbarBtn>
      <div className="w-px h-4 bg-gray-200 dark:bg-gray-600 mx-1" />
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list"><List size={14} /></ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered list"><ListOrdered size={14} /></ToolbarBtn>
      <div className="w-px h-4 bg-gray-200 dark:bg-gray-600 mx-1" />
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote"><Quote size={14} /></ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block"><Code size={14} /></ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="HR"><Minus size={14} /></ToolbarBtn>
      <div className="w-px h-4 bg-gray-200 dark:bg-gray-600 mx-1" />
      <ToolbarBtn onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Table"><Table2 size={14} /></ToolbarBtn>
      <ToolbarBtn onClick={addLink} active={editor.isActive('link')} title="Link"><Link2 size={14} /></ToolbarBtn>
      <div className="flex-1" />
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
        saveStatus === 'saved' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
        saveStatus === 'saving' ? 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400' :
        'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
      }`}>
        {saveStatus === 'saved' ? <span className="flex items-center gap-1"><Check size={10} /> Saved</span> :
         saveStatus === 'saving' ? <span className="flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Saving...</span> :
         'Unsaved'}
      </span>
    </div>
  );
}

// ─── Tags Input ───────────────────────────────────────────────────────────────

function TagsInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const tag = input.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag]);
    }
    setInput('');
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map(tag => (
          <span key={tag} className="flex items-center gap-1 text-xs bg-[#EEF2FF] dark:bg-indigo-900/30 text-[#4F6AE8] dark:text-indigo-300 px-2 py-0.5 rounded-full">
            <Hash size={9} /> {tag}
            <button onClick={() => onChange(tags.filter(t => t !== tag))} className="hover:text-red-500 transition-colors"><X size={9} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
          }}
          placeholder="Add tag..."
          className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#4F6AE8]"
        />
        <button
          onClick={addTag}
          className="px-2.5 py-1.5 text-xs font-medium bg-[#4F6AE8] text-white rounded-lg hover:bg-[#3B5BDB] transition-colors"
        >Add</button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function KBArticleEditorPage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params.id as string;

  const [article, setArticle] = useState<ArticleData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [notFound, setNotFound] = useState(false);

  // Sidebar fields (local state, synced on save)
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<'internal' | 'all'>('internal');
  const [authorId, setAuthorId] = useState<string>('');

  // Save state
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [archiveConfirm, setArchiveConfirm] = useState(false);

  // Load data
  useEffect(() => {
    Promise.all([
      supabase.from('kb_articles').select('*').eq('id', articleId).single(),
      supabase.from('kb_categories').select('id,name').is('archived_at', null),
      supabase.from('team_members').select('id,name,color,initials').is('archived_at', null),
    ]).then(([artRes, catRes, teamRes]) => {
      if (!artRes.data || artRes.error) { setNotFound(true); return; }
      const art = artRes.data as ArticleData;
      setArticle(art);
      setTitle(art.title);
      setCategoryId(art.category_id || '');
      setTags(art.tags || []);
      setVisibility(art.visibility);
      setAuthorId(art.author_id || '');
      setCategories((catRes.data || []) as Category[]);
      setTeamMembers((teamRes.data || []) as TeamMember[]);
    });
  }, [articleId]);

  // Editor
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start writing your article...' }),
      Link.configure({ openOnClick: false }),
      Highlight,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    onUpdate: () => {
      setSaveStatus('unsaved');
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(doSave, 5000);
    },
  });

  // Load content into editor
  useEffect(() => {
    if (editor && article?.content) {
      try {
        editor.commands.setContent(article.content);
      } catch {}
    }
  }, [editor, article]);

  const doSave = useCallback(async () => {
    if (!editor || !article) return;
    setSaveStatus('saving');
    try {
      const content = editor.getJSON();
      await updateKBArticle(articleId, {
        title,
        content,
        categoryId: categoryId || null,
        tags,
        visibility,
        authorId: authorId || null,
      });
      setSaveStatus('saved');
    } catch (e) {
      console.error('Save failed:', e);
      setSaveStatus('unsaved');
    }
  }, [editor, article, articleId, title, categoryId, tags, visibility, authorId]);

  // Save on title/metadata changes
  useEffect(() => {
    if (!article) return;
    setSaveStatus('unsaved');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(doSave, 5000);
  }, [title, categoryId, tags, visibility, authorId]);

  useEffect(() => {
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, []);

  const handleArchive = async () => {
    try {
      await archiveKBArticle(articleId);
      toast.success('Article archived');
      router.push('/knowledge-base');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (notFound) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F0F3F8' }}>
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-3">Article not found</p>
          <button onClick={() => router.push('/knowledge-base')} className="flex items-center gap-2 text-sm text-[#4F6AE8] hover:underline">
            <ArrowLeft size={14} /> Back to Knowledge Base
          </button>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F0F3F8' }}>
        <Loader2 size={24} className="animate-spin text-[#4F6AE8]" />
      </div>
    );
  }

  return (
    <div className="pt-16 h-screen flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
        <button
          onClick={() => router.push('/knowledge-base')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={14} />
          <span className="hidden sm:inline">Knowledge Base</span>
        </button>
        <div className="h-4 w-px bg-gray-200 dark:bg-gray-600" />
        <span className="text-sm text-gray-500 dark:text-gray-400 truncate">{title || 'Untitled'}</span>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ArticleToolbar editor={editor} saveStatus={saveStatus} />
          <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
            <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
              {/* Title input */}
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Article title..."
                className="w-full text-3xl font-bold text-gray-900 dark:text-white bg-transparent border-none outline-none placeholder-gray-300 dark:placeholder-gray-600 mb-6"
              />
              {/* Editor */}
              <div className="tiptap-editor">
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
          <div className="p-4 space-y-5">

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Category</label>
              <div className="relative">
                <Folder size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#4F6AE8] appearance-none"
                >
                  <option value="">No category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Tags</label>
              <TagsInput tags={tags} onChange={setTags} />
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Visibility</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setVisibility('internal')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                    visibility === 'internal'
                      ? 'bg-gray-800 dark:bg-gray-600 text-white ring-2 ring-gray-800 dark:ring-gray-500'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Lock size={11} /> Internal
                </button>
                <button
                  onClick={() => setVisibility('all')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                    visibility === 'all'
                      ? 'bg-green-600 text-white ring-2 ring-green-600'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Globe size={11} /> All Staff
                </button>
              </div>
            </div>

            {/* Author */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Author</label>
              <select
                value={authorId}
                onChange={e => setAuthorId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#4F6AE8]"
              >
                <option value="">No author</option>
                {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>

            {/* Save button */}
            <button
              onClick={doSave}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-[#4F6AE8] text-white rounded-lg hover:bg-[#3B5BDB] transition-colors"
            >
              {saveStatus === 'saving' ? (
                <><Loader2 size={13} className="animate-spin" /> Saving...</>
              ) : saveStatus === 'saved' ? (
                <><Check size={13} /> Saved</>
              ) : (
                <><Check size={13} /> Save Now</>
              )}
            </button>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700" />

            {/* Archive */}
            {!archiveConfirm ? (
              <button
                onClick={() => setArchiveConfirm(true)}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Archive size={13} /> Archive Article
              </button>
            ) : (
              <div className="space-y-1.5">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Archive this article?</p>
                <div className="flex gap-2">
                  <button onClick={() => setArchiveConfirm(false)} className="flex-1 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                  <button onClick={handleArchive} className="flex-1 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Archive</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
