'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { toast } from 'sonner';
import TopBar from '@/components/layout/TopBar';
import { useAppData } from '@/lib/contexts/AppDataContext';
import { updateClientPillarDocument, createClientPillarKpi, updateClientPillarKpi, deleteClientPillarKpi, createProject, createTask } from '@/lib/actions';
import type { ClientPillar, ClientPillarKpi } from '@/lib/data';
import type { Editor } from '@tiptap/react';
import {
  Bold, Italic, Strikethrough, List, ListOrdered,
  Heading1, Heading2, Heading3, Quote, Code, Table2, Link2,
  Minus, Check, Loader2, X, Plus, Pencil, Trash2, ArrowLeft,
} from 'lucide-react';

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

function ProgressBar({ value, color = 'bg-[#3B5BDB]' }: { value: number; color?: string }) {
  return (
    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
      <div
        className={`h-1.5 rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

export default function PillarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;
  const pillarId = params.pillarId as string;

  const { CLIENTS = [], CLIENT_PILLARS = [], CLIENT_PILLAR_KPIS = [], PROJECTS = [], TASKS = [], TEAM_MEMBERS = [], refresh } = useAppData();

  const pillar = CLIENT_PILLARS.find(p => p.id === pillarId);
  const clientName = CLIENTS.find(c => c.id === clientId)?.name || 'Client';
  const pillarKpis = CLIENT_PILLAR_KPIS.filter(k => k.clientPillarId === pillarId);
  const linkedProjects = PROJECTS.filter(p => p.clientId === clientId);
  const linkedTasks = TASKS.filter(t => t.clientPillarId === pillarId);

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [newKpiForm, setNewKpiForm] = useState({ name: '', target: 0, current: 0, unit: '' });
  const [showNewKpiForm, setShowNewKpiForm] = useState(false);
  const [editingKpiId, setEditingKpiId] = useState<string | null>(null);
  const [editingKpi, setEditingKpi] = useState<ClientPillarKpi | null>(null);
  const [showNewInitiativeModal, setShowNewInitiativeModal] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [initiativeForm, setInitiativeForm] = useState({ name: '', description: '', status: 'planning', startDate: '', endDate: '' });
  const [taskForm, setTaskForm] = useState({ title: '', assigneeId: '', priority: 'Medium', dueDate: '' });
  const [creatingInitiative, setCreatingInitiative] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null as any);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start documenting this pillar...',
      }),
      Link.configure({
        openOnClick: true,
        linkOnPaste: true,
      }),
      Highlight,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: pillar?.document || '<p></p>',
    immediatelyRender: false,
  });

  useEffect(() => {
    setSaveStatus('unsaved');
  }, [editor?.getHTML()]);

  const autoSave = useCallback(() => {
    if (!editor || !pillar) return;

    setSaveStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const content = editor.getJSON();
        await updateClientPillarDocument(pillarId, content);
        setSaveStatus('saved');
      } catch (err) {
        toast.error('Failed to save document');
        console.error(err);
        setSaveStatus('unsaved');
      }
    }, 1500);
  }, [editor, pillar, pillarId]);

  useEffect(() => {
    autoSave();
  }, [editor?.getHTML(), autoSave]);

  const handleAddKpi = async () => {
    if (!newKpiForm.name.trim()) {
      toast.error('KPI name is required');
      return;
    }

    try {
      await createClientPillarKpi(pillarId, {
        name: newKpiForm.name,
        target: newKpiForm.target,
        current: newKpiForm.current,
        unit: newKpiForm.unit,
      });
      toast.success('KPI created');
      setNewKpiForm({ name: '', target: 0, current: 0, unit: '' });
      setShowNewKpiForm(false);
    } catch (err) {
      toast.error('Failed to create KPI');
      console.error(err);
    }
  };

  const handleUpdateKpi = async () => {
    if (!editingKpiId || !editingKpi) return;

    try {
      await updateClientPillarKpi(editingKpiId, {
        name: editingKpi.name,
        target: editingKpi.target,
        current: editingKpi.current,
        unit: editingKpi.unit,
      });
      toast.success('KPI updated');
      setEditingKpiId(null);
      setEditingKpi(null);
    } catch (err) {
      toast.error('Failed to update KPI');
      console.error(err);
    }
  };

  const handleDeleteKpi = async (kpiId: string) => {
    if (!window.confirm('Delete this KPI?')) return;

    try {
      await deleteClientPillarKpi(kpiId);
      toast.success('KPI deleted');
    } catch (err) {
      toast.error('Failed to delete KPI');
      console.error(err);
    }
  };

  const handleCreateInitiative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initiativeForm.name.trim()) {
      toast.error('Initiative name is required');
      return;
    }
    if (!initiativeForm.startDate || !initiativeForm.endDate) {
      toast.error('Start and end dates are required');
      return;
    }

    setCreatingInitiative(true);
    try {
      await createProject({
        clientId,
        name: initiativeForm.name,
        description: initiativeForm.description,
        status: initiativeForm.status,
        startDate: initiativeForm.startDate,
        endDate: initiativeForm.endDate,
        clientPillarId: pillarId,
      });
      toast.success('Initiative created');
      setShowNewInitiativeModal(false);
      setInitiativeForm({ name: '', description: '', status: 'planning', startDate: '', endDate: '' });
      refresh();
    } catch (err) {
      toast.error('Failed to create initiative');
      console.error(err);
    } finally {
      setCreatingInitiative(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) {
      toast.error('Task title is required');
      return;
    }
    if (!taskForm.assigneeId) {
      toast.error('Assignee is required');
      return;
    }
    if (!taskForm.dueDate) {
      toast.error('Due date is required');
      return;
    }

    setCreatingTask(true);
    try {
      await createTask({
        title: taskForm.title,
        clientId,
        assigneeId: taskForm.assigneeId,
        status: 'todo',
        priority: taskForm.priority,
        dueDate: taskForm.dueDate,
        startDate: taskForm.dueDate,
        endDate: taskForm.dueDate,
        clientPillarId: pillarId,
      });
      toast.success('Task created');
      setShowNewTaskModal(false);
      setTaskForm({ title: '', assigneeId: '', priority: 'Medium', dueDate: '' });
      refresh();
    } catch (err) {
      toast.error('Failed to create task');
      console.error(err);
    } finally {
      setCreatingTask(false);
    }
  };

  if (!pillar) {
    return (
      <>
        <TopBar breadcrumb={['Clients', clientName, 'Pillars']} />
        <div className="flex flex-col items-center justify-center p-6 min-h-screen">
          <p className="text-gray-500 mb-4">Pillar not found</p>
          <button onClick={() => router.back()} className="text-blue-600 hover:text-blue-700">
            Go back
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar breadcrumb={['Clients', clientName, 'Pillars', pillar.name]} />
      <div className="p-6">
        {/* Pillar Header Card */}
        <div
          className="bg-white dark:bg-gray-800 rounded-xl border border-[var(--color-border)] shadow-sm p-6 mb-6"
          style={{ borderLeftWidth: '4px', borderLeftColor: pillar.color }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{pillar.name}</h1>
              {pillar.description && (
                <p className="text-gray-600 dark:text-gray-400 text-base">{pillar.description}</p>
              )}
              <div className="flex items-center gap-2 mt-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: pillar.color }}
                />
                <span className="text-sm text-gray-500">{pillar.color}</span>
              </div>
            </div>
            <button
              onClick={() => router.push(`/clients/${clientId}/pillars`)}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ArrowLeft size={14} />
              Back
            </button>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left column: Editor (~65%) */}
          <div className="col-span-3 md:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-[var(--color-border)] overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-[var(--color-border)]">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pillar Document</h2>
              </div>
              <ArticleToolbar editor={editor} saveStatus={saveStatus} />
              <div className="px-6 py-6 prose prose-sm dark:prose-invert max-w-none">
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>

          {/* Right column: Sidebar (~35%) */}
          <div className="col-span-3 md:col-span-1 space-y-6">
            {/* KPIs Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-[var(--color-border)] shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">KPIs</h3>
                <button
                  onClick={() => setShowNewKpiForm(true)}
                  className="flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded-lg transition-colors"
                >
                  <Plus size={12} />
                  Add
                </button>
              </div>

              <div className="p-6 space-y-4">
                {pillarKpis.length === 0 && !showNewKpiForm ? (
                  <p className="text-sm text-gray-500 text-center py-4">No KPIs yet</p>
                ) : (
                  <>
                    {pillarKpis.map((kpi) => {
                      const progress = kpi.target > 0 ? (kpi.current / kpi.target) * 100 : 0;
                      const isEditing = editingKpiId === kpi.id;

                      if (isEditing && editingKpi) {
                        return (
                          <div key={kpi.id} className="border border-[var(--color-border)] rounded-lg p-4 space-y-3">
                            <input
                              type="text"
                              value={editingKpi.name}
                              onChange={(e) => setEditingKpi({ ...editingKpi, name: e.target.value })}
                              placeholder="KPI name"
                              className="w-full text-sm font-medium px-2 py-1 border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:bg-gray-700 dark:text-white"
                            />
                            <div className="grid grid-cols-3 gap-2">
                              <input
                                type="number"
                                value={editingKpi.target}
                                onChange={(e) => setEditingKpi({ ...editingKpi, target: parseFloat(e.target.value) || 0 })}
                                placeholder="Target"
                                className="text-xs px-2 py-1 border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:bg-gray-700 dark:text-white"
                              />
                              <input
                                type="number"
                                value={editingKpi.current}
                                onChange={(e) => setEditingKpi({ ...editingKpi, current: parseFloat(e.target.value) || 0 })}
                                placeholder="Current"
                                className="text-xs px-2 py-1 border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:bg-gray-700 dark:text-white"
                              />
                              <input
                                type="text"
                                value={editingKpi.unit}
                                onChange={(e) => setEditingKpi({ ...editingKpi, unit: e.target.value })}
                                placeholder="Unit"
                                className="text-xs px-2 py-1 border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:bg-gray-700 dark:text-white"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => { setEditingKpiId(null); setEditingKpi(null); }}
                                className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleUpdateKpi}
                                className="px-2 py-1 text-xs font-medium text-white bg-[var(--color-primary)] rounded hover:opacity-90 transition-opacity"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={kpi.id} className="border border-[var(--color-border)] rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{kpi.name}</h4>
                            <div className="flex gap-1">
                              <button
                                onClick={() => { setEditingKpiId(kpi.id); setEditingKpi(kpi); }}
                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteKpi(kpi.id)}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                          <ProgressBar value={progress} color="bg-[#3B5BDB]" />
                          <div className="text-xs text-gray-500 flex items-center justify-between">
                            <span>{kpi.current} / {kpi.target} {kpi.unit}</span>
                            <span className="font-medium">{Math.round(progress)}%</span>
                          </div>
                        </div>
                      );
                    })}

                    {showNewKpiForm && (
                      <div className="border border-[var(--color-border)] rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-gray-700/50">
                        <input
                          type="text"
                          value={newKpiForm.name}
                          onChange={(e) => setNewKpiForm({ ...newKpiForm, name: e.target.value })}
                          placeholder="KPI name"
                          className="w-full text-sm font-medium px-2 py-1 border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:bg-gray-700 dark:text-white"
                          autoFocus
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="number"
                            value={newKpiForm.target}
                            onChange={(e) => setNewKpiForm({ ...newKpiForm, target: parseFloat(e.target.value) || 0 })}
                            placeholder="Target"
                            className="text-xs px-2 py-1 border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:bg-gray-700 dark:text-white"
                          />
                          <input
                            type="number"
                            value={newKpiForm.current}
                            onChange={(e) => setNewKpiForm({ ...newKpiForm, current: parseFloat(e.target.value) || 0 })}
                            placeholder="Current"
                            className="text-xs px-2 py-1 border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:bg-gray-700 dark:text-white"
                          />
                          <input
                            type="text"
                            value={newKpiForm.unit}
                            onChange={(e) => setNewKpiForm({ ...newKpiForm, unit: e.target.value })}
                            placeholder="Unit"
                            className="text-xs px-2 py-1 border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => { setShowNewKpiForm(false); setNewKpiForm({ name: '', target: 0, current: 0, unit: '' }); }}
                            className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddKpi}
                            className="px-2 py-1 text-xs font-medium text-white bg-[var(--color-primary)] rounded hover:opacity-90 transition-opacity"
                          >
                            Add KPI
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Linked Work Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-[var(--color-border)] shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">Linked Work</h3>
              </div>
              <div className="p-6 space-y-4">
                {/* Initiatives Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">Initiatives</div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{linkedProjects.length}</div>
                    </div>
                    <button
                      onClick={() => setShowNewInitiativeModal(true)}
                      className="flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded-lg transition-colors"
                    >
                      <Plus size={12} />
                      New
                    </button>
                  </div>
                  {linkedProjects.length === 0 ? (
                    <p className="text-xs text-gray-500">No initiatives yet</p>
                  ) : (
                    <div className="space-y-2">
                      {linkedProjects.slice(0, 5).map((proj) => (
                        <div
                          key={proj.id}
                          onClick={() => router.push(`/initiatives/${proj.id}`)}
                          className="p-2 rounded-lg border border-[var(--color-border)] hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-900 dark:text-white truncate">{proj.name}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 whitespace-nowrap ml-2">
                              {proj.status}
                            </span>
                          </div>
                        </div>
                      ))}
                      {linkedProjects.length > 5 && (
                        <button
                          onClick={() => router.push(`/initiatives?pillar=${pillarId}`)}
                          className="w-full text-xs font-medium text-[var(--color-primary)] hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded-lg transition-colors"
                        >
                          View all ({linkedProjects.length})
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t border-[var(--color-border)]" />

                {/* Tasks Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">Tasks</div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{linkedTasks.length}</div>
                    </div>
                    <button
                      onClick={() => setShowNewTaskModal(true)}
                      className="flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded-lg transition-colors"
                    >
                      <Plus size={12} />
                      New
                    </button>
                  </div>
                  {linkedTasks.length === 0 ? (
                    <p className="text-xs text-gray-500">No tasks yet</p>
                  ) : (
                    <div className="space-y-2">
                      {linkedTasks.slice(0, 5).map((tsk) => {
                        const assignee = TEAM_MEMBERS.find(t => t.id === tsk.assigneeId);
                        return (
                          <div
                            key={tsk.id}
                            className="p-2 rounded-lg border border-[var(--color-border)] hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-medium text-gray-900 dark:text-white truncate flex-1">{tsk.title}</span>
                              {assignee && (
                                <div
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                  style={{ backgroundColor: assignee.color }}
                                  title={assignee.name}
                                >
                                  {assignee.initials}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {linkedTasks.length > 5 && (
                        <button
                          onClick={() => router.push(`/kanban?pillar=${pillarId}`)}
                          className="w-full text-xs font-medium text-[var(--color-primary)] hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded-lg transition-colors"
                        >
                          View all ({linkedTasks.length})
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* New Initiative Modal */}
            {showNewInitiativeModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-lg">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">New Initiative</h2>
                  <form onSubmit={handleCreateInitiative} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                      <input
                        type="text"
                        value={initiativeForm.name}
                        onChange={(e) => setInitiativeForm({ ...initiativeForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:bg-gray-700 dark:text-white text-sm"
                        placeholder="Initiative name"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                      <textarea
                        value={initiativeForm.description}
                        onChange={(e) => setInitiativeForm({ ...initiativeForm, description: e.target.value })}
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:bg-gray-700 dark:text-white text-sm"
                        placeholder="Optional description"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                      <select
                        value={initiativeForm.status}
                        onChange={(e) => setInitiativeForm({ ...initiativeForm, status: e.target.value })}
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:bg-gray-700 dark:text-white text-sm"
                      >
                        <option value="planning">Planning</option>
                        <option value="active">Active</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={initiativeForm.startDate}
                          onChange={(e) => setInitiativeForm({ ...initiativeForm, startDate: e.target.value })}
                          className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:bg-gray-700 dark:text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                        <input
                          type="date"
                          value={initiativeForm.endDate}
                          onChange={(e) => setInitiativeForm({ ...initiativeForm, endDate: e.target.value })}
                          className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:bg-gray-700 dark:text-white text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewInitiativeModal(false);
                          setInitiativeForm({ name: '', description: '', status: 'Planning', startDate: '', endDate: '' });
                        }}
                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={creatingInitiative}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                      >
                        {creatingInitiative && <Loader2 size={14} className="animate-spin" />}
                        Create
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* New Task Modal */}
            {showNewTaskModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-lg">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">New Task</h2>
                  <form onSubmit={handleCreateTask} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                      <input
                        type="text"
                        value={taskForm.title}
                        onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:bg-gray-700 dark:text-white text-sm"
                        placeholder="Task title"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assignee</label>
                      <select
                        value={taskForm.assigneeId}
                        onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:bg-gray-700 dark:text-white text-sm"
                      >
                        <option value="">Select assignee</option>
                        {TEAM_MEMBERS.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                      <select
                        value={taskForm.priority}
                        onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:bg-gray-700 dark:text-white text-sm"
                      >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                        <option>Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                      <input
                        type="date"
                        value={taskForm.dueDate}
                        onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:bg-gray-700 dark:text-white text-sm"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewTaskModal(false);
                          setTaskForm({ title: '', assigneeId: '', priority: 'Medium', dueDate: '' });
                        }}
                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={creatingTask}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                      >
                        {creatingTask && <Loader2 size={14} className="animate-spin" />}
                        Create
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
