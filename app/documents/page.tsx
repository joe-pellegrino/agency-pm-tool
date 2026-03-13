'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
import { useAppData } from '@/lib/contexts/AppDataContext';
import { createDocument } from '@/lib/actions';
import { toast } from 'sonner';
import {
  FileText, Plus, Search, Filter, Users, Clock, X, Loader2,
  Building2, Lock, Globe, ChevronRight,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

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

function NewDocumentModal({ onClose }: { onClose: () => void }) {
  const { CLIENTS = [], TEAM_MEMBERS = [] } = useAppData();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'client' | 'internal'>('client');
  const [clientId, setClientId] = useState('');
  const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleCollaborator = (id: string) => {
    setCollaboratorIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (type === 'client' && !clientId) {
      toast.error('Select a client for client documents');
      return;
    }
    setLoading(true);
    try {
      const id = await createDocument({
        title: title.trim(),
        type,
        clientId: type === 'client' ? clientId : undefined,
        collaboratorIds,
      });
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
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Document title..."
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setType('client')}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  type === 'client'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Building2 size={14} /> Client Document
              </button>
              <button
                onClick={() => setType('internal')}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  type === 'internal'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Lock size={14} /> Internal
              </button>
            </div>
          </div>

          {/* Client selector */}
          {type === 'client' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Client</label>
              <select
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a client...</option>
                {CLIENTS.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Collaborators */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Collaborators</label>
            <div className="flex flex-wrap gap-2">
              {TEAM_MEMBERS.map(m => (
                <button
                  key={m.id}
                  onClick={() => toggleCollaborator(m.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    collaboratorIds.includes(m.id)
                      ? 'ring-2 ring-offset-1 ring-indigo-500'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: m.color + '20', color: m.color }}
                >
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ backgroundColor: m.color }}>
                    {m.initials}
                  </span>
                  {m.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {loading ? 'Creating...' : 'Create Document'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const { DOCUMENTS = [], CLIENTS = [], TEAM_MEMBERS = [] } = useAppData();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'client' | 'internal'>('all');
  const [filterClient, setFilterClient] = useState('');
  const [showModal, setShowModal] = useState(false);

  const filtered = useMemo(() => {
    return DOCUMENTS.filter(doc => {
      if (search && !doc.title.toLowerCase().includes(search.toLowerCase())) return false;
      const docType = doc.type || 'client';
      if (filterType !== 'all' && docType !== filterType) return false;
      if (filterClient && doc.clientId !== filterClient) return false;
      return true;
    });
  }, [DOCUMENTS, search, filterType, filterClient]);

  return (
    <div className="pt-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopBar title="Documents" subtitle="Real-time collaborative document editor" />
      <div className="p-4 sm:p-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search documents..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
            {(['all', 'client', 'internal'] as const).map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                  filterType === t
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {t === 'all' ? 'All Types' : t}
              </button>
            ))}
          </div>

          {/* Client filter */}
          <select
            value={filterClient}
            onChange={e => setFilterClient(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Clients</option>
            {CLIENTS.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={14} />
            New Document
          </button>
        </div>

        {/* Documents grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No documents found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {search || filterType !== 'all' || filterClient ? 'Try adjusting your filters' : 'Create your first document to get started'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(doc => {
              const client = CLIENTS.find(c => c.id === doc.clientId);
              const docType = doc.type || 'client';
              return (
                <Link
                  key={doc.id}
                  href={`/documents/${doc.id}`}
                  className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-700 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                      <FileText size={18} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      docType === 'internal'
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    }`}>
                      {docType === 'internal' ? (
                        <span className="flex items-center gap-1"><Lock size={9} /> Internal</span>
                      ) : (
                        <span className="flex items-center gap-1"><Globe size={9} /> Client</span>
                      )}
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                    {doc.title}
                  </h3>

                  {client ? (
                    <span
                      className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-3"
                      style={{ backgroundColor: client.color + '18', color: client.color }}
                    >
                      {client.name}
                    </span>
                  ) : docType === 'internal' ? (
                    <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-3 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                      Internal
                    </span>
                  ) : (
                    <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-3 bg-indigo-50 text-indigo-600">
                      All Clients
                    </span>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex -space-x-1.5">
                      {doc.collaborators.slice(0, 4).map(id => (
                        <Avatar key={id} id={id} size={22} />
                      ))}
                      {doc.collaborators.length > 4 && (
                        <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-[10px] text-gray-500 border-2 border-white dark:border-gray-800">
                          +{doc.collaborators.length - 4}
                        </div>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock size={10} />
                      {format(parseISO(doc.updatedAt), 'MMM d')}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {showModal && <NewDocumentModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
