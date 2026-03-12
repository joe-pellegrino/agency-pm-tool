'use client';

import { useState, useMemo } from 'react';
import {
  STRATEGIES, CLIENTS, PROJECTS, Strategy, StrategyPillar, KPI,
} from '@/lib/data';
import TopBar from '@/components/layout/TopBar';
import {
  TrendingUp, Target, CheckCircle, Clock, AlertTriangle, ChevronRight,
  BarChart3, Layers, FolderOpen, Calendar,
} from 'lucide-react';

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

function KPIGauge({ kpi }: { kpi: KPI }) {
  // For "lower is better" metrics (like Bounce Rate), invert the progress
  const lowerIsBetter = kpi.name.toLowerCase().includes('bounce') || kpi.name.toLowerCase().includes('churn');
  const pct = lowerIsBetter
    ? Math.max(0, Math.min(100, ((kpi.target / kpi.current) * 100)))
    : Math.max(0, Math.min(100, (kpi.current / kpi.target) * 100));

  const isOnTrack = lowerIsBetter ? kpi.current <= kpi.target * 1.1 : pct >= 70;
  const isAtRisk = lowerIsBetter ? kpi.current > kpi.target * 1.1 && kpi.current <= kpi.target * 1.3 : pct >= 40 && pct < 70;

  const barColor = isOnTrack ? 'bg-green-500' : isAtRisk ? 'bg-amber-500' : 'bg-red-400';

  const formatValue = (val: number, unit: string) => {
    if (unit === '%' || unit === 'x' || unit === '★') return `${val}${unit}`;
    if (val >= 1000) return `${(val / 1000).toFixed(val >= 10000 ? 0 : 1)}k`;
    return `${val}`;
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{kpi.name}</span>
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <span className="font-semibold text-gray-900 dark:text-white">{formatValue(kpi.current, kpi.unit)}</span>
          <span className="text-gray-400">/</span>
          <span>{formatValue(kpi.target, kpi.unit)}</span>
          {kpi.unit !== '%' && kpi.unit !== 'x' && kpi.unit !== '★' && <span className="text-gray-400">{kpi.unit}</span>}
        </div>
      </div>
      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-gray-400">
        <span>
          {isOnTrack ? '✅ On Track' : isAtRisk ? '⚠️ At Risk' : '🔴 Behind'}
        </span>
        <span>{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

function getPillarHealth(pillar: StrategyPillar): 'on-track' | 'at-risk' | 'behind' {
  const kpiHealths = pillar.kpis.map(kpi => {
    const lowerIsBetter = kpi.name.toLowerCase().includes('bounce') || kpi.name.toLowerCase().includes('churn');
    const pct = lowerIsBetter
      ? Math.max(0, Math.min(100, (kpi.target / kpi.current) * 100))
      : Math.max(0, Math.min(100, (kpi.current / kpi.target) * 100));
    if (pct >= 70) return 'on-track';
    if (pct >= 40) return 'at-risk';
    return 'behind';
  });
  if (kpiHealths.some(h => h === 'behind')) return 'behind';
  if (kpiHealths.some(h => h === 'at-risk')) return 'at-risk';
  return 'on-track';
}

const HEALTH_CONFIG = {
  'on-track': { label: 'On Track', color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' },
  'at-risk': { label: 'At Risk', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  'behind': { label: 'Behind', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
};

function PillarCard({ pillar, clientColor }: { pillar: StrategyPillar; clientColor: string }) {
  const projects = PROJECTS.filter(p => pillar.projectIds.includes(p.id));
  const health = getPillarHealth(pillar);
  const healthCfg = HEALTH_CONFIG[health];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Pillar header */}
      <div
        className="px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-700"
        style={{ backgroundColor: clientColor + '08' }}
      >
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
        {/* KPIs */}
        <div className="space-y-3">
          {pillar.kpis.map(kpi => (
            <KPIGauge key={kpi.id} kpi={kpi} />
          ))}
        </div>

        {/* Projects */}
        {projects.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Projects</div>
            <div className="space-y-1.5">
              {projects.map(proj => {
                const statusCfg = PROJECT_STATUS_CONFIG[proj.status];
                return (
                  <div key={proj.id} className="flex items-center gap-2">
                    <FolderOpen size={11} className="text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">{proj.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${statusCfg.color}`}>
                      {proj.progress}%
                    </span>
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
  const client = CLIENTS.find(c => c.id === strategy.clientId)!;
  const statusCfg = STATUS_CONFIG[strategy.status];
  const allProjects = strategy.pillars.flatMap(p => PROJECTS.filter(proj => p.projectIds.includes(proj.id)));
  const uniqueProjects = [...new Map(allProjects.map(p => [p.id, p])).values()];

  const overallHealth = (() => {
    const healths = strategy.pillars.map(getPillarHealth);
    if (healths.some(h => h === 'behind')) return 'behind';
    if (healths.some(h => h === 'at-risk')) return 'at-risk';
    return 'on-track';
  })();

  const healthCfg = HEALTH_CONFIG[overallHealth];

  return (
    <div>
      {/* Strategy header */}
      <div
        className="rounded-xl p-4 sm:p-5 mb-5 border"
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
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
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
            </div>
          </div>
        </div>
      </div>

      {/* Pillars grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {strategy.pillars.map(pillar => (
          <PillarCard key={pillar.id} pillar={pillar} clientColor={client.color} />
        ))}
      </div>
    </div>
  );
}

export default function StrategyPage() {
  const [selectedClientId, setSelectedClientId] = useState<string>(CLIENTS[0].id);

  const strategy = useMemo(() => {
    return STRATEGIES.find(s => s.clientId === selectedClientId) || null;
  }, [selectedClientId]);

  return (
    <div className="pt-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopBar title="Strategy" subtitle="Quarterly strategies, pillars, KPIs, and project alignment" />

      <div className="p-4 sm:p-6 lg:p-8">
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
                    color: isSelected ? 'white' : client.color
                  }}
                >
                  {client.logo}
                </span>
                {client.name}
                {s && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : STATUS_CONFIG[s.status].color
                  }`}>
                    {s.quarter}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {strategy ? (
          <StrategyView strategy={strategy} />
        ) : (
          <div className="text-center py-20 text-gray-400">
            <Target size={40} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">No strategy found for this client</p>
            <p className="text-sm mt-1">Strategies will appear here once created</p>
          </div>
        )}
      </div>
    </div>
  );
}
