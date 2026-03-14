'use client';

import { useState, useMemo, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { Strategy, StrategyPillar, KPI, ServiceStrategy } from '@/lib/data';
import { useAppData } from '@/lib/contexts/AppDataContext';
import TopBar from '@/components/layout/TopBar';
import {
  TrendingUp, Target, CheckCircle, Clock, AlertTriangle, ChevronDown, ChevronUp,
  BarChart3, Layers, FolderOpen, Calendar, Zap, ArrowRight, Plus, Pencil, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  createStrategy, updateStrategy, archiveStrategy,
  createStrategyPillar, updateStrategyPillar, archiveStrategyPillar,
  createStrategyKPI, updateStrategyKPI, archiveStrategyKPI,
} from '@/lib/actions';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const STATUS_CONFIG = {
  planning: { label: 'Planning', color: 'bg-gray-100 text-gray-600', icon: Clock },
  active: { label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  complete: { label: 'Complete', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
} as const;

const PROJECT_STATUS_CONFIG = {
  planning: { label: 'Planning', color: 'bg-gray-100 text-gray-600' },
  active: { label: 'Active', color: 'bg-blue-100 text-blue-700' },
  complete: { label: 'Complete', color: 'bg-green-100 text-green-700' },
  'on-hold': { label: 'On Hold', color: 'bg-amber-100 text-amber-700' },
} as const;

const HEALTH_CONFIG = {
  'on-track': { label: 'On Track', color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' },
  'at-risk': { label: 'At Risk', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  'behind': { label: 'Behind', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
};

function getKpiHealth(kpi: KPI): 'on-track' | 'at-risk' | 'behind' {
  const lb = kpi.name.toLowerCase().includes('bounce') || kpi.name.toLowerCase().includes('churn');
  const pct = lb
    ? Math.max(0, Math.min(100, (kpi.target / kpi.current) * 100))
    : Math.max(0, Math.min(100, (kpi.current / kpi.target) * 100));
  if (pct >= 70) return 'on-track';
  if (pct >= 40) return 'at-risk';
  return 'behind';
}

function getPillarHealth(pillar: StrategyPillar): 'on-track' | 'at-risk' | 'behind' {
  if (pillar.kpis.length === 0) return 'on-track';
  const healths = pillar.kpis.map(getKpiHealth);
  if (healths.some(h => h === 'behind')) return 'behind';
  if (healths.some(h => h === 'at-risk')) return 'at-risk';
  return 'on-track';
}

function getServiceStrategyHealth(ss: ServiceStrategy): 'on-track' | 'at-risk' | 'behind' {
  const scores = ss.kpis.map(kpi => {
    const lb = kpi.name.toLowerCase().includes('bounce') || kpi.name.toLowerCase().includes('cpc') || kpi.name.toLowerCase().includes('pos');
    const pct = lb
      ? Math.min(100, (kpi.target / Math.max(kpi.current, 0.01)) * 100)
      : Math.min(100, (kpi.current / kpi.target) * 100);
    return pct;
  });
  const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  if (avg >= 70) return 'on-track';
  if (avg >= 40) return 'at-risk';
  return 'behind';
}

function KPIGauge({
  kpi,
  onEdit,
  onDelete,
}: {
  kpi: KPI;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const lb = kpi.name.toLowerCase().includes('bounce') || kpi.name.toLowerCase().includes('churn') || kpi.name.toLowerCase().includes('cpc') || kpi.name.toLowerCase().includes('pos');
  const pct = lb
    ? Math.max(0, Math.min(100, (kpi.target / Math.max(kpi.current, 0.01)) * 100))
    : Math.max(0, Math.min(100, (kpi.current / kpi.target) * 100));
  const isOnTrack = pct >= 70;
  const isAtRisk = pct >= 40 && pct < 70;
  const barColor = isOnTrack ? 'bg-green-500' : isAtRisk ? 'bg-amber-500' : 'bg-red-400';

  const fmt = (v: number, unit: string) => {
    if (unit === '$') return `$${v.toLocaleString()}`;
    if (unit === '%' || unit === 'x' || unit === '★') return `${v}${unit}`;
    if (v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
    return `${v}`;
  };

  return (
    <div className="group space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium flex-1">{kpi.name}</span>
        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              onClick={onEdit}
              className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-[#3B5BDB] transition-all"
              title="Edit KPI"
            >
              <Pencil size={11} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 transition-all"
              title="Delete KPI"
            >
              <Trash2 size={11} />
            </button>
          )}
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <span className="font-semibold text-gray-900 dark:text-white">{fmt(kpi.current, kpi.unit)}</span>
            <span className="text-gray-400">/</span>
            <span>{fmt(kpi.target, kpi.unit)}</span>
            {kpi.unit !== '%' && kpi.unit !== 'x' && kpi.unit !== '★' && kpi.unit !== '$' && <span className="text-gray-400">{kpi.unit}</span>}
          </div>
        </div>
      </div>
      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-gray-400">
        <span>{isOnTrack ? 'On Track' : isAtRisk ? 'At Risk' : 'Behind'}</span>
        <span>{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

// ─── KPI Modal ────────────────────────────────────────────────────────────────

function KPIModal({
  pillarId,
  kpi,
  onClose,
}: {
  pillarId: string;
  kpi?: KPI | null;
  onClose: () => void;
}) {
  const { refresh } = useAppData();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: kpi?.name || '',
    target: kpi?.target?.toString() || '',
    current: kpi?.current?.toString() || '',
    unit: kpi?.unit || 'followers',
  });

  const inputClass = 'w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]';
  const labelClass = 'block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    startTransition(async () => {
      try {
        const data = {
          name: form.name.trim(),
          target: parseFloat(form.target) || 0,
          current: parseFloat(form.current) || 0,
          unit: form.unit.trim() || 'followers',
        };
        if (kpi) {
          await updateStrategyKPI(kpi.id, data);
          toast.success('KPI updated');
        } else {
          await createStrategyKPI(pillarId, data);
          toast.success('KPI created');
        }
        refresh?.();
        onClose();
      } catch (err) {
        toast.error('Failed: ' + (err as Error).message);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white text-lg">{kpi ? 'Edit KPI' : 'Add KPI'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Plus size={18} className="rotate-45" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className={labelClass}>Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Instagram Followers, Monthly Revenue"
              className={inputClass}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Current</label>
              <input
                type="number"
                value={form.current}
                onChange={e => setForm(p => ({ ...p, current: e.target.value }))}
                placeholder="e.g. 7200"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Target</label>
              <input
                type="number"
                value={form.target}
                onChange={e => setForm(p => ({ ...p, target: e.target.value }))}
                placeholder="e.g. 10000"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Unit</label>
            <input
              type="text"
              value={form.unit}
              onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
              placeholder="e.g. followers, %, $, leads"
              className={inputClass}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={isPending} className="flex-1 px-4 py-2 bg-[#3B5BDB] hover:bg-[#3B5BDB] disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors">
              {kpi ? 'Save Changes' : 'Add KPI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Pillar Modal ─────────────────────────────────────────────────────────────

function PillarModal({
  strategyId,
  pillar,
  onClose,
}: {
  strategyId: string;
  pillar?: StrategyPillar | null;
  onClose: () => void;
}) {
  const { refresh } = useAppData();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: pillar?.name || '',
    description: pillar?.description || '',
  });

  const inputClass = 'w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]';
  const labelClass = 'block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    startTransition(async () => {
      try {
        if (pillar) {
          await updateStrategyPillar(pillar.id, { name: form.name.trim(), description: form.description.trim() });
          toast.success('Pillar updated');
        } else {
          await createStrategyPillar(strategyId, { name: form.name.trim(), description: form.description.trim() });
          toast.success('Pillar created');
        }
        refresh?.();
        onClose();
      } catch (err) {
        toast.error('Failed: ' + (err as Error).message);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white text-lg">{pillar ? 'Edit Pillar' : 'Add Pillar'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Plus size={18} className="rotate-45" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className={labelClass}>Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Brand Awareness, Lead Generation"
              className={inputClass}
              autoFocus
            />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Briefly describe what this pillar focuses on..."
              rows={3}
              className={inputClass}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={isPending} className="flex-1 px-4 py-2 bg-[#3B5BDB] hover:bg-[#3B5BDB] disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors">
              {pillar ? 'Save Changes' : 'Add Pillar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Service Strategy Card ────────────────────────────────────────────────────

function ServiceStrategyCard({ ss, clientColor }: { ss: ServiceStrategy; clientColor: string }) {
  const { CLIENT_SERVICES = [], SERVICES = [], PROJECTS = [] } = useAppData();
  const [expanded, setExpanded] = useState(false);
  const cs = CLIENT_SERVICES.find(x => x.id === ss.clientServiceId);
  const service = SERVICES.find(s => s.id === cs?.serviceId);
  const projs = PROJECTS.filter(p => cs?.linkedProjects.includes(p.id));
  const health = getServiceStrategyHealth(ss);
  const healthCfg = HEALTH_CONFIG[health];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div
        className="px-4 py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
        onClick={() => setExpanded(e => !e)}
        style={{ borderLeft: `3px solid ${clientColor}` }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
            style={{ backgroundColor: clientColor || 'var(--color-primary)' }}
          >
            {(service?.name || 'S').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">{service?.name || 'Service'}</div>
            <div className="text-xs text-gray-500 truncate">{ss.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${healthCfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${healthCfg.dot}`} />
            {healthCfg.label}
          </span>
          {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 py-4 space-y-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{ss.summary}</p>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pillars</div>
            <div className="space-y-1.5">
              {ss.pillars.map(pillar => (
                <div key={pillar.id} className="flex gap-2 text-xs">
                  <span className="w-1 bg-indigo-300 rounded-full flex-shrink-0" style={{ minHeight: '14px' }} />
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{pillar.name}: </span>
                    <span className="text-gray-500">{pillar.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <BarChart3 size={11} /> KPIs
            </div>
            <div className="space-y-2.5">
              {ss.kpis.map(kpi => (
                <KPIGauge key={kpi.id} kpi={kpi} />
              ))}
            </div>
          </div>
          {projs.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <FolderOpen size={11} /> Linked Projects
              </div>
              <div className="space-y-1.5">
                {projs.map(proj => {
                  const sc = PROJECT_STATUS_CONFIG[proj.status];
                  return (
                    <div key={proj.id} className="flex items-center gap-2 text-xs">
                      <FolderOpen size={11} className="text-gray-400" />
                      <span className="flex-1 text-gray-700 dark:text-gray-300 truncate">{proj.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${sc.color}`}>{proj.progress}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Pillar Card ──────────────────────────────────────────────────────────────

function PillarCard({
  pillar,
  clientColor,
  onEditPillar,
  onDeletePillar,
  onAddKPI,
  onEditKPI,
  onDeleteKPI,
}: {
  pillar: StrategyPillar;
  clientColor: string;
  onEditPillar: () => void;
  onDeletePillar: () => void;
  onAddKPI: () => void;
  onEditKPI: (kpi: KPI) => void;
  onDeleteKPI: (kpi: KPI) => void;
}) {
  const { PROJECTS = [] } = useAppData();
  const projects = PROJECTS.filter(p => pillar.projectIds.includes(p.id));
  const health = getPillarHealth(pillar);
  const healthCfg = HEALTH_CONFIG[health];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div
        className="px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-700"
        style={{ backgroundColor: clientColor + '08' }}
      >
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{pillar.name}</h4>
          {pillar.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{pillar.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${healthCfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${healthCfg.dot}`} />
            {healthCfg.label}
          </span>
          <button
            onClick={onEditPillar}
            className="p-1 text-gray-400 hover:text-[#3B5BDB] rounded transition-colors"
            title="Edit pillar"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onDeletePillar}
            className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
            title="Delete pillar"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* KPIs */}
        <div>
          {pillar.kpis.length > 0 ? (
            <div className="space-y-3">
              {pillar.kpis.map(kpi => (
                <KPIGauge
                  key={kpi.id}
                  kpi={kpi}
                  onEdit={() => onEditKPI(kpi)}
                  onDelete={() => onDeleteKPI(kpi)}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No KPIs yet</p>
          )}
          <button
            onClick={onAddKPI}
            className="mt-3 flex items-center gap-1.5 text-xs text-[#3B5BDB] hover:text-indigo-800 font-medium transition-colors"
          >
            <Plus size={12} />
            Add KPI
          </button>
        </div>

        {/* Projects */}
        {projects.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Projects</div>
            <div className="space-y-1.5">
              {projects.map(proj => {
                const sc = PROJECT_STATUS_CONFIG[proj.status];
                return (
                  <div key={proj.id} className="flex items-center gap-2">
                    <FolderOpen size={11} className="text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">{proj.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${sc.color}`}>{proj.progress}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Strategy View ────────────────────────────────────────────────────────────

function StrategyView({
  strategy,
  onEdit,
  onArchive,
}: {
  strategy: Strategy;
  onEdit: () => void;
  onArchive: () => void;
}) {
  const { CLIENT_SERVICES = [], SERVICE_STRATEGIES = [], SERVICES = [], CLIENTS = [], PROJECTS = [], refresh } = useAppData();
  const client = CLIENTS.find(c => c.id === strategy.clientId)!;
  const statusCfg = STATUS_CONFIG[strategy.status];
  const allProjects = strategy.pillars.flatMap(p => PROJECTS.filter(proj => p.projectIds.includes(proj.id)));
  const uniqueProjects = [...new Map(allProjects.map(p => [p.id, p])).values()];
  const serviceStrategies = SERVICE_STRATEGIES.filter(ss => ss.clientStrategyId === strategy.id);
  const [, startTransition] = useTransition();

  // Pillar modal state
  const [pillarModal, setPillarModal] = useState<{ open: boolean; pillar?: StrategyPillar | null }>({ open: false });
  // KPI modal state
  const [kpiModal, setKpiModal] = useState<{ open: boolean; pillarId?: string; kpi?: KPI | null }>({ open: false });
  // Delete confirm state
  const [deletePillarId, setDeletePillarId] = useState<string | null>(null);
  const [deleteKpiId, setDeleteKpiId] = useState<string | null>(null);

  const overallHealth = (() => {
    if (strategy.pillars.length === 0) return 'on-track';
    const healths = strategy.pillars.map(getPillarHealth);
    if (healths.some(h => h === 'behind')) return 'behind';
    if (healths.some(h => h === 'at-risk')) return 'at-risk';
    return 'on-track';
  })();
  const healthCfg = HEALTH_CONFIG[overallHealth];

  const handleDeletePillar = () => {
    if (!deletePillarId) return;
    const id = deletePillarId;
    setDeletePillarId(null);
    startTransition(async () => {
      try {
        await archiveStrategyPillar(id);
        toast.success('Pillar removed');
        refresh?.();
      } catch (err) {
        toast.error('Failed: ' + (err as Error).message);
      }
    });
  };

  const handleDeleteKPI = () => {
    if (!deleteKpiId) return;
    const id = deleteKpiId;
    setDeleteKpiId(null);
    startTransition(async () => {
      try {
        await archiveStrategyKPI(id);
        toast.success('KPI removed');
        refresh?.();
      } catch (err) {
        toast.error('Failed: ' + (err as Error).message);
      }
    });
  };

  if (!client) return null;

  return (
    <div>
      {/* Modals */}
      {pillarModal.open && (
        <PillarModal
          strategyId={strategy.id}
          pillar={pillarModal.pillar}
          onClose={() => setPillarModal({ open: false })}
        />
      )}
      {kpiModal.open && kpiModal.pillarId && (
        <KPIModal
          pillarId={kpiModal.pillarId}
          kpi={kpiModal.kpi}
          onClose={() => setKpiModal({ open: false })}
        />
      )}
      {deletePillarId && (
        <ConfirmDialog
          title="Remove Pillar"
          message="Remove this pillar and all its KPIs? This cannot be undone."
          confirmLabel="Remove"
          destructive
          onConfirm={handleDeletePillar}
          onCancel={() => setDeletePillarId(null)}
        />
      )}
      {deleteKpiId && (
        <ConfirmDialog
          title="Remove KPI"
          message="Remove this KPI?"
          confirmLabel="Remove"
          destructive
          onConfirm={handleDeleteKPI}
          onCancel={() => setDeleteKpiId(null)}
        />
      )}

      {/* Client Strategy Header */}
      <div
        className="rounded-xl p-4 sm:p-5 mb-6 border"
        style={{ backgroundColor: client.color + '08', borderColor: client.color + '30' }}
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: client.color + '18', color: client.color }}
              >
                {client.name}
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusCfg.color}`}>{statusCfg.label}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${healthCfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${healthCfg.dot}`} />
                Overall: {healthCfg.label}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{strategy.name}</h2>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500 flex-wrap">
              <div className="flex items-center gap-1">
                <Calendar size={13} />
                {new Date(strategy.startDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {' – '}
                {new Date(strategy.endDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <div className="flex items-center gap-1">
                <Layers size={13} />
                {strategy.pillars.length} pillars
              </div>
              <div className="flex items-center gap-1">
                <FolderOpen size={13} />
                {uniqueProjects.length} projects
              </div>
              {serviceStrategies.length > 0 && (
                <div className="flex items-center gap-1">
                  <Zap size={13} />
                  {serviceStrategies.length} service strategies
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#3B5BDB] bg-[#EEF2FF] hover:bg-[#E0E7FF] rounded-lg transition-colors border border-[#C7D2FE]"
            >
              <Pencil size={13} />
              Edit Strategy
            </button>
            <button
              onClick={onArchive}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
            >
              Archive
            </button>
            <Link
              href={`/clients/${client.id}`}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all hover:shadow-sm"
              style={{ borderColor: client.color + '40', color: client.color, backgroundColor: client.color + '10' }}
            >
              Client View <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* Service Strategies */}
      {serviceStrategies.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-[#3B5BDB]" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Service Strategies</h3>
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
              {serviceStrategies.length} services
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {serviceStrategies.map(ss => (
              <ServiceStrategyCard key={ss.id} ss={ss} clientColor={client.color} />
            ))}
          </div>
        </div>
      )}

      {/* Core Strategy Pillars */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-[#3B5BDB]" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Core Strategy Pillars</h3>
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
              {strategy.pillars.length} pillars
            </span>
          </div>
          <button
            onClick={() => setPillarModal({ open: true, pillar: null })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#3B5BDB] bg-[#EEF2FF] hover:bg-[#E0E7FF] rounded-lg transition-colors border border-[#C7D2FE]"
          >
            <Plus size={14} />
            Add Pillar
          </button>
        </div>

        {strategy.pillars.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {strategy.pillars.map(pillar => (
              <PillarCard
                key={pillar.id}
                pillar={pillar}
                clientColor={client.color}
                onEditPillar={() => setPillarModal({ open: true, pillar })}
                onDeletePillar={() => setDeletePillarId(pillar.id)}
                onAddKPI={() => setKpiModal({ open: true, pillarId: pillar.id, kpi: null })}
                onEditKPI={(kpi) => setKpiModal({ open: true, pillarId: pillar.id, kpi })}
                onDeleteKPI={(kpi) => setDeleteKpiId(kpi.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
            <Layers size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium mb-3">No pillars yet</p>
            <button
              onClick={() => setPillarModal({ open: true, pillar: null })}
              className="flex items-center gap-2 px-4 py-2 bg-[#3B5BDB] hover:bg-[#3B5BDB] text-white rounded-lg text-sm font-medium transition-colors mx-auto"
            >
              <Plus size={14} />
              Add First Pillar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Strategy Modal ───────────────────────────────────────────────────────────

function StrategyModal({
  clientId,
  strategy,
  onClose,
}: {
  clientId?: string;
  strategy?: Strategy | null;
  onClose: () => void;
}) {
  const { refresh, CLIENTS = [] } = useAppData();
  const [isPending, startTransition] = useTransition();
  const [selectedClientId, setSelectedClientId] = useState(clientId || strategy?.clientId || CLIENTS[0]?.id || '');
  const [form, setForm] = useState({
    name: strategy?.name || 'Q1 2025 Strategy',
    quarter: strategy?.quarter || 'Q1 2025',
    startDate: strategy?.startDate || new Date().toISOString().split('T')[0],
    endDate: strategy?.endDate || (() => { const d = new Date(); d.setMonth(d.getMonth() + 3); return d.toISOString().split('T')[0]; })(),
    status: strategy?.status || 'planning',
  });

  const inputClass = 'w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]';
  const labelClass = 'block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) { toast.error('Please select a client'); return; }
    startTransition(async () => {
      try {
        if (strategy) {
          await updateStrategy(strategy.id, form);
          toast.success('Strategy updated');
        } else {
          await createStrategy({ clientId: selectedClientId, ...form });
          toast.success('Strategy created');
        }
        refresh?.();
        onClose();
      } catch (err) {
        toast.error('Failed: ' + (err as Error).message);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white text-lg">{strategy ? 'Edit Strategy' : 'New Strategy'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Plus size={18} className="rotate-45" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Client selector — always shown when creating, or when clientId is not pre-set */}
          {(!clientId || !strategy) && (
            <div>
              <label className={labelClass}>Client *</label>
              <select
                value={selectedClientId}
                onChange={e => setSelectedClientId(e.target.value)}
                className={inputClass}
                disabled={!!strategy}
              >
                <option value="">Select a client...</option>
                {CLIENTS.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className={labelClass}>Name</label>
            <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputClass} autoFocus={!!clientId} />
          </div>
          <div>
            <label className={labelClass}>Quarter</label>
            <input type="text" value={form.quarter} onChange={e => setForm(p => ({ ...p, quarter: e.target.value }))} placeholder="e.g. Q1 2025" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Start Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>End Date</label>
              <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Strategy['status'] }))} className={inputClass}>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="complete">Complete</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={isPending} className="flex-1 px-4 py-2 bg-[#3B5BDB] hover:bg-[#3B5BDB] disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors">
              {strategy ? 'Save Changes' : 'Create Strategy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StrategyPage() {
  const { STRATEGIES = [], CLIENTS = [], loading, refresh } = useAppData();
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!selectedClientId && CLIENTS.length > 0) {
      setSelectedClientId(CLIENTS[0].id);
    }
  }, [CLIENTS, selectedClientId]);

  const strategy = useMemo(() => STRATEGIES.find(s => s.clientId === selectedClientId) || null, [selectedClientId, STRATEGIES]);

  const handleArchive = () => {
    if (!archiveId) return;
    const id = archiveId;
    setArchiveId(null);
    startTransition(async () => {
      try {
        await archiveStrategy(id);
        toast.success('Strategy archived');
        refresh?.();
      } catch (err) {
        toast.error('Failed: ' + (err as Error).message);
      }
    });
  };

  return (
    <div style={{ backgroundColor: 'var(--color-bg-page)', minHeight: '100vh' }}>
      <TopBar title="Strategy" subtitle="Client strategies, service strategies, and KPI hierarchy" />

      {showStrategyModal && (
        <StrategyModal
          clientId={selectedClientId || undefined}
          strategy={strategy}
          onClose={() => setShowStrategyModal(false)}
        />
      )}
      {archiveId && (
        <ConfirmDialog
          title="Archive Strategy"
          message="Archive this strategy? It will be hidden from all views."
          confirmLabel="Archive"
          destructive
          onConfirm={handleArchive}
          onCancel={() => setArchiveId(null)}
        />
      )}

      <div style={{ padding: '24px 32px' }}>
        {/* Top action bar — New Strategy always visible */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            {CLIENTS.length} {CLIENTS.length === 1 ? 'client' : 'clients'}
          </h2>
          <button
            onClick={() => setShowStrategyModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#3B5BDB] hover:bg-[#3B5BDB] text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={14} />
            New Strategy
          </button>
        </div>

        {/* Client selector tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {CLIENTS.map(client => {
            const s = STRATEGIES.find(st => st.clientId === client.id);
            const isSelected = selectedClientId === client.id;
            return (
              <button
                key={client.id}
                onClick={() => setSelectedClientId(client.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] border ${
                  isSelected
                    ? 'text-white shadow-md border-transparent'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                }`}
                style={isSelected ? { backgroundColor: client.color, borderColor: client.color } : {}}
              >
                <span
                  className="w-6 h-6 rounded text-xs font-bold flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : client.color + '20',
                    color: isSelected ? 'white' : client.color,
                  }}
                >
                  {client.logo}
                </span>
                {client.name}
                {s && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${isSelected ? 'bg-white/20 text-white' : STATUS_CONFIG[s.status].color}`}>
                    {s.quarter}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {strategy ? (
          <StrategyView
            strategy={strategy}
            onEdit={() => setShowStrategyModal(true)}
            onArchive={() => setArchiveId(strategy.id)}
          />
        ) : (
          <div className="text-center py-20 text-gray-400">
            <Target size={40} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium mb-1">
              {selectedClientId
                ? `No strategy for ${CLIENTS.find(c => c.id === selectedClientId)?.name || 'this client'}`
                : 'Select a client above'}
            </p>
            {selectedClientId && (
              <button
                onClick={() => setShowStrategyModal(true)}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#3B5BDB] hover:bg-[#3B5BDB] text-white rounded-lg text-sm font-medium transition-colors mx-auto"
              >
                <Plus size={14} />
                Create Strategy
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
