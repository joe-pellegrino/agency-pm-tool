'use client';

import { useState, useTransition } from 'react';
import { Layers, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import type { FocusArea } from '@/lib/data';
import { createFocusArea, updateFocusArea, deleteFocusArea } from '@/lib/actions-goals';
import { useAppData } from '@/lib/contexts/AppDataContext';

interface FocusAreasSectionProps {
  pillarId: string;
  clientId: string;
  focusAreas: FocusArea[];
  onRefresh: () => void;
}

export default function FocusAreasSection({ pillarId, clientId, focusAreas, onRefresh }: FocusAreasSectionProps) {
  const { optimisticUpdate } = useAppData();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({ name: '', description: '' });
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [, startTransition] = useTransition();

  const activeFocusAreas = focusAreas.filter(fa => fa.status === 'active');

  async function handleAdd() {
    if (!addForm.name.trim()) { toast.error('Name is required'); return; }
    startTransition(async () => {
      try {
        const newArea = await createFocusArea({
          pillarId,
          clientId,
          name: addForm.name.trim(),
          description: addForm.description.trim() || null,
        });
        setAddForm({ name: '', description: '' });
        setIsAdding(false);
        toast.success('Focus area added');
        // Optimistically add the new focus area
        optimisticUpdate(prev => ({
          ...prev,
          FOCUS_AREAS: [...(prev.FOCUS_AREAS ?? []), newArea],
        }));
      } catch {
        toast.error('Failed to add focus area');
        onRefresh();
      }
    });
  }

  async function handleEdit(id: string) {
    if (!editForm.name.trim()) { toast.error('Name is required'); return; }
    const updates = {
      name: editForm.name.trim(),
      description: editForm.description.trim() || null,
    };
    // Optimistically update
    optimisticUpdate(prev => ({
      ...prev,
      FOCUS_AREAS: (prev.FOCUS_AREAS ?? []).map(fa =>
        fa.id === id ? { ...fa, ...updates } : fa
      ),
    }));
    setEditingId(null);
    toast.success('Focus area updated');
    startTransition(async () => {
      try {
        await updateFocusArea(id, updates);
      } catch {
        toast.error('Failed to update focus area');
        onRefresh();
      }
    });
  }

  async function handleArchive(id: string) {
    // Optimistically archive (remove from active list)
    optimisticUpdate(prev => ({
      ...prev,
      FOCUS_AREAS: (prev.FOCUS_AREAS ?? []).map(fa =>
        fa.id === id ? { ...fa, status: 'archived' as const } : fa
      ),
    }));
    toast.success('Focus area archived');
    startTransition(async () => {
      try {
        await updateFocusArea(id, { status: 'archived' });
      } catch {
        toast.error('Failed to archive focus area');
        onRefresh();
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this focus area?')) return;
    // Optimistically remove
    optimisticUpdate(prev => ({
      ...prev,
      FOCUS_AREAS: (prev.FOCUS_AREAS ?? []).filter(fa => fa.id !== id),
    }));
    toast.success('Focus area deleted');
    startTransition(async () => {
      try {
        await deleteFocusArea(id, clientId);
      } catch {
        toast.error('Failed to delete focus area');
        onRefresh();
      }
    });
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
          <Layers size={11} /> Focus Areas
        </span>
        <button
          onClick={() => setIsAdding(true)}
          className="text-[10px] text-blue-500 hover:text-blue-600 font-medium flex items-center gap-0.5"
        >
          <Plus size={11} /> Add
        </button>
      </div>

      {activeFocusAreas.length === 0 && !isAdding && (
        <p className="text-xs text-gray-400 italic">No focus areas defined</p>
      )}

      <div className="space-y-1.5">
        {activeFocusAreas.map(fa => (
          <div key={fa.id}>
            {editingId === fa.id ? (
              <div className="space-y-1.5 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <input
                  className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded"
                  style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Focus area name"
                  autoFocus
                />
                <input
                  className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded"
                  style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Description (optional)"
                />
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(fa.id)}
                    className="flex items-center gap-0.5 px-2 py-1 text-[10px] font-medium text-white rounded"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    <Save size={10} /> Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex items-center gap-0.5 px-2 py-1 text-[10px] text-gray-500 border border-gray-200 dark:border-gray-600 rounded"
                  >
                    <X size={10} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 group py-1">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{fa.name}</p>
                  {fa.description && (
                    <p className="text-[10px] text-gray-500 mt-0.5">{fa.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditingId(fa.id); setEditForm({ name: fa.name, description: fa.description ?? '' }); }}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  >
                    <Edit2 size={10} />
                  </button>
                  <button
                    onClick={() => handleArchive(fa.id)}
                    className="p-1 text-gray-400 hover:text-amber-500 rounded"
                    title="Archive"
                  >
                    <X size={10} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {isAdding && (
          <div className="space-y-1.5 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <input
              className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded"
              style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
              value={addForm.name}
              onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Focus area name"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setIsAdding(false); }}
            />
            <input
              className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded"
              style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
              value={addForm.description}
              onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Description (optional)"
            />
            <div className="flex gap-1">
              <button
                onClick={handleAdd}
                className="flex items-center gap-0.5 px-2 py-1 text-[10px] font-medium text-white rounded"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <Save size={10} /> Add
              </button>
              <button
                onClick={() => { setIsAdding(false); setAddForm({ name: '', description: '' }); }}
                className="flex items-center gap-0.5 px-2 py-1 text-[10px] text-gray-500 border border-gray-200 dark:border-gray-600 rounded"
              >
                <X size={10} /> Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
