'use client';

import dynamic from 'next/dynamic';
import { useState, useMemo, useEffect, useTransition, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Strategy, KPI, ServiceStrategy, Service, ClientService } from '@/lib/data';
import { useAppData } from '@/lib/contexts/AppDataContext';
import TopBar from '@/components/layout/TopBar';
import {
  TrendingUp, Target, CheckCircle, Clock, AlertTriangle, ChevronDown, ChevronUp,
  BarChart3, FolderOpen, Calendar, Zap, ArrowRight, Plus, Pencil, Trash2,
  TrendingDown, Minus as MinusIcon, FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  createStrategy, updateStrategy, archiveStrategy, activateStrategy,
  createStrategyKPI, updateStrategyKPI, archiveStrategyKPI,
  addServiceToStrategy, removeServiceFromStrategy, updateServiceStrategySummary,
} from '@/lib/actions';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const StrategyDiagram = dynamic(() => import('@/components/strategy/StrategyDiagram'), { ssr: false });

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-600', icon: FileText },
  queued: { label: 'Queued', color: 'bg-amber-100 text-amber-700', icon: Clock },
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

interface KpiLiveData {
  actual: number | null;
  source: 'meta' | 'manual';
  lastSyncAt: string | null;
  metricType: string | null;
  trendPct: number | null;
}

