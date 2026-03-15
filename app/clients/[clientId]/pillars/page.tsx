'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';
import { getClientPillars, createClientPillar, updateClientPillar, deleteClientPillar, createClientPillarKpi, updateClientPillarKpi, deleteClientPillarKpi } from '@/lib/actions';
import { useAppData } from '@/lib/contexts/AppDataContext';
import type { ClientPillar, ClientPillarKpi } from '@/lib/data';
import { X, Plus, Pencil, Trash2, Target, ChevronRight } from 'lucide-react';

const COLOR_PRESETS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#10b981'];

interface KpiForm {
  id?: string;
  name: string;
  target: number;
  current: number;
  unit: string;
}

export default function ClientPillarsPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const router = useRouter();
  const { CLIENTS = [] } = useAppData();
  const [pillars, setPillars] = useState<ClientPillar[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [kpis, setKpis] = useState<KpiForm[]>([]);

  const [form, setForm] = useState({
    name: '',
    color: COLOR_PRESETS[0],
    description: '',
  });

  const clientName = useMemo(() => {
    return CLIENTS.find(c => c.id === clientId)?.name || 'Client';
  }, [CLIENTS, clientId]);

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
    setKpis([]);
    setEditingId(null);
  };

  const handleOpenModal = (pillar?: ClientPillar) => {
    if (pillar) {
      setForm({ name: pillar.name, color: pillar.color, description: pillar.description });
      setEditingId(pillar.id);
      // Load existing KPIs for this pillar if needed
      setKpis([]);
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
      let pillarId = editingId;
      
      if (editingId) {
        await updateClientPillar(editingId, form);
      } else {
        pillarId = await createClientPillar(clientId, form);
      }

      // Handle KPI changes
      for (const kpi of kpis) {
        if (kpi.id) {
          await updateClientPillarKpi(kpi.id, {
            name: kpi.name,
            target: kpi.target,
            current: kpi.current,
            unit: kpi.unit,
          });
        } else if (pillarId) {
          await createClientPillarKpi(pillarId, {
            name: kpi.name,
            target: kpi.target,
            current: kpi.current,
            unit: kpi.unit,
          });
        }
      }

      toast.success(editingId ? 'Pillar updated' : 'Pillar created');
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

  const addKpi = () => {
    setKpis([...kpis, { name: '', target: 0, current: 0, unit: '' }]);
  };

  const removeKpi = async (index: number) => {
    const kpi = kpis[index];
    if (kpi.id) {
      try {
        await deleteClientPillarKpi(kpi.id);
      } catch (err) {
        toast.error('Failed to delete KPI');
        return;
      }
    }
    setKpis(kpis.filter((_, i) => i !== index));
  };

  const updateKpi = (index: number, updates: Partial<KpiForm>) => {
    const updated = [...kpis];
    updated[index] = { ...updated[index], ...updates };
    setKpis(updated);
  };

  if (loading) {
    return (
      <>
        <TopBar breadcrumb={['Clients', clientName, 'Pillars']} />
        <div className="flex items-center justify-center p-6 min-h-screen">
          <div className="text-gray-500">Loading pillars...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar breadcrumb={['Clients', clientName, 'Pillars']} />
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pillars</h1>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Add Pillar
          </button>
        </div>

        {/* Pillars Grid */}
        {pillars.length === 0 ? (
          <div className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-12 text-center">
            <Target size={40} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 font-medium">No pillars yet</p>
            <p className="text-gray-400 text-sm mt-1">Create your first pillar to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pillars.map((pillar) => {
              const kpiCount = 0; // Would be populated from CLIENT_PILLAR_KPIS data
              return (
                <div
                  key={pillar.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                  style={{ borderLeftWidth: '4px', borderLeftColor: pillar.color }}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{pillar.name}</h3>
                        {pillar.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{pillar.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2 flex-shrink-0">
                        <button
                          onClick={() => handleOpenModal(pillar)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(pillar.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* KPI Badge */}
                    {kpiCount > 0 && (
                      <div className="mb-3">
                        <span className="inline-block text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          {kpiCount} KPI{Number(kpiCount) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}

                    {/* View Details Link */}
                    <button
                      onClick={() => router.push(`/clients/${clientId}/pillars/${pillar.id}`)}
                      className="flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors group"
                    >
                      View Details
                      <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onMouseDown={(e) => e.target === e.currentTarget && (() => { setShowModal(false); resetForm(); })()}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="border-b border-[var(--color-border)] px-6 py-4 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingId ? 'Edit Pillar' : 'Create New Pillar'}
              </h2>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Brand Building"
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional pillar description"
                  rows={3}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* KPIs Section */}
              <div className="border-t border-[var(--color-border)] pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    KPIs (optional)
                  </label>
                  <button
                    onClick={addKpi}
                    className="flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded-lg transition-colors"
                  >
                    <Plus size={12} />
                    Add KPI
                  </button>
                </div>

                <div className="space-y-3">
                  {kpis.map((kpi, idx) => (
                    <div key={idx} className="flex gap-2 items-end">
                      <input
                        type="text"
                        placeholder="Name"
                        value={kpi.name}
                        onChange={(e) => updateKpi(idx, { name: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 text-xs border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:bg-gray-700 dark:text-white"
                      />
                      <input
                        type="number"
                        placeholder="Target"
                        value={kpi.target}
                        onChange={(e) => updateKpi(idx, { target: parseFloat(e.target.value) || 0 })}
                        className="w-16 px-2.5 py-1.5 text-xs border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:bg-gray-700 dark:text-white"
                      />
                      <input
                        type="number"
                        placeholder="Current"
                        value={kpi.current}
                        onChange={(e) => updateKpi(idx, { current: parseFloat(e.target.value) || 0 })}
                        className="w-20 px-2.5 py-1.5 text-xs border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:bg-gray-700 dark:text-white"
                      />
                      <input
                        type="text"
                        placeholder="Unit"
                        value={kpi.unit}
                        onChange={(e) => updateKpi(idx, { unit: e.target.value })}
                        className="w-16 px-2.5 py-1.5 text-xs border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:bg-gray-700 dark:text-white"
                      />
                      <button
                        onClick={() => removeKpi(idx)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-[var(--color-border)] px-6 py-4 flex justify-end gap-2 bg-gray-50 dark:bg-gray-700/50 sticky bottom-0">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
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
    </>
  );
}
