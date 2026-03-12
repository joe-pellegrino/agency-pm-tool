'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CLIENTS, SERVICES, CLIENT_SERVICES, SERVICE_STRATEGIES, PROJECTS, TASKS,
  Service, ClientService, ServiceCategory,
} from '@/lib/data';
import TopBar from '@/components/layout/TopBar';
import {
  LayoutGrid, List, Filter, Search, TrendingUp, Activity, AlertTriangle,
  CheckCircle, Zap, FolderOpen, ChevronRight, Users,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; cell: string }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700', dot: 'bg-green-500', cell: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700/50' },
  planning: { label: 'Planning', color: 'bg-blue-100 text-blue-600', dot: 'bg-blue-400', cell: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700/50' },
  paused: { label: 'Paused', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', cell: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700/50' },
  cancelled: { label: 'Not Active', color: 'bg-gray-100 text-gray-400', dot: 'bg-gray-300', cell: 'bg-gray-50 border-gray-100 dark:bg-gray-800/30 dark:border-gray-700/30' },
};

function getHealthColor(score: number | null): string {
  if (score === null) return 'text-gray-400';
  if (score >= 70) return 'text-green-600 dark:text-green-400';
  if (score >= 40) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function getCellBg(score: number | null, status: string): string {
  if (status === 'cancelled') return 'bg-gray-50 dark:bg-gray-800/20';
  if (score === null) return 'bg-white dark:bg-gray-800';
  if (score >= 70) return 'bg-green-50 dark:bg-green-900/10';
  if (score >= 40) return 'bg-amber-50 dark:bg-amber-900/10';
  return 'bg-red-50 dark:bg-red-900/10';
}

function getCellBorder(score: number | null, status: string): string {
  if (status === 'cancelled') return 'border-gray-100 dark:border-gray-700/30';
  if (score === null) return 'border-gray-200 dark:border-gray-700';
  if (score >= 70) return 'border-green-200 dark:border-green-700/40';
  if (score >= 40) return 'border-amber-200 dark:border-amber-700/40';
  return 'border-red-200 dark:border-red-700/40';
}

function computeHealthScore(cs: ClientService): number | null {
  const ss = SERVICE_STRATEGIES.find(s => s.clientServiceId === cs.id);
  if (!ss) return null;
  const scores = ss.kpis.map(kpi => {
    const lb = kpi.name.toLowerCase().includes('bounce') || kpi.name.toLowerCase().includes('cpc') || kpi.name.toLowerCase().includes('pos');
    return lb ? Math.min(100, (kpi.target / Math.max(kpi.current, 0.01)) * 100) : Math.min(100, (kpi.current / kpi.target) * 100);
  });
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function MatrixCell({ cs }: { cs: ClientService | null; clientId: string; serviceId: string }) {
  if (!cs) {
    return (
      <div className="h-20 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/20 flex items-center justify-center">
        <span className="text-[11px] text-gray-300 dark:text-gray-600">—</span>
      </div>
    );
  }

  const health = computeHealthScore(cs);
  const projs = PROJECTS.filter(p => cs.linkedProjects.includes(p.id));
  const tasks = projs.flatMap(p => TASKS.filter(t => p.taskIds.includes(t.id)));
  const openTasks = tasks.filter(t => t.status !== 'done').length;
  const blockers = tasks.filter(t => t.priority === 'Urgent' && t.status !== 'done').length;
  const donePct = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0;
  const statusCfg = STATUS_CONFIG[cs.status];

  return (
    <Link
      href={`/clients/${cs.clientId}`}
      className={`h-20 rounded-lg border flex flex-col justify-between p-2.5 transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer ${getCellBg(health, cs.status)} ${getCellBorder(health, cs.status)}`}
    >
      <div className="flex items-start justify-between">
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1 ${statusCfg.color}`}>
          <span className={`w-1 h-1 rounded-full ${statusCfg.dot}`} />
          {statusCfg.label}
        </span>
        {health !== null && (
          <span className={`text-xs font-bold ${getHealthColor(health)}`}>{health}%</span>
        )}
      </div>
      {cs.status !== 'cancelled' && (
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-[10px] text-gray-500">
            <span>{openTasks} tasks</span>
            {blockers > 0 && (
              <span className="text-red-500 flex items-center gap-0.5">
                <AlertTriangle size={9} />
                {blockers}
              </span>
            )}
          </div>
          {tasks.length > 0 && (
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1 overflow-hidden">
              <div
                className={`h-1 rounded-full ${health !== null && health >= 70 ? 'bg-green-500' : health !== null && health >= 40 ? 'bg-amber-500' : 'bg-indigo-400'}`}
                style={{ width: `${donePct}%` }}
              />
            </div>
          )}
        </div>
      )}
    </Link>
  );
}

function ListView({ filteredServices, clientFilter }: { filteredServices: Service[]; clientFilter: string }) {
  return (
    <div className="space-y-4">
      {filteredServices.map(service => {
        const csForService = CLIENT_SERVICES.filter(
          cs => cs.serviceId === service.id && (clientFilter === 'all' || cs.clientId === clientFilter),
        );
        const activeCs = csForService.filter(cs => cs.status === 'active' || cs.status === 'planning');

        if (activeCs.length === 0) return null;

        return (
          <div key={service.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Service header */}
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
              <span className="text-xl">{service.icon}</span>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{service.name}</h3>
                <span className="text-xs text-gray-400">{service.category}</span>
              </div>
              <span className="ml-auto text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                {activeCs.length} client{activeCs.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Client rows */}
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {activeCs.map(cs => {
                const client = CLIENTS.find(c => c.id === cs.clientId)!;
                const health = computeHealthScore(cs);
                const projs = PROJECTS.filter(p => cs.linkedProjects.includes(p.id));
                const tasks = projs.flatMap(p => TASKS.filter(t => p.taskIds.includes(t.id)));
                const openTasks = tasks.filter(t => t.status !== 'done').length;
                const blockers = tasks.filter(t => t.priority === 'Urgent' && t.status !== 'done').length;
                const statusCfg = STATUS_CONFIG[cs.status];

                return (
                  <Link
                    key={cs.id}
                    href={`/clients/${client.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group"
                  >
                    {/* Client badge */}
                    <div className="flex items-center gap-2 w-36 flex-shrink-0">
                      <span
                        className="w-6 h-6 rounded text-xs font-bold flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: client.color + '20', color: client.color }}
                      >
                        {client.logo}
                      </span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{client.name}</span>
                    </div>

                    {/* Status */}
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0 ${statusCfg.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                      {statusCfg.label}
                    </span>

                    {/* Cadence */}
                    <span className="text-xs text-gray-400 flex-1 truncate hidden sm:block">{cs.monthlyCadence}</span>

                    {/* Metrics */}
                    <div className="flex items-center gap-4 flex-shrink-0 ml-auto">
                      <div className="text-center hidden md:block">
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{projs.length}</div>
                        <div className="text-[10px] text-gray-400">projects</div>
                      </div>
                      <div className="text-center hidden md:block">
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{openTasks}</div>
                        <div className="text-[10px] text-gray-400">open tasks</div>
                      </div>
                      {blockers > 0 && (
                        <div className="text-center hidden sm:block">
                          <div className="text-sm font-semibold text-red-500">{blockers}</div>
                          <div className="text-[10px] text-gray-400">blockers</div>
                        </div>
                      )}
                      {health !== null && (
                        <div className={`text-center ${getHealthColor(health)}`}>
                          <div className="text-sm font-bold">{health}%</div>
                          <div className="text-[10px] text-gray-400">health</div>
                        </div>
                      )}
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ServicesPage() {
  const [view, setView] = useState<'matrix' | 'list'>('matrix');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const categories = useMemo(() => {
    const cats = new Set(SERVICES.map(s => s.category));
    return ['all', ...Array.from(cats)];
  }, []);

  const filteredServices = useMemo(() => {
    return SERVICES.filter(s => {
      const matchCat = categoryFilter === 'all' || s.category === categoryFilter;
      const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [categoryFilter, search]);

  // Stats
  const stats = useMemo(() => {
    const activeCs = CLIENT_SERVICES.filter(cs => cs.status === 'active');
    const planningCs = CLIENT_SERVICES.filter(cs => cs.status === 'planning');
    const allProjs = activeCs.flatMap(cs => PROJECTS.filter(p => cs.linkedProjects.includes(p.id)));
    const allTasks = allProjs.flatMap(p => TASKS.filter(t => p.taskIds.includes(t.id)));
    const openTasks = allTasks.filter(t => t.status !== 'done').length;
    const blockers = allTasks.filter(t => t.priority === 'Urgent' && t.status !== 'done').length;

    return {
      totalActive: activeCs.length,
      planning: planningCs.length,
      openTasks,
      blockers,
    };
  }, []);

  // Matrix data: map[serviceId][clientId] = ClientService | null
  const matrixData = useMemo(() => {
    const map: Record<string, Record<string, ClientService | null>> = {};
    filteredServices.forEach(s => {
      map[s.id] = {};
      CLIENTS.forEach(c => {
        const cs = CLIENT_SERVICES.find(
          x => x.serviceId === s.id && x.clientId === c.id &&
            (statusFilter === 'all' || x.status === statusFilter) &&
            (clientFilter === 'all' || x.clientId === clientFilter),
        );
        map[s.id][c.id] = cs || null;
      });
    });
    return map;
  }, [filteredServices, statusFilter, clientFilter]);

  return (
    <div className="pt-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopBar title="Services" subtitle="Agency-wide service delivery across all clients" />

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Active Services', value: stats.totalActive, icon: Zap, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
            { label: 'In Planning', value: stats.planning, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Open Tasks', value: stats.openTasks, icon: CheckCircle, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
            { label: 'Urgent Items', value: stats.blockers, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`rounded-xl border border-gray-200 dark:border-gray-700 p-4 ${bg} flex items-center gap-3`}>
              <div className={`${color} flex-shrink-0`}>
                <Icon size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters & View Toggle */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
            ))}
          </select>

          {/* Client filter */}
          <select
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
          >
            <option value="all">All Clients</option>
            {CLIENTS.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="planning">Planning</option>
            <option value="paused">Paused</option>
            <option value="cancelled">Not Active</option>
          </select>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1 flex-shrink-0 ml-auto">
            <button
              onClick={() => setView('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all ${view === 'matrix' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              <LayoutGrid size={14} />
              Matrix
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all ${view === 'list' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              <List size={14} />
              List
            </button>
          </div>
        </div>

        {view === 'matrix' ? (
          /* Matrix View */
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Legend */}
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-4 flex-wrap">
              <span className="text-xs font-semibold text-gray-500">Health:</span>
              {[
                { label: '≥ 70% On Track', color: 'bg-green-500' },
                { label: '40-70% At Risk', color: 'bg-amber-500' },
                { label: '< 40% Behind', color: 'bg-red-400' },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                  <span className="text-xs text-gray-500">{label}</span>
                </div>
              ))}
              <span className="text-xs text-gray-400 ml-auto">Click any cell to view client detail</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-48">
                      Service
                    </th>
                    {CLIENTS.map(client => (
                      <th key={client.id} className="px-3 py-3 text-center w-36">
                        <Link href={`/clients/${client.id}`} className="flex flex-col items-center gap-1 hover:opacity-70 transition-opacity">
                          <span
                            className="w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center"
                            style={{ backgroundColor: client.color + '20', color: client.color }}
                          >
                            {client.logo}
                          </span>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{client.name}</span>
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map(service => (
                    <tr key={service.id} className="border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{service.icon}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{service.name}</div>
                            <div className="text-[10px] text-gray-400">{service.category}</div>
                          </div>
                        </div>
                      </td>
                      {CLIENTS.map(client => (
                        <td key={client.id} className="px-3 py-3">
                          <MatrixCell
                            cs={matrixData[service.id]?.[client.id] || null}
                            clientId={client.id}
                            serviceId={service.id}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* List View */
          <ListView filteredServices={filteredServices} clientFilter={clientFilter} />
        )}

        {/* Client quick links */}
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Jump to Client</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {CLIENTS.map(client => {
              const active = CLIENT_SERVICES.filter(cs => cs.clientId === client.id && cs.status === 'active').length;
              const css = CLIENT_SERVICES.filter(cs => cs.clientId === client.id && cs.status === 'active');
              const allScores = css.flatMap(cs => {
                const ss = SERVICE_STRATEGIES.find(s => s.clientServiceId === cs.id);
                if (!ss) return [];
                return ss.kpis.map(kpi => {
                  const lb = kpi.name.toLowerCase().includes('bounce') || kpi.name.toLowerCase().includes('cpc') || kpi.name.toLowerCase().includes('pos');
                  return lb ? Math.min(100, (kpi.target / Math.max(kpi.current, 0.01)) * 100) : Math.min(100, (kpi.current / kpi.target) * 100);
                });
              });
              const health = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;

              return (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-600 transition-all flex items-center gap-4 group"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{ backgroundColor: client.color }}
                  >
                    {client.logo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">{client.name}</div>
                    <div className="text-xs text-gray-500">{active} active services</div>
                  </div>
                  <div className={`text-lg font-bold ${getHealthColor(health)} flex-shrink-0`}>{health}%</div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
