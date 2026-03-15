'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getClientPillars, createClientPillar, updateClientPillar, deleteClientPillar } from '@/lib/actions';
import type { ClientPillar } from '@/lib/data';

const COLOR_PRESETS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#10b981'];

interface PageProps {
  params: { clientId: string };
}

export default function ClientPillarsPage({ params }: PageProps) {
  const { clientId } = params;
  const [pillars, setPillars] = useState<ClientPillar[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    color: COLOR_PRESETS[0],
    description: '',
  });

  useEffect(() => {
    fetchPillars();
  }, [clientId]);

  const fetchPillars = async () => {
    try {
      setLoading(true);
      const data = await getClientPillars(clientId);
      setPillars(data);
    } catch (err) {
      toast.error('Failed to fetch pillars');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: '', color: COLOR_PRESETS[0], description: '' });
    setEditingId(null);
  };

  const handleOpenModal = (pillar?: ClientPillar) => {
    if (pillar) {
      setForm({ name: pillar.name, color: pillar.color, description: pillar.description });
      setEditingId(pillar.id);
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Pillar name is required');
      return;
    }

    try {
      if (editingId) {
        await updateClientPillar(editingId, form);
        toast.success('Pillar updated');
      } else {
        await createClientPillar(clientId, form);
        toast.success('Pillar created');
      }
      setShowModal(false);
      resetForm();
      await fetchPillars();
    } catch (err) {
      toast.error('Failed to save pillar');
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this pillar? This action cannot be undone.')) return;

    try {
      await deleteClientPillar(id);
      toast.success('Pillar deleted');
      await fetchPillars();
    } catch (err) {
      toast.error('Failed to delete pillar');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading pillars...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Client Pillars</h1>
            <p className="text-gray-600 mt-1">Manage the pillars for this client</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            + Add Pillar
          </button>
        </div>

        {/* Pillars Grid */}
        {pillars.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No pillars yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pillars.map((pillar) => (
              <div
                key={pillar.id}
                className="bg-white rounded-xl shadow-sm border border-[var(--color-border)] hover:shadow-md transition-shadow"
                style={{ borderLeftWidth: '4px', borderLeftColor: pillar.color }}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{pillar.name}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal(pillar)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(pillar.id)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {pillar.description && (
                    <p className="text-gray-600 text-sm mb-3">{pillar.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: pillar.color }}
                    />
                    <span>{pillar.color}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="border-b border-[var(--color-border)] px-6 py-4">
              <h2 className="text-xl font-semibold">
                {editingId ? 'Edit Pillar' : 'Create New Pillar'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Brand Building"
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setForm({ ...form, color })}
                      className={`w-full aspect-square rounded-lg transition-all ${
                        form.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  placeholder="#6366f1"
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional pillar description"
                  rows={3}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-[var(--color-border)] px-6 py-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
