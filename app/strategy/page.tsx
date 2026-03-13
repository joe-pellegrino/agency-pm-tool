'use client';

import { useState, useMemo, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { Strategy, StrategyPillar, KPI, ServiceStrategy } from '@/lib/data';
import { useAppData } from '@/lib/contexts/AppDataContext';
import TopBar from '@/components/layout/TopBar';
import {
  TrendingUp, Target, CheckCircle, Clock, AlertTriangle, ChevronDown, ChevronUp,
  BarChart3, Layers, FolderOpen, Calendar, Zap, ArrowRight, Plus, Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { createStrategy, updateStrategy, archiveStrategy } from '@/lib/actions';
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

function KPIGauge({ kpi }: { kpi: KPI | { id: string; name: string; target: number; current: number; unit: string } }) {
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
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{kpi.name}</span>
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <span className="font-semibold text-gray-900 dark:text-white">{fmt(kpi.current, kpi.unit)}</span>
          <span className="text-gray-400">/</span>
          <span>{fmt(kpi.target, kpi.unit)}</span>
          {kpi.unit !== '%' && kpi.unit !== 'x' && kpi.unit !== '★' && kpi.unit !== '$' && <span className="text-gray-400">{kpi.unit}</span>}
        </div>
      </div>
      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-gray-400">
        <span>{isOnTrack ? '✅ On Track' : isAtRisk ? '⚠️ At Risk' : '🔴 Behind'}</span>
        <span>{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

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
          <span className="text-xl flex-shrink-0">{service?.icon || '📋'}</span>
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
          {/* Summary */}
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{ss.summary}</p>

          {/* Pillars */}
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

          {/* KPIs */}
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

          {/* Projects */}
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

function PillarCard({ pillar, clientColor }: { pillar: StrategyPillar; clientColor: string }) {
  const { PROJECTS = [] } = useAppData();
  const projects = PROJECTS.filter(p => pillar.projectIds.includes(p.id));
  const health = getPillarHealth(pillar);
  const healthCfg = HEALTH_CONFIG[health];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-700"
        style={{ backgroundColor: clientColor + '08' }}>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{pillar.name}</h4>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{pillar.description}</p>
        </div>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ml-3 flex-shrink-0 flex items-center gap-1 ${healthCfg.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${healthCfg.dot}`} />
          {healthCfg.label}
        </span>
      </div>
      <div className="px-4 py-4 space-y-4">
        <div className="space-y-3">
          {pillar.kpis.map(kpi => <KPIGauge key={kpi.id} kpi={kpi} />)}
        </div>
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

function StrategyView({ strategy }: { strategy: Strategy }) {
  const { CLIENT_SERVICES = [], SERVICE_STRATEGIES = [], SERVICES = [], CLIENTS = [], PROJECTS = [] } = useAppData();
  const client = CLIENTS.find(c => c.id === strategy.clientId)!;
  const statusCfg = STATUS_CONFIG[strategy.status];
  const allProjects = strategy.pillars.flatMap(p => PROJECTS.filter(proj => p.projectIds.includes(proj.id)));
  const uniqueProjects = [...new Map(allProjects.map(p => [p.id, p])).values()];

  // Service strategies for this client strategy
  const serviceStrategies = SERVICE_STRATEGIES.filter(ss => ss.clientStrategyId === strategy.id);

  const overallHealth = (() => {
    const healths = strategy.pillars.map(getPillarHealth);
    if (healths.some(h => h === 'behind')) return 'behind';
    if (healths.some(h => h === 'at-risk')) return 'at-risk';
    return 'on-track';
  })();
  const healthCfg = HEALTH_CONFIG[overallHealth];

  return (
    <div>
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
          <Link
            href={`/clients/${client.id}`}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all hover:shadow-sm flex-shrink-0"
            style={{ borderColor: client.color + '40', color: client.color, backgroundColor: client.color + '10' }}
          >
            Client View <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Service Strategies — Hierarchical */}
      {serviceStrategies.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-indigo-500" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Service Strategies</h3>
            </div>
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
        <div className="flex items-center gap-2 mb-4">
          <Target size={16} className="text-indigo-500" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Core Strategy Pillars</h3>
          <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
            {strategy.pillars.length} pillars
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {strategy.pillars.map(pillar => (
            <PillarCard key={pillar.id} pillar={pillar} clientColor={client.color} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StrategyModal({ clientId, strategy, onClose }: { clientId: string; strategy?: Strategy | null; onClose: () => void }) {
  const { refresh } = useAppData();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: strategy?.name || 'Q1 2025 Strategy',
    quarter: strategy?.quarter || 'Q1 2025',
    startDate: strategy?.startDate || new Date().toISOString().split('T')[0],
    endDate: strategy?.endDate || (() => { const d = new Date(); d.setMonth(d.getMonth() + 3); return d.toISOString().split('T')[0]; })(),
    status: strategy?.status || 'planning',
  });

  const inputClass = 'w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const labelClass = 'block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (strategy) {
          await updateStrategy(strategy.id, form);
          toast.success('Strategy updated');
        } else {
          await createStrategy({ clientId, ...form });
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
          <div>
            <label className={labelClass}>Name</label>
            <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputClass} autoFocus />
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
            <button type="submit" disabled={isPending} className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors">
              {strategy ? 'Save Changes' : 'Create Strategy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StrategyPage() {
  const { STRATEGIES = [], CLIENTS = [], PROJECTS = [], CLIENT_SERVICES = [], SERVICE_STRATEGIES = [], SERVICES = [], loading, refresh } = useAppData();
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  // Set initial client after data loads
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
    <div className="pt-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopBar title="Strategy" subtitle="Client strategies, service strategies, and KPI hierarchy" />
      {showStrategyModal && (
        <StrategyModal
          clientId={selectedClientId}
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

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Client selector */}
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

        {/* Strategy actions */}
        <div className="flex items-center justify-between mb-4">
          <div />
          <div className="flex items-center gap-2">
            {strategy && (
              <>
                <button
                  onClick={() => setShowStrategyModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-200"
                >
                  <Pencil size={12} />
                  Edit Strategy
                </button>
                <button
                  onClick={() => setArchiveId(strategy.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                >
                  Archive
                </button>
              </>
            )}
            {!strategy && selectedClientId && (
              <button
                onClick={() => setShowStrategyModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Plus size={14} />
                New Strategy
              </button>
            )}
          </div>
        </div>

        {strategy ? (
          <StrategyView strategy={strategy} />
        ) : (
          <div className="text-center py-20 text-gray-400">
            <Target size={40} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">No strategy found for this client</p>
            <button
              onClick={() => setShowStrategyModal(true)}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors mx-auto"
            >
              <Plus size={14} />
              Create Strategy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