function KPIGauge({
  kpi,
  liveData,
  onEdit,
  onDelete,
}: {
  kpi: KPI;
  liveData?: KpiLiveData | null;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const isMetaTracked = liveData?.source === 'meta' && liveData.actual != null;
  const displayCurrent = isMetaTracked ? (liveData.actual ?? kpi.current) : kpi.current;

  const lb = kpi.name.toLowerCase().includes('bounce') || kpi.name.toLowerCase().includes('churn') || kpi.name.toLowerCase().includes('cpc') || kpi.name.toLowerCase().includes('pos');
  const pct = lb
    ? Math.max(0, Math.min(100, (kpi.target / Math.max(displayCurrent, 0.01)) * 100))
    : Math.max(0, Math.min(100, (displayCurrent / kpi.target) * 100));
  const isOnTrack = pct >= 70;
  const isAtRisk = pct >= 40 && pct < 70;
  const barColor = isOnTrack ? 'bg-green-500' : isAtRisk ? 'bg-amber-500' : 'bg-red-400';

  const fmt = (v: number, unit: string) => {
    if (unit === '$') return `$${v.toLocaleString()}`;
    if (unit === '%' || unit === 'x' || unit === '★') return `${v}${unit}`;
    if (v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
    return `${v}`;
  };

  const trendPct = liveData?.trendPct ?? null;
  const lastSync = liveData?.lastSyncAt
    ? new Date(liveData.lastSyncAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  return (
    <div className="group space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium truncate">{kpi.name}</span>
          {isMetaTracked && (
            <span className="flex-shrink-0 text-[9px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-0.5 rounded-full">
              Meta Ads
            </span>
          )}
          {liveData && !isMetaTracked && (
            <span className="flex-shrink-0 text-[9px] font-semibold bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
              Manual
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
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
            <span className={`font-semibold ${isMetaTracked ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
              {fmt(displayCurrent, kpi.unit)}
            </span>
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
        <div className="flex items-center gap-2">
          <span>{isOnTrack ? 'On Track' : isAtRisk ? 'At Risk' : 'Behind'}</span>
          {trendPct !== null && (
            <span className={`flex items-center gap-0.5 ${trendPct > 0 ? 'text-green-600' : trendPct < 0 ? 'text-red-500' : 'text-gray-400'}`}>
              {trendPct > 0 ? <TrendingUp size={9} /> : trendPct < 0 ? <TrendingDown size={9} /> : <MinusIcon size={9} />}
              {trendPct > 0 ? '+' : ''}{trendPct}% vs prev 30d
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {lastSync && isMetaTracked && <span title={`Synced ${lastSync}`}>↻ {lastSync}</span>}
          <span>{Math.round(pct)}%</span>
        </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
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
                <FolderOpen size={11} /> Linked Initiatives
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

// ─── Service Strategy Item ───────────────────────────────────────────────────

function ServiceStrategyItem({
  cs,
  service,
  linked,
  strategyId,
  onRefresh,
}: {
  cs: ClientService;
  service?: Service;
  linked?: ServiceStrategy;
  strategyId: string;
  onRefresh: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [summary, setSummary] = useState(linked?.summary ?? '');
  const [isEditingSummary, setIsEditingSummary] = useState(false);

  // Sync summary when linked changes
  useEffect(() => {
    setSummary(linked?.summary ?? '');
  }, [linked?.summary]);

  const handleLink = () => {
    startTransition(async () => {
      try {
        await addServiceToStrategy(cs.id, strategyId);
        toast.success(`${service?.name ?? 'Service'} linked to strategy`);
        onRefresh();
      } catch (err) {
        toast.error('Failed: ' + (err as Error).message);
      }
    });
  };

  const handleUnlink = () => {
    if (!linked) return;
    startTransition(async () => {
      try {
        await removeServiceFromStrategy(linked.id);
        toast.success(`${service?.name ?? 'Service'} removed from strategy`);
        onRefresh();
      } catch (err) {
        toast.error('Failed: ' + (err as Error).message);
      }
    });
  };

  const handleSaveSummary = () => {
    if (!linked) return;
    setIsEditingSummary(false);
    startTransition(async () => {
      try {
        await updateServiceStrategySummary(linked.id, summary);
        onRefresh();
      } catch (err) {
        toast.error('Failed: ' + (err as Error).message);
      }
    });
  };

  return (
    <div className={`rounded-xl border p-4 transition-all ${linked ? 'border-[#3B5BDB] bg-[#EEF2FF]/30 dark:bg-indigo-900/10' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 opacity-70'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: linked ? '#3B5BDB' : '#9ca3af' }}
          >
            {(service?.name ?? 'S').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{service?.name ?? 'Service'}</div>
            <div className="text-xs text-gray-400">{service?.category ?? ''}</div>
          </div>
        </div>
        <button
          onClick={linked ? handleUnlink : handleLink}
          disabled={isPending}
          className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-60 ${
            linked
              ? 'text-red-500 hover:bg-red-50 border border-red-200'
              : 'text-[#3B5BDB] hover:bg-[#EEF2FF] border border-[#C7D2FE]'
          }`}
        >
          {isPending ? '...' : linked ? 'Remove' : 'Add'}
        </button>
      </div>

      {linked && (
        <div className="mt-3">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Relevance to Strategy</label>
          {isEditingSummary ? (
            <textarea
              value={summary}
              onChange={e => setSummary(e.target.value)}
              onBlur={handleSaveSummary}
              autoFocus
              rows={3}
              placeholder="How does this service contribute to the strategy?"
              className="w-full text-xs border border-[#3B5BDB] rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none resize-none"
            />
          ) : (
            <button
              onClick={() => setIsEditingSummary(true)}
              className="w-full text-left text-xs text-gray-500 italic hover:text-gray-700 transition-colors min-h-[40px]"
            >
              {summary || 'Click to add relevance note...'}
            </button>
          )}
        </div>
      )}
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
  const { CLIENT_SERVICES = [], SERVICE_STRATEGIES = [], SERVICES = [], CLIENTS = [], PROJECTS = [], TASKS = [], refresh } = useAppData();
  const client = CLIENTS.find(c => c.id === strategy.clientId)!;
  const statusCfg = STATUS_CONFIG[strategy.status];
  const allProjects = strategy.pillars.flatMap(p => PROJECTS.filter(proj => p.projectIds.includes(proj.id)));
  const uniqueProjects = [...new Map(allProjects.map(p => [p.id, p])).values()];
  const serviceStrategies = SERVICE_STRATEGIES.filter(ss => ss.clientStrategyId === strategy.id);
  const [, startTransition] = useTransition();
  const [showDiagram, setShowDiagram] = useState(false);

  // KPI modal state
  const [kpiModal, setKpiModal] = useState<{ open: boolean; pillarId?: string; kpi?: KPI | null }>({ open: false });
  // Delete confirm state
  const [deleteKpiId, setDeleteKpiId] = useState<string | null>(null);
  // Description edit state
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState(strategy.description);

  // Live KPI actual values from portal
  const [kpiActuals, setKpiActuals] = useState<Record<string, KpiLiveData>>({});
  useEffect(() => {
    const allKpiIds = strategy.pillars.flatMap(p => p.kpis.map(k => k.id));
    if (allKpiIds.length === 0) return;
    fetch(`/api/data/kpi-actuals?clientId=${strategy.clientId}&kpiIds=${allKpiIds.join(',')}`)
      .then(r => r.json())
      .then(data => { if (data.kpiActuals) setKpiActuals(data.kpiActuals); })
      .catch(() => { /* silent — falls back to manual */ });
  }, [strategy.id, strategy.clientId, strategy.pillars]);

  const overallHealth: 'on-track' | 'at-risk' | 'behind' = 'on-track';
  const healthCfg = HEALTH_CONFIG[overallHealth];

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

  const handleSaveDescription = () => {
    setIsEditingDesc(false);
    startTransition(async () => {
      try {
        await updateStrategy(strategy.id, { description: descValue });
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
      {kpiModal.open && kpiModal.pillarId && (
        <KPIModal
          pillarId={kpiModal.pillarId}
          kpi={kpiModal.kpi}
          onClose={() => setKpiModal({ open: false })}
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
        style={{ backgroundColor: 'var(--color-white)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: '#000000', color: '#ffffff' }}
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
            {isEditingDesc ? (
              <textarea
                value={descValue}
                onChange={(e) => setDescValue(e.target.value)}
                onBlur={handleSaveDescription}
                autoFocus
                rows={2}
                className="w-full mt-2 text-sm border border-[#3B5BDB] rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none resize-none"
              />
            ) : (
              <button
                onClick={() => setIsEditingDesc(true)}
                className="mt-1 text-sm text-gray-500 italic hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-left"
              >
                {descValue || 'Add a strategy description...'}
              </button>
            )}
            <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500 flex-wrap">
              <div className="flex items-center gap-1">
                <Calendar size={13} />
                {new Date(strategy.startDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {' – '}
                {new Date(strategy.endDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
          <div className="grid grid-cols-2 sm:flex sm:items-center sm:gap-2 sm:flex-shrink-0 sm:flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowDiagram(true)}
              className="flex items-center justify-center sm:justify-start gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <TrendingUp size={13} />
              <span className="hidden sm:inline">Strategy Overview</span>
              <span className="inline sm:hidden">Overview</span>
            </button>
            <button
              onClick={onEdit}
              className="flex items-center justify-center sm:justify-start gap-1.5 px-3 py-1.5 text-sm font-medium text-[#3B5BDB] bg-[#EEF2FF] hover:bg-[#E0E7FF] rounded-lg transition-colors border border-[#C7D2FE]"
            >
              <Pencil size={13} />
              <span className="hidden sm:inline">Edit Strategy</span>
              <span className="inline sm:hidden">Edit</span>
            </button>
            <button
              onClick={onArchive}
              className="flex items-center justify-center sm:justify-start gap-1.5 px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
            >
              <span className="hidden sm:inline">Archive</span>
              <span className="inline sm:hidden">✕</span>
            </button>
            <Link
              href={`/clients/${client.id}`}
              className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all hover:shadow-sm"
              style={{ borderColor: '#000000', color: '#ffffff', backgroundColor: '#000000' }}
            >
              <span className="hidden sm:inline">Client View <ArrowRight size={12} className="inline ml-1" /></span>
              <span className="inline sm:hidden">Client</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Pillar Columns Board */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-[#3B5BDB]" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Initiatives by Pillar</h3>
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
              {strategy.pillars.length} pillars
            </span>
          </div>
        </div>

        {strategy.pillars.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <BarChart3 size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium mb-1">No pillars yet</p>
            <p className="text-xs">Add pillars to organize your strategic initiatives</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {strategy.pillars.map(pillar => {
              const pillarProjects = PROJECTS.filter(p => pillar.projectIds.includes(p.id));
              return (
                <div
                  key={pillar.id}
                  className="flex-shrink-0 w-72 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  {/* Column Header */}
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{pillar.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{pillar.description}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-medium">
                        {pillar.kpis.length} KPI{pillar.kpis.length !== 1 ? 's' : ''}
                      </span>
                      <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded font-medium">
                        {pillarProjects.length} initiative{pillarProjects.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Column Body */}
                  <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
                    {pillarProjects.length === 0 ? (
                      <div className="text-center py-6 text-gray-400">
                        <p className="text-xs italic">No initiatives yet</p>
                      </div>
                    ) : (
                      pillarProjects.map(project => {
                        const projectStatus = PROJECT_STATUS_CONFIG[project.status];
                        const taskCount = project.taskIds.length;
                        return (
                          <Link
                            key={project.id}
                            href={`/app/projects/${project.id}`}
                            className="block p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-500 transition-all"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h5 className="font-medium text-sm text-gray-900 dark:text-white truncate flex-1">
                                {project.name}
                              </h5>
                              <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 font-medium ${projectStatus.color}`}>
                                {projectStatus.label}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 transition-all"
                                  style={{ width: `${project.progress || 0}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 font-medium">
                                {project.progress || 0}%
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <FolderOpen size={12} />
                              {taskCount} task{taskCount !== 1 ? 's' : ''}
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showDiagram && (
        <StrategyDiagram
          strategy={strategy}
          serviceStrategies={serviceStrategies}
          clientServices={CLIENT_SERVICES.filter(cs => cs.clientId === strategy.clientId)}
          services={SERVICES}
          projects={PROJECTS}
          tasks={TASKS}
          pillars={strategy.pillars}
          onClose={() => setShowDiagram(false)}
        />
      )}
    </div>
  );
}

// ─── Strategy Pipeline ────────────────────────────────────────────────────────

function StrategyPipeline({
  strategies,
  onActivate,
  onQueueDraft,
}: {
  strategies: Strategy[];
  onActivate: (id: string) => void;
  onQueueDraft: (id: string) => void;
}) {
  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Clock size={16} />
        Strategy Pipeline
        <span className="ml-auto px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full">
          {strategies.length}
        </span>
      </h3>
      {strategies.length === 0 ? (
        <div className="text-center py-8 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <Target size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No upcoming strategies. Create one to start building your pipeline.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {strategies.map(strat => {
            const statusCfg = STATUS_CONFIG[strat.status];
            const Icon = statusCfg.icon;
            return (
              <div
                key={strat.id}
                className="flex items-start justify-between gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">{strat.name}</h4>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${statusCfg.color}`}>
                      {strat.quarter}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(strat.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(strat.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-1 rounded font-medium flex items-center gap-1 ${statusCfg.color}`}>
                    <Icon size={12} />
                    {statusCfg.label}
                  </span>
                  {strat.status === 'draft' && (
                    <button
                      onClick={() => onQueueDraft(strat.id)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                    >
                      Queue
                    </button>
                  )}
                  {strat.status === 'queued' && (
                    <button
                      onClick={() => onActivate(strat.id)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                    >
                      Activate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
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
    description: strategy?.description || '',
    quarter: strategy?.quarter || 'Q1 2025',
    startDate: strategy?.startDate || new Date().toISOString().split('T')[0],
    endDate: strategy?.endDate || (() => { const d = new Date(); d.setMonth(d.getMonth() + 3); return d.toISOString().split('T')[0]; })(),
    status: strategy?.status || 'draft',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
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
            <label className={labelClass}>Description</label>
            <textarea 
              value={form.description} 
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))} 
              placeholder="Describe the overall strategy direction and goals..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
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

function StrategyPageContent() {
  const searchParams = useSearchParams();
  const { STRATEGIES = [], CLIENTS = [], loading, refresh } = useAppData();
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const initialParamConsumed = useRef(false);

  useEffect(() => {
    // Only read the URL param once on initial mount — after that, manual tab clicks win.
    if (!initialParamConsumed.current && CLIENTS.length > 0) {
      initialParamConsumed.current = true;
      const clientIdFromParams = searchParams.get('clientId');
      if (clientIdFromParams && CLIENTS.some(c => c.id === clientIdFromParams)) {
        setSelectedClientId(clientIdFromParams);
      } else {
        setSelectedClientId(CLIENTS[0].id);
      }
    } else if (!initialParamConsumed.current) {
      // CLIENTS not loaded yet — wait for next render
    } else if (!selectedClientId && CLIENTS.length > 0) {
      // Fallback: if somehow selectedClientId is still empty after clients load
      setSelectedClientId(CLIENTS[0].id);
    }
  }, [CLIENTS]); // Only re-run when CLIENTS changes, NOT on searchParams or selectedClientId

  const clientStrategies = useMemo(() => STRATEGIES.filter(s => s.clientId === selectedClientId), [selectedClientId, STRATEGIES]);
  const activeStrategy = useMemo(() => clientStrategies.find(s => s.status === 'active') || null, [clientStrategies]);
  const pipelineStrategies = useMemo(() => clientStrategies.filter(s => s.status === 'draft' || s.status === 'queued').sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()), [clientStrategies]);

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
      <TopBar />

      {showStrategyModal && (
        <StrategyModal
          clientId={selectedClientId || undefined}
          strategy={activeStrategy}
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
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Strategy</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Client strategies, service strategies, and KPI hierarchy</p>
        </div>
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
            const activeStrat = STRATEGIES.find(st => st.clientId === client.id && st.status === 'active');
            const pipelineCount = STRATEGIES.filter(st => st.clientId === client.id && (st.status === 'draft' || st.status === 'queued')).length;
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
                style={isSelected ? { backgroundColor: '#000000', borderColor: '#000000' } : {}}
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
                {activeStrat && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${isSelected ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'}`}>
                    {activeStrat.quarter}
                  </span>
                )}
                {pipelineCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'}`}>
                    +{pipelineCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {activeStrategy ? (
          <>
            <StrategyView
              strategy={activeStrategy}
              onEdit={() => setShowStrategyModal(true)}
              onArchive={() => setArchiveId(activeStrategy.id)}
            />
            {pipelineStrategies.length > 0 && (
              <StrategyPipeline
                strategies={pipelineStrategies}
                onActivate={(id) => {
                  startTransition(async () => {
                    try {
                      await activateStrategy(id);
                      toast.success('Strategy activated');
                      refresh?.();
                    } catch (err) {
                      toast.error('Failed: ' + (err as Error).message);
                    }
                  });
                }}
                onQueueDraft={(id) => {
                  startTransition(async () => {
                    try {
                      await updateStrategy(id, { status: 'queued' });
                      toast.success('Strategy queued');
                      refresh?.();
                    } catch (err) {
                      toast.error('Failed: ' + (err as Error).message);
                    }
                  });
                }}
              />
            )}
          </>
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

export default function StrategyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-center"><div className="animate-spin w-8 h-8 border-4 border-[#3B5BDB] border-t-transparent rounded-full mx-auto" /><p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading...</p></div></div>}>
      <StrategyPageContent />
    </Suspense>
  );
}
