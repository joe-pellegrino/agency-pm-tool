'use client';

import { useState, useTransition, useRef, useCallback } from 'react';
import { useAppData } from '@/lib/contexts/AppDataContext';
import {
  FolderOpen, Upload, Search, X, Download, Image, FileText, Video, Bookmark,
  Music, File, Trash2, ChevronDown, Plus, Loader2,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { createAssetWithStorage, deleteAssetWithStorage } from '@/lib/actions';
import { createClient } from '@supabase/supabase-js';

// Browser-side Supabase client for file upload
const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Extended Asset type with storage fields
interface AssetRow {
  id: string;
  clientId: string;
  filename: string;
  fileType: string;
  uploadDate: string;
  size: string;
  storagePath?: string;
  storageUrl?: string;
  tags: string[];
}

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'];

function isImageFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return IMAGE_EXTENSIONS.includes(ext);
}

function getFileIcon(filename: string, fileType: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (IMAGE_EXTENSIONS.includes(ext)) return <Image size={20} />;
  if (['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext)) return <Video size={20} />;
  if (ext === 'pdf') return <FileText size={20} className="text-red-500" />;
  if (['doc', 'docx'].includes(ext)) return <FileText size={20} className="text-blue-500" />;
  if (['mp3', 'wav', 'ogg'].includes(ext)) return <Music size={20} />;
  if (fileType === 'logo') return <Bookmark size={20} />;
  return <File size={20} />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
  if (['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext)) return 'video';
  if (ext === 'pdf') return 'document';
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return 'document';
  if (['mp3', 'wav'].includes(ext)) return 'document';
  if (['svg', 'eps', 'ai'].includes(ext)) return 'logo';
  return 'document';
}

function AssetCard({
  asset,
  clientName,
  clientColor,
  onDelete,
}: {
  asset: AssetRow;
  clientName: string;
  clientColor: string;
  onDelete: (id: string, path: string) => void;
}) {
  const isImage = isImageFile(asset.filename) && asset.storageUrl;

  return (
    <div
      className="group"
      style={{
        backgroundColor: 'var(--color-white)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
        transition: 'box-shadow 0.15s ease',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card-hover)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card)'; }}
    >
      {/* Thumbnail */}
      <div
        style={{
          position: 'relative',
          aspectRatio: '4/3',
          backgroundColor: 'var(--color-bg-page)',
          overflow: 'hidden',
          borderRadius: '8px 8px 0 0',
        }}
      >
        {isImage ? (
          <img
            src={asset.storageUrl}
            alt={asset.filename}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px', color: 'var(--color-icon-muted)' }}>
            {getFileIcon(asset.filename, asset.fileType)}
            <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--color-text-muted)' }}>
              {asset.filename.split('.').pop()?.toUpperCase()}
            </span>
          </div>
        )}

        {/* Delete icon top-right */}
        <button
          onClick={() => onDelete(asset.id, asset.storagePath || '')}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            padding: '4px',
            backgroundColor: 'rgba(255,255,255,0.9)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            color: 'var(--color-icon-muted)',
            opacity: 0,
            transition: 'opacity 0.15s ease, color 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="group-hover:opacity-100"
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#E03131'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--color-icon-muted)'; }}
          title="Delete"
        >
          <Trash2 size={16} />
        </button>

        {/* Client badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '8px',
            fontSize: '10px',
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: clientColor + '20',
            color: clientColor,
          }}
        >
          {clientName.split(' ')[0]}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '12px', textAlign: 'center' }}>
        <p
          style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          title={asset.filename}
        >
          {asset.filename}
        </p>
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
          {asset.size} &middot; {asset.filename.split('.').pop()?.toUpperCase()}
        </p>
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
          {new Date(asset.uploadDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
        {asset.storageUrl && (
          <a
            href={asset.storageUrl}
            download={asset.filename}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              textDecoration: 'none',
              transition: 'background 0.15s ease',
              backgroundColor: 'var(--color-white)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-hover-bg)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-white)'; }}
          >
            <Download size={14} color="var(--color-text-secondary)" />
            Download
          </a>
        )}
      </div>
    </div>
  );
}

function UploadZone({
  clientId,
  onUploadComplete,
}: {
  clientId: string;
  onUploadComplete: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || !clientId) {
      if (!clientId) toast.error('Please select a client first');
      return;
    }

    setUploading(true);
    setProgress([]);

    for (const file of Array.from(files)) {
      const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${clientId}/${Date.now()}-${safeFilename}`;
      setProgress(p => [...p, `Uploading ${file.name}...`]);

      try {
        const { data, error } = await supabaseBrowser.storage.from('assets').upload(path, file, {
          upsert: false,
        });

        if (error) {
          toast.error(`Failed to upload ${file.name}: ${error.message}`);
          continue;
        }

        const { data: { publicUrl } } = supabaseBrowser.storage.from('assets').getPublicUrl(path);
        const fileType = getFileType(file.name);
        const size = formatFileSize(file.size);

        await createAssetWithStorage({
          clientId,
          filename: file.name,
          fileType,
          size,
          storagePath: path,
          storageUrl: publicUrl,
        });

        setProgress(p => p.map(x => x.includes(file.name) ? `[UPLOADED] ${file.name}` : x));
        toast.success(`${file.name} uploaded`);
      } catch (err) {
        toast.error(`Error: ${(err as Error).message}`);
      }
    }

    setUploading(false);
    onUploadComplete();
  }, [clientId, onUploadComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
        dragging
          ? 'border-indigo-400 bg-[#EEF2FF] dark:bg-indigo-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
      }`}
      onClick={() => !uploading && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.svg,.eps,.ai,.mp3,.wav"
      />

      {uploading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="text-[#3B5BDB] animate-spin" />
          <div className="space-y-1">
            {progress.map((p, i) => (
              <p key={i} className="text-xs text-gray-600 dark:text-gray-300">{p}</p>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload size={24} className="text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Drop files here or click to upload
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Images, PDFs, videos, documents — any file type
            </p>
          </div>
          {!clientId && (
            <p className="text-xs text-amber-600 mt-1 font-medium">Select a client first to enable upload</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function AssetsPage() {
  const { ASSETS = [], CLIENTS = [], refresh } = useAppData();
  const [selectedClient, setSelectedClient] = useState('all');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; path: string } | null>(null);
  const [, startTransition] = useTransition();

  // Cast assets to include storage fields
  const assetsWithStorage = ASSETS as unknown as AssetRow[];

  const filtered = assetsWithStorage.filter(a => {
    if (selectedClient !== 'all' && a.clientId !== selectedClient) return false;
    if (search && !a.filename.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleDelete = () => {
    if (!deleteTarget) return;
    const { id, path } = deleteTarget;
    setDeleteTarget(null);
    startTransition(async () => {
      try {
        await deleteAssetWithStorage(id, path);
        toast.success('Asset deleted');
        refresh?.();
      } catch (err) {
        toast.error('Delete failed: ' + (err as Error).message);
      }
    });
  };

  const uploadClientId = selectedClient !== 'all' ? selectedClient : CLIENTS[0]?.id || '';

  // Stats
  const imageCount = assetsWithStorage.filter(a => isImageFile(a.filename)).length;
  const docCount = assetsWithStorage.filter(a => !isImageFile(a.filename) && !['mp4','mov','avi','webm'].some(e => a.filename.endsWith('.' + e))).length;
  const videoCount = assetsWithStorage.filter(a => ['mp4','mov','avi','webm','mkv'].some(e => a.filename.endsWith('.' + e))).length;

  return (
    <div style={{ backgroundColor: 'var(--color-bg-page)', minHeight: '100vh' }}>
      <TopBar title="Asset Library" subtitle="Brand assets, creatives, and media files" />

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Asset"
          message="Delete this asset permanently? This cannot be undone."
          confirmLabel="Delete"
          destructive
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div style={{ padding: '24px 32px' }}>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          {[
            { label: 'Images', value: imageCount, icon: <Image size={18} />, color: 'text-blue-600 bg-blue-50' },
            { label: 'Documents', value: docCount, icon: <FileText size={18} />, color: 'text-orange-600 bg-orange-50' },
            { label: 'Videos', value: videoCount, icon: <Video size={18} />, color: 'text-purple-600 bg-purple-50' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${s.color}`}>
                  {s.icon}
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search files..."
              className="pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] w-full"
            />
          </div>

          <div className="flex gap-2 items-center">
            {/* Mobile: filter toggle */}
            <button
              onClick={() => setShowFilters(v => !v)}
              className="sm:hidden flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white rounded-lg text-sm text-gray-600 min-h-[44px]"
            >
              <ChevronDown size={14} className={showFilters ? 'rotate-180' : ''} />
              Filters
            </button>

            {/* Desktop client filters */}
            <div className="hidden sm:flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setSelectedClient('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedClient === 'all' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                All
              </button>
              {CLIENTS.map(client => (
                <button
                  key={client.id}
                  onClick={() => setSelectedClient(selectedClient === client.id ? 'all' : client.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedClient === client.id ? 'text-white' : 'bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                  style={selectedClient === client.id ? { backgroundColor: client.color } : { color: client.color }}
                >
                  {client.logo} {client.name.split(' ')[0]}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowUpload(v => !v)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#3B5BDB] hover:bg-[#3B5BDB] text-white rounded-lg text-sm font-medium transition-colors min-h-[44px]"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Upload Files</span>
              <span className="sm:hidden">Upload</span>
            </button>
          </div>
        </div>

        {/* Mobile filter drawer */}
        {showFilters && (
          <div className="sm:hidden mb-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Client</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedClient('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${selectedClient === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
              >All</button>
              {CLIENTS.map(client => (
                <button
                  key={client.id}
                  onClick={() => setSelectedClient(selectedClient === client.id ? 'all' : client.id)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: selectedClient === client.id ? client.color : client.color + '90' }}
                >
                  {client.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Upload zone */}
        {showUpload && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Upload Files</h3>
              <button onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
            {/* Client selector for upload */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-500 mb-1">Upload to client</label>
              <select
                value={uploadClientId}
                onChange={e => setSelectedClient(e.target.value)}
                className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] w-full sm:w-auto"
              >
                {CLIENTS.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <UploadZone
              clientId={uploadClientId}
              onUploadComplete={() => {
                refresh?.();
                setShowUpload(false);
              }}
            />
          </div>
        )}

        {/* Results count */}
        <div className="text-xs text-gray-400 mb-3 sm:mb-4">
          {filtered.length} asset{filtered.length !== 1 ? 's' : ''}
          {selectedClient !== 'all' && ` · ${CLIENTS.find(c => c.id === selectedClient)?.name}`}
        </div>

        {/* Asset grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map(asset => {
              const client = CLIENTS.find(c => c.id === asset.clientId);
              return (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  clientName={client?.name || 'Unknown'}
                  clientColor={client?.color || '#6366f1'}
                  onDelete={(id, path) => setDeleteTarget({ id, path })}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 sm:py-20 text-gray-400">
            <FolderOpen size={40} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">No assets yet</p>
            <p className="text-sm mt-1">Click &quot;Upload Files&quot; to add your first asset</p>
            <button
              onClick={() => setShowUpload(true)}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#3B5BDB] hover:bg-[#3B5BDB] text-white rounded-lg text-sm font-medium transition-colors mx-auto"
            >
              <Upload size={14} />
              Upload Files
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
