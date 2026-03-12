'use client';

import { useState } from 'react';
import { ASSETS, CLIENTS, TEAM_MEMBERS, Asset } from '@/lib/data';
import { FolderOpen, Upload, Search, X, Download, Image, FileText, Video, Bookmark, History, ChevronDown } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';

const FILE_TYPE_ICONS: Record<Asset['fileType'], React.ReactNode> = {
  image: <Image size={20} />,
  document: <FileText size={20} />,
  video: <Video size={20} />,
  logo: <Bookmark size={20} />,
};

const FILE_TYPE_COLORS: Record<Asset['fileType'], string> = {
  image: 'text-blue-500 bg-blue-50',
  document: 'text-orange-500 bg-orange-50',
  video: 'text-purple-500 bg-purple-50',
  logo: 'text-green-500 bg-green-50',
};

const FILE_TYPE_LABELS: Record<Asset['fileType'], string> = {
  image: 'Images',
  document: 'Documents',
  video: 'Videos',
  logo: 'Logos',
};

function AssetDetailModal({ asset, onClose }: { asset: Asset; onClose: () => void }) {
  const uploader = TEAM_MEMBERS.find(m => m.id === asset.uploadedBy);
  const client = CLIENTS.find(c => c.id === asset.clientId);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Preview area */}
        <div
          className="h-40 sm:h-56 flex items-center justify-center relative flex-shrink-0"
          style={{ backgroundColor: asset.color + '30' }}
        >
          <div className="text-center">
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 ${FILE_TYPE_COLORS[asset.fileType]}`}
            >
              {FILE_TYPE_ICONS[asset.fileType]}
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{asset.filename}</p>
            <p className="text-xs text-gray-400 mt-1">{asset.size}</p>
          </div>
          <button onClick={onClose} className="absolute top-3 right-3 p-2 bg-white/80 dark:bg-gray-800/80 rounded-full text-gray-500 hover:text-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        <div className="px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1">
          <div className="flex items-start justify-between mb-4 sm:mb-5">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">{asset.filename}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: client?.color + '20', color: client?.color }}
                >
                  {client?.name}
                </span>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${FILE_TYPE_COLORS[asset.fileType]}`}>
                  {FILE_TYPE_LABELS[asset.fileType]}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Metadata */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Metadata</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Uploaded by</dt>
                  <dd className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold" style={{ backgroundColor: uploader?.color }}>
                      {uploader?.initials}
                    </div>
                    {uploader?.name.split(' ')[0]}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Upload date</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {new Date(asset.uploadDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">File size</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">{asset.size}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Versions</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">{asset.versions.length}</dd>
                </div>
              </dl>

              <div className="mt-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tags</h4>
                <div className="flex flex-wrap gap-1.5">
                  {asset.tags.map(tag => (
                    <span key={tag} className="text-[11px] px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Version history */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <History size={11} />
                Version History
              </h3>
              <div className="space-y-2">
                {asset.versions.map((v, i) => (
                  <div key={v.id} className={`p-3 rounded-lg border text-sm ${i === 0 ? 'border-indigo-200 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-800' : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${i === 0 ? 'text-indigo-600' : 'text-gray-400'}`}>
                        v{asset.versions.length - i} {i === 0 && '(current)'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(v.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{v.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-gray-100 dark:border-gray-700">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors min-h-[44px]">
              <Download size={14} />
              Download
            </button>
            <button onClick={onClose} className="px-4 py-2.5 text-gray-600 hover:text-gray-800 text-sm border border-gray-200 rounded-lg transition-colors min-h-[44px]">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssetCard({ asset, onClick }: { asset: Asset; onClick: () => void }) {
  const client = CLIENTS.find(c => c.id === asset.clientId);
  const uploader = TEAM_MEMBERS.find(m => m.id === asset.uploadedBy);

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all cursor-pointer group"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div
        className="h-28 sm:h-36 flex items-center justify-center relative"
        style={{ backgroundColor: asset.color + '25' }}
      >
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center ${FILE_TYPE_COLORS[asset.fileType]} group-hover:scale-110 transition-transform`}>
          {FILE_TYPE_ICONS[asset.fileType]}
        </div>
        {asset.versions.length > 1 && (
          <div className="absolute top-2 right-2 text-[10px] font-medium bg-white/80 dark:bg-gray-800/80 px-1.5 py-0.5 rounded text-gray-500">
            v{asset.versions.length}
          </div>
        )}
        <div
          className="absolute bottom-2 left-2 text-[10px] font-semibold px-1.5 py-0.5 rounded"
          style={{ backgroundColor: client?.color + '20', color: client?.color }}
        >
          {client?.logo}
        </div>
      </div>

      {/* Info */}
      <div className="p-2 sm:p-3">
        <p className="text-xs font-medium text-gray-900 dark:text-white truncate mb-1" title={asset.filename}>
          {asset.filename}
        </p>
        <div className="flex items-center justify-between text-[11px] text-gray-400">
          <span>{new Date(asset.uploadDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          <div
            className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
            style={{ backgroundColor: uploader?.color }}
            title={uploader?.name}
          >
            {uploader?.initials}
          </div>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {asset.tags.slice(0, 1).map(tag => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded">
              {tag}
            </span>
          ))}
          {asset.tags.length > 1 && (
            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-400 rounded">+{asset.tags.length - 1}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AssetsPage() {
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedType, setSelectedType] = useState<Asset['fileType'] | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = ASSETS.filter(a => {
    if (selectedClient !== 'all' && a.clientId !== selectedClient) return false;
    if (selectedType !== 'all' && a.fileType !== selectedType) return false;
    if (search && !a.filename.toLowerCase().includes(search.toLowerCase()) && !a.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const typeCount = (type: Asset['fileType']) => ASSETS.filter(a =>
    (selectedClient === 'all' || a.clientId === selectedClient) && a.fileType === type
  ).length;

  return (
    <div className="pt-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopBar title="Asset Library" subtitle="Brand assets, creatives, and media files" />

      <div className="p-4 sm:p-6 lg:p-8">
        {selectedAsset && (
          <AssetDetailModal asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
        )}

        {/* Stats — 2 cols on mobile, 4 on lg */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {(['image', 'document', 'video', 'logo'] as const).map(type => (
            <div
              key={type}
              onClick={() => setSelectedType(selectedType === type ? 'all' : type)}
              className={`bg-white dark:bg-gray-800 rounded-xl border p-3 sm:p-4 cursor-pointer transition-all ${
                selectedType === type
                  ? 'border-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${FILE_TYPE_COLORS[type]}`}>
                  {FILE_TYPE_ICONS[type]}
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{typeCount(type)}</div>
                  <div className="text-xs text-gray-500">{FILE_TYPE_LABELS[type]}</div>
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
              placeholder="Search files or tags..."
              className="pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
            />
          </div>

          {/* Mobile: filter toggle */}
          <div className="flex gap-2">
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

            <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors min-h-[44px]">
              <Upload size={14} />
              <span className="hidden sm:inline">Upload Asset</span>
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

        {/* Results count */}
        <div className="text-xs text-gray-400 mb-3 sm:mb-4">
          {filtered.length} asset{filtered.length !== 1 ? 's' : ''}
          {selectedType !== 'all' && ` · ${FILE_TYPE_LABELS[selectedType]}`}
          {selectedClient !== 'all' && ` · ${CLIENTS.find(c => c.id === selectedClient)?.name}`}
        </div>

        {/* Grid — 2 cols on mobile, 3 on sm, 4 on md, 5 on xl */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {filtered.map(asset => (
              <AssetCard key={asset.id} asset={asset} onClick={() => setSelectedAsset(asset)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 sm:py-20 text-gray-400">
            <FolderOpen size={40} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">No assets found</p>
            <p className="text-sm mt-1">Try adjusting your filters or upload new assets</p>
          </div>
        )}
      </div>
    </div>
  );
}
