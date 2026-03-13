'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
import { useAppData } from '@/lib/contexts/AppDataContext';
import { createDocument, createDocumentFolder, updateDocumentFolder, archiveDocumentFolder, moveDocumentToFolder } from '@/lib/actions';
import { toast } from 'sonner';
import {
  FileText, Plus, Search, X, Loader2,
  Building2, Lock, Globe, Clock, Users,
  LayoutGrid, List, Folder, FolderPlus, FolderOpen,
  ChevronRight, ChevronDown, MoreHorizontal, Pencil, Archive,
  FolderInput, Menu,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { DocumentFolder } from '@/lib/data';

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ id, size = 24 }: { id: string; size?: number }) {
  const { TEAM_MEMBERS = [] } = useAppData();
  const m = TEAM_MEMBERS.find(m => m.id === id);
  if (!m) return null;
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 border-2 border-white dark:border-gray-800"
      style={{ width: size, height: size, fontSize: size * 0.38, backgroundColor: m.color }}
      title={m.name}
    >
      {m.initials}
    </div>
  );
}

// ─── New Document Modal ───────────────────────────────────────────────────────

function NewDocumentModal({ onClose, defaultFolderId }: { onClose: () => void; defaultFolderId?: string }) {
  const { CLIENTS = [], TEAM_MEMBERS = [], DOCUMENT_FOLDERS = [] } = useAppData();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'client' | 'internal'>('client');
  const [clientId, setClientId] = useState('');
  const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);
  const [folderId, setFolderId] = useState(defaultFolderId || '');
  const [loading, setLoading] = useState(false);

  const toggleCollaborator = (id: string) => {
    setCollaboratorIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const handleCreate = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (type === 'client' && !clientId) { toast.error('Select a client for client documents'); return; }
    setLoading(true);
    try {
      const id = await createDocument({
        title: title.trim(), type,
        clientId: type === 'client' ? clientId : undefined,
        collaboratorIds,
      });
      if (folderId) {
        await moveDocumentToFolder(id, folderId);
      }
      toast.success('Document created');
      onClose();
      router.push(`/documents/${id}`);
    } catch (e) {
      toast.error((e as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">New Document</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
            <input
              value={title} onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Document title..."
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4F6AE8]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setType('client')} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${type === 'client' ? 'border-indigo-500 bg-[#EEF2FF] dark:bg-indigo-900/30 text-[#3B5BDB] dark:text-indigo-300' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                <Building2 size={14} /> Client Document
              </button>
              <button onClick={() => setType('internal')} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${type === 'internal' ? 'border-indigo-500 bg-[#EEF2FF] dark:bg-indigo-900/30 text-[#3B5BDB] dark:text-indigo-300' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                <Lock size={14} /> Internal
              </button>
            </div>
          </div>
          {type === 'client' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Client</label>
              <select value={clientId} onChange={e => setClientId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4F6AE8]">
                <option value="">Select a client...</option>
                {CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Folder (optional)</label>
            <select value={folderId} onChange={e => setFolderId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4F6AE8]">
              <option value="">No folder</option>
              {DOCUMENT_FOLDERS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Collaborators</label>
            <div className="flex flex-wrap gap-2">
              {TEAM_MEMBERS.map(m => (
                <button key={m.id} onClick={() => toggleCollaborator(m.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${collaboratorIds.includes(m.id) ? 'ring-2 ring-offset-1 ring-indigo-500' : 'opacity-60 hover:opacity-100'}`}
                  style={{ backgroundColor: m.color + '20', color: m.color }}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: m.color }}>{m.initials}</span>
                  {m.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
          <button onClick={handleCreate} disabled={loading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-[#4F6AE8] text-white rounded-lg hover:bg-[#3B5BDB] transition-colors disabled:opacity-50">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {loading ? 'Creating...' : 'Create Document'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── New Folder Modal ─────────────────────────────────────────────────────────

function NewFolderModal({ onClose, parentId }: { onClose: () => void; parentId?: string }) {
  const { CLIENTS = [], DOCUMENT_FOLDERS = [] } = useAppData();
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [parent, setParent] = useState(parentId || '');
  const [color, setColor] = useState('#6366f1');
  const [loading, setLoading] = useState(false);

  const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];

  const handleCreate = async () => {
    if (!name.trim()) { toast.error('Folder name is required'); return; }
    setLoading(true);
    try {
      await createDocumentFolder({ name: name.trim(), parentId: parent || undefined, clientId: clientId || undefined, color });
      toast.success('Folder created');
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><FolderPlus size={18} className="text-[#4F6AE8]" /> New Folder</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Folder name..."
              autoFocus
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4F6AE8]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} className={`w-6 h-6 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : 'hover:scale-110'}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Parent Folder (optional)</label>
            <select value={parent} onChange={e => setParent(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4F6AE8]">
              <option value="">None (top-level)</option>
              {DOCUMENT_FOLDERS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Client (optional)</label>
            <select value={clientId} onChange={e => setClientId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4F6AE8]">
              <option value="">Any client</option>
              {CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
          <button onClick={handleCreate} disabled={loading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-[#4F6AE8] text-white rounded-lg hover:bg-[#3B5BDB] transition-colors disabled:opacity-50">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <FolderPlus size={14} />}
            Create Folder
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Move to Folder Modal ─────────────────────────────────────────────────────

function MoveToFolderModal({ docId, docTitle, onClose }: { docId: string; docTitle: string; onClose: () => void }) {
  const { DOCUMENT_FOLDERS = [] } = useAppData();
  const [folderId, setFolderId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMove = async () => {
    setLoading(true);
    try {
      await moveDocumentToFolder(docId, folderId || null);
      toast.success('Document moved');
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Move Document</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{docTitle}</p>
          <select value={folderId} onChange={e => setFolderId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4F6AE8]">
            <option value="">No folder (root)</option>
            {DOCUMENT_FOLDERS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
          <button onClick={handleMove} disabled={loading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-[#4F6AE8] text-white rounded-lg hover:bg-[#3B5BDB] transition-colors disabled:opacity-50">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <FolderInput size={14} />}
            Move
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Folder Sidebar ───────────────────────────────────────────────────────────

function FolderSidebar({
  folders,
  documents,
  activeFolderId,
  onSelectFolder,
  onNewFolder,
  isOpen,
  onClose,
}: {
  folders: DocumentFolder[];
  documents: Array<{ folderId?: string | null }>;
  activeFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onNewFolder: () => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { CLIENTS = [] } = useAppData();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [menuFolder, setMenuFolder] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const topFolders = folders.filter(f => !f.parentId);

  const docCount = (fid: string | null) => {
    if (fid === null) return documents.filter(d => !d.folderId).length;
    return documents.filter(d => d.folderId === fid).length;
  };

  const totalDocs = documents.length;

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await updateDocumentFolder(id, { name: editName.trim() });
      toast.success('Folder renamed');
      setEditingFolder(null);
    } catch (e) { toast.error((e as Error).message); }
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Archive this folder? Documents will be moved to root.')) return;
    try {
      await archiveDocumentFolder(id);
      toast.success('Folder archived');
      if (activeFolderId === id) onSelectFolder(null);
    } catch (e) { toast.error((e as Error).message); }
  };

  const handleSelectFolder = (id: string | null) => {
    onSelectFolder(id);
    onClose(); // close drawer on mobile after selection
  };

  const renderFolder = (folder: DocumentFolder, depth = 0) => {
    const children = folders.filter(f => f.parentId === folder.id);
    const isExpanded = expanded.has(folder.id);
    const isActive = activeFolderId === folder.id;
    const client = CLIENTS.find(c => c.id === folder.clientId);
    const count = docCount(folder.id);

    return (
      <div key={folder.id}>
        <div
          className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-sm ${isActive ? 'bg-[#EEF2FF] dark:bg-indigo-900/30 text-[#3B5BDB] dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
        >
          {children.length > 0 ? (
            <button onClick={() => setExpanded(prev => { const s = new Set(prev); s.has(folder.id) ? s.delete(folder.id) : s.add(folder.id); return s; })} className="flex-shrink-0">
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          ) : <span className="w-3 flex-shrink-0" />}

          <button onClick={() => handleSelectFolder(folder.id)} className="flex items-center gap-1.5 flex-1 min-w-0">
            {isActive ? <FolderOpen size={14} style={{ color: folder.color }} /> : <Folder size={14} style={{ color: folder.color }} />}
            {editingFolder === folder.id ? (
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleRename(folder.id); if (e.key === 'Escape') setEditingFolder(null); }}
                onBlur={() => handleRename(folder.id)}
                autoFocus
                className="flex-1 text-xs bg-white dark:bg-gray-700 border border-indigo-300 rounded px-1 py-0.5 focus:outline-none"
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span className="truncate text-xs font-medium">{folder.name}</span>
            )}
          </button>

          <div className="flex items-center gap-1 flex-shrink-0">
            {client && <span className="text-[9px] px-1 py-0.5 rounded-full truncate max-w-[60px]" style={{ backgroundColor: client.color + '20', color: client.color }}>{client.name.split(' ')[0]}</span>}
            <span className="text-[10px] text-gray-400 font-medium">{count}</span>
            <div className="relative">
              <button
                onClick={e => { e.stopPropagation(); setMenuFolder(menuFolder === folder.id ? null : folder.id); }}
                className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              >
                <MoreHorizontal size={12} />
              </button>
              {menuFolder === folder.id && (
                <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1">
                  <button onClick={() => { setEditingFolder(folder.id); setEditName(folder.name); setMenuFolder(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Pencil size={11} /> Rename
                  </button>
                  <button onClick={() => { handleArchive(folder.id); setMenuFolder(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Archive size={11} /> Archive
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {isExpanded && children.map(child => renderFolder(child, depth + 1))}
      </div>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar — fixed drawer on mobile, static on desktop */}
      <div
        className={`
          fixed top-16 left-0 bottom-0 z-40 w-64
          md:static md:top-auto md:bottom-auto md:z-auto md:w-56 md:flex-shrink-0
          transform transition-transform duration-300 ease-in-out
          md:transform-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          flex flex-col overflow-y-auto
        `}
        onClick={() => setMenuFolder(null)}
      >
        {/* Mobile-only header with close button */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200 dark:border-gray-700 md:hidden">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <Folder size={15} className="text-[#4F6AE8]" /> Folders
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Desktop header */}
        <div className="hidden md:block p-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Folders</h3>

          {/* All Documents */}
          <button
            onClick={() => handleSelectFolder(null)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors mb-0.5 ${activeFolderId === null ? 'bg-[#EEF2FF] dark:bg-indigo-900/30 text-[#3B5BDB] dark:text-indigo-300 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <FileText size={14} />
            <span className="flex-1 text-left text-xs">All Documents</span>
            <span className="text-[10px] text-gray-400 font-medium">{totalDocs}</span>
          </button>

          {/* Unfiled */}
          <button
            onClick={() => handleSelectFolder('__unfiled__')}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${activeFolderId === '__unfiled__' ? 'bg-[#EEF2FF] dark:bg-indigo-900/30 text-[#3B5BDB] dark:text-indigo-300 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <FileText size={14} className="text-gray-400" />
            <span className="flex-1 text-left text-xs">Unfiled</span>
            <span className="text-[10px] text-gray-400 font-medium">{docCount(null)}</span>
          </button>
        </div>

        {/* Mobile: All Documents + Unfiled */}
        <div className="md:hidden p-3 border-b border-gray-200 dark:border-gray-700 space-y-0.5">
          <button
            onClick={() => handleSelectFolder(null)}
            className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${activeFolderId === null ? 'bg-[#EEF2FF] dark:bg-indigo-900/30 text-[#3B5BDB] dark:text-indigo-300 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <FileText size={15} />
            <span className="flex-1 text-left text-sm">All Documents</span>
            <span className="text-xs text-gray-400 font-medium">{totalDocs}</span>
          </button>
          <button
            onClick={() => handleSelectFolder('__unfiled__')}
            className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${activeFolderId === '__unfiled__' ? 'bg-[#EEF2FF] dark:bg-indigo-900/30 text-[#3B5BDB] dark:text-indigo-300 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <FileText size={15} className="text-gray-400" />
            <span className="flex-1 text-left text-sm">Unfiled</span>
            <span className="text-xs text-gray-400 font-medium">{docCount(null)}</span>
          </button>
        </div>

        <div className="flex-1 p-2 space-y-0.5">
          {topFolders.map(f => renderFolder(f))}
          {topFolders.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4 px-2">No folders yet</p>
          )}
        </div>

        <div className="p-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onNewFolder}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#4F6AE8] dark:text-indigo-400 hover:bg-[#EEF2FF] dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
          >
            <FolderPlus size={13} /> New Folder
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Documents Page ───────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const { DOCUMENTS = [], CLIENTS = [], TEAM_MEMBERS = [], DOCUMENT_FOLDERS = [] } = useAppData();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'client' | 'internal'>('all');
  const [filterClient, setFilterClient] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [movingDoc, setMovingDoc] = useState<{ id: string; title: string } | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('doc-view-mode') as 'grid' | 'list') || 'grid';
    }
    return 'grid';
  });

  const setView = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') localStorage.setItem('doc-view-mode', mode);
  };

  const filtered = useMemo(() => {
    return DOCUMENTS.filter(doc => {
      if (search && !doc.title.toLowerCase().includes(search.toLowerCase())) return false;
      const docType = doc.type || 'client';
      if (filterType !== 'all' && docType !== filterType) return false;
      if (filterClient && doc.clientId !== filterClient) return false;
      if (activeFolderId === '__unfiled__') return !doc.folderId;
      if (activeFolderId !== null) return doc.folderId === activeFolderId;
      return true;
    });
  }, [DOCUMENTS, search, filterType, filterClient, activeFolderId]);

  return (
    <div className="pt-16 min-h-screen flex flex-col" style={{ backgroundColor: '#F0F3F8' }}>
      <TopBar title="Documents" subtitle="Real-time collaborative document editor" />

      <div className="flex flex-1 overflow-hidden">
        {/* Folder Sidebar */}
        <FolderSidebar
          folders={DOCUMENT_FOLDERS}
          documents={DOCUMENTS}
          activeFolderId={activeFolderId}
          onSelectFolder={setActiveFolderId}
          onNewFolder={() => setShowFolderModal(true)}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6">
            {/* Mobile: folder toggle button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
              title="Browse folders"
            >
              <Menu size={16} />
            </button>

            {/* Search bar — full width on mobile */}
            <div className="relative flex-1 min-w-0">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search documents..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4F6AE8]"
              />
            </div>

            {/* Type filter */}
            <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1 flex-shrink-0">
              {(['all', 'client', 'internal'] as const).map(t => (
                <button key={t} onClick={() => setFilterType(t)} className={`px-2 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${filterType === t ? 'bg-[#4F6AE8] text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                  {t === 'all' ? 'All' : t}
                </button>
              ))}
            </div>

            {/* Client filter — hidden on mobile */}
            <select
              value={filterClient}
              onChange={e => setFilterClient(e.target.value)}
              className="hidden md:block px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4F6AE8]"
            >
              <option value="">All Clients</option>
              {CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            {/* View mode toggle */}
            <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1 flex-shrink-0">
              <button onClick={() => setView('grid')} className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-[#E0E7FF] dark:bg-indigo-900/40 text-[#3B5BDB] dark:text-indigo-300' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`} title="Grid view">
                <LayoutGrid size={14} />
              </button>
              <button onClick={() => setView('list')} className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-[#E0E7FF] dark:bg-indigo-900/40 text-[#3B5BDB] dark:text-indigo-300' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`} title="List view">
                <List size={14} />
              </button>
            </div>

            {/* New Document button — desktop only (mobile uses FAB) */}
            <button
              onClick={() => setShowModal(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[#4F6AE8] text-white rounded-lg hover:bg-[#3B5BDB] transition-colors"
            >
              <Plus size={14} /> New Document
            </button>
          </div>

          {/* Active folder label */}
          {activeFolderId && activeFolderId !== '__unfiled__' && (
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
              <Folder size={14} style={{ color: DOCUMENT_FOLDERS.find(f => f.id === activeFolderId)?.color }} />
              <span className="font-medium">{DOCUMENT_FOLDERS.find(f => f.id === activeFolderId)?.name}</span>
              <span className="text-gray-400">({filtered.length})</span>
            </div>
          )}
          {activeFolderId === '__unfiled__' && (
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
              <FileText size={14} className="text-gray-400" />
              <span className="font-medium">Unfiled documents</span>
              <span className="text-gray-400">({filtered.length})</span>
            </div>
          )}

          {/* Empty state */}
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <FileText size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No documents found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                {search || filterType !== 'all' || filterClient || activeFolderId ? 'Try adjusting your filters' : 'Create your first document to get started'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            // ── Grid View ──────────────────────────────────────────────────────
            // Mobile: single column. md: 2 columns. xl: 3 columns.
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(doc => {
                const client = CLIENTS.find(c => c.id === doc.clientId);
                const docType = doc.type || 'client';
                const folder = DOCUMENT_FOLDERS.find(f => f.id === doc.folderId);
                return (
                  <div key={doc.id} className="relative group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg hover:border-[#C7D2FE] dark:hover:border-indigo-700 transition-all">
                    <Link href={`/documents/${doc.id}`} className="block">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 bg-[#E0E7FF] dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                          <FileText size={18} className="text-[#4F6AE8] dark:text-indigo-400" />
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${docType === 'internal' ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'}`}>
                          {docType === 'internal' ? <span className="flex items-center gap-1"><Lock size={9} /> Internal</span> : <span className="flex items-center gap-1"><Globe size={9} /> Client</span>}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1.5 group-hover:text-[#4F6AE8] dark:group-hover:text-indigo-400 transition-colors line-clamp-2">{doc.title}</h3>
                      {client ? (
                        <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-3" style={{ backgroundColor: client.color + '18', color: client.color }}>{client.name}</span>
                      ) : (
                        <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-3 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">{docType === 'internal' ? 'Internal' : 'All Clients'}</span>
                      )}
                      {folder && (
                        <div className="flex items-center gap-1 mb-2">
                          <Folder size={10} style={{ color: folder.color }} />
                          <span className="text-[10px] text-gray-400">{folder.name}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex -space-x-1.5">
                          {doc.collaborators.slice(0, 4).map(id => <Avatar key={id} id={id} size={22} />)}
                          {doc.collaborators.length > 4 && (
                            <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-[10px] text-gray-500 border-2 border-white dark:border-gray-800">+{doc.collaborators.length - 4}</div>
                          )}
                        </div>
                        <span className="flex items-center gap-1 text-xs text-gray-400"><Clock size={10} />{format(parseISO(doc.updatedAt), 'MMM d')}</span>
                      </div>
                    </Link>
                    {/* Move to folder option */}
                    <button
                      onClick={() => setMovingDoc({ id: doc.id, title: doc.title })}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                      title="Move to folder"
                    >
                      <FolderInput size={12} className="text-gray-400" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            // ── List View ──────────────────────────────────────────────────────
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Desktop table header */}
              <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                <span>Title</span>
                <span>Type</span>
                <span>Client</span>
                <span>Collaborators</span>
                <span>Updated</span>
                <span></span>
              </div>
              {/* Mobile table header */}
              <div className="md:hidden grid grid-cols-[1fr_auto] gap-4 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                <span>Title</span>
                <span>Type</span>
              </div>
              {filtered.map((doc, idx) => {
                const client = CLIENTS.find(c => c.id === doc.clientId);
                const docType = doc.type || 'client';
                const folder = DOCUMENT_FOLDERS.find(f => f.id === doc.folderId);
                const borderClass = idx < filtered.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : '';
                return (
                  <div key={doc.id} className={borderClass}>
                    {/* Mobile row — Title + Type only */}
                    <div className={`md:hidden flex items-center gap-3 px-4 py-3 hover:bg-[#EEF2FF]/50 dark:hover:bg-indigo-900/10 transition-colors`}>
                      <Link href={`/documents/${doc.id}`} className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="w-8 h-8 bg-[#EEF2FF] dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText size={14} className="text-[#4F6AE8]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{doc.title}</p>
                          {folder && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Folder size={9} style={{ color: folder.color }} />
                              <span className="text-[10px] text-gray-400">{folder.name}</span>
                            </div>
                          )}
                          {client && (
                            <span className="text-[10px] font-medium" style={{ color: client.color }}>{client.name}</span>
                          )}
                        </div>
                      </Link>
                      <Link href={`/documents/${doc.id}`} className="flex-shrink-0">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${docType === 'internal' ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'}`}>
                          {docType === 'internal' ? <Lock size={9} /> : <Globe size={9} />}
                          <span className="hidden xs:inline">{docType === 'internal' ? 'Internal' : 'Client'}</span>
                        </span>
                      </Link>
                    </div>

                    {/* Desktop row — all columns */}
                    <div className={`hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 items-center px-4 py-3 hover:bg-[#EEF2FF]/50 dark:hover:bg-indigo-900/10 transition-colors group`}>
                      <Link href={`/documents/${doc.id}`} className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 bg-[#EEF2FF] dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText size={13} className="text-[#4F6AE8]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-[#4F6AE8] dark:group-hover:text-indigo-400 transition-colors">{doc.title}</p>
                          {folder && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Folder size={9} style={{ color: folder.color }} />
                              <span className="text-[10px] text-gray-400">{folder.name}</span>
                            </div>
                          )}
                        </div>
                      </Link>
                      <Link href={`/documents/${doc.id}`}>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${docType === 'internal' ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'}`}>
                          {docType === 'internal' ? <><Lock size={9} /> Internal</> : <><Globe size={9} /> Client</>}
                        </span>
                      </Link>
                      <Link href={`/documents/${doc.id}`}>
                        {client ? (
                          <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full truncate max-w-[100px]" style={{ backgroundColor: client.color + '18', color: client.color }}>{client.name}</span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </Link>
                      <Link href={`/documents/${doc.id}`} className="flex items-center gap-1">
                        <div className="flex -space-x-1.5">
                          {doc.collaborators.slice(0, 4).map(id => <Avatar key={id} id={id} size={20} />)}
                          {doc.collaborators.length > 4 && (
                            <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-[9px] text-gray-500 border-2 border-white dark:border-gray-800 font-medium">+{doc.collaborators.length - 4}</div>
                          )}
                        </div>
                        {doc.collaborators.length === 0 && <Users size={12} className="text-gray-300" />}
                      </Link>
                      <Link href={`/documents/${doc.id}`}>
                        <span className="flex items-center gap-1 text-xs text-gray-400"><Clock size={10} />{format(parseISO(doc.updatedAt), 'MMM d')}</span>
                      </Link>
                      <button
                        onClick={() => setMovingDoc({ id: doc.id, title: doc.title })}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                        title="Move to folder"
                      >
                        <FolderInput size={13} className="text-gray-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mobile FAB — New Document */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 z-20 md:hidden flex items-center justify-center w-14 h-14 bg-[#4F6AE8] text-white rounded-full shadow-lg hover:bg-[#3B5BDB] active:scale-95 transition-all"
        title="New Document"
      >
        <Plus size={22} />
      </button>

      {showModal && <NewDocumentModal onClose={() => setShowModal(false)} defaultFolderId={activeFolderId && activeFolderId !== '__unfiled__' ? activeFolderId : undefined} />}
      {showFolderModal && <NewFolderModal onClose={() => setShowFolderModal(false)} />}
      {movingDoc && <MoveToFolderModal docId={movingDoc.id} docTitle={movingDoc.title} onClose={() => setMovingDoc(null)} />}
    </div>
  );
}
