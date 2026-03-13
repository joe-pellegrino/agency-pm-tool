'use client';

import { useState, useTransition } from 'react';
import { X, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { Asset } from '@/lib/data';
import { useAppData } from '@/lib/contexts/AppDataContext';
import { createAsset, updateAsset } from '@/lib/actions';

const FILE_TYPES = ['image', 'video', 'pdf', 'doc', 'spreadsheet', 'design', 'other'];
const CURRENT_USER_ID = 'joe';

interface AssetModalProps {
  asset?: Asset;
  onClose: () => void;
}

export default function AssetModal({ asset, onClose }: AssetModalProps) {
  const { CLIENTS = [], TEAM_MEMBERS = [], refresh } = useAppData();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    clientId: asset?.clientId || (CLIENTS[0]?.id || ''),
    filename: asset?.filename || '',
    fileType: asset?.fileType || 'image',
    size: asset?.size || '',
    tags: asset?.tags || [] as string[],
    newTag: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.filename.trim()) e.filename = 'Filename is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const addTag = () => {
    const t = form.newTag.trim();
    if (t && !form.tags.includes(t)) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, t], newTag: '' }));
    }
  };

  const removeTag = (t: string) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(x => x !== t) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    startTransition(async () => {
      try {
        if (asset) {
          await updateAsset(asset.id, {
            filename: form.filename,
            fileType: form.fileType,
            size: form.size,
            tags: form.tags,
          });
          toast.success('Asset updated');
        } else {
          await createAsset({
            clientId: form.clientId,
            filename: form.filename,
            fileType: form.fileType,
            uploadedBy: CURRENT_USER_ID,
            size: form.size,
            tags: form.tags,
          });
          toast.success('Asset added');
        }
        refresh();
        onClose();
      } catch (err) {
        toast.error('Failed: ' + (err as Error).message);
      }
    });
  };

  const inputClass = 'w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const labelClass = 'block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <h2 className="font-semibold text-gray-900 dark:text-white text-lg">
            {asset ? 'Edit Asset' : 'Add Asset'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="px-6 py-5 space-y-4">
            {!asset && (
              <div>
                <label className={labelClass}>Client</label>
                <select value={form.clientId} onChange={e => set('clientId', e.target.value)} className={inputClass}>
                  {CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className={labelClass}>Filename *</label>
              <input
                type="text"
                value={form.filename}
                onChange={e => set('filename', e.target.value)}
                placeholder="e.g. hero-banner-v2.jpg"
                className={`${inputClass} ${errors.filename ? 'border-red-400' : ''}`}
                autoFocus
              />
              {errors.filename && <p className="text-xs text-red-500 mt-1">{errors.filename}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>File Type</label>
                <select value={form.fileType} onChange={e => set('fileType', e.target.value)} className={inputClass}>
                  {FILE_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Size</label>
                <input type="text" value={form.size} onChange={e => set('size', e.target.value)} placeholder="e.g. 2.4 MB" className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Tags</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.newTag}
                  onChange={e => set('newTag', e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  placeholder="Add tag..."
                  className={inputClass}
                />
                <button type="button" onClick={addTag} className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex-shrink-0">
                  <Plus size={14} />
                </button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.tags.map(tag => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full"
                    >
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-indigo-900 ml-0.5">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 flex-shrink-0">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {asset ? 'Save Changes' : 'Add Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
