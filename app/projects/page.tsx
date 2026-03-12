'use client';

import { useState, useMemo } from 'react';
import {
  PROJECTS, CLIENTS, TASKS, STRATEGIES, WORKFLOW_TEMPLATES, TEAM_MEMBERS,
  Project, Task, PRIORITY_COLORS,
} from '@/lib/data';
import TopBar from '@/components/layout/TopBar';
import {
  FolderOpen, Filter, Search, ChevronRight, X, Calendar, CheckCircle,
  Clock, AlertCircle, PauseCircle, ArrowRight, Tag, Lock, Unlock,
  BarChart3, Users, Layers,
} from 'lucide-react';

const STATUS_CONFIG = {
  planning: { label: 'Planning', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400', icon: Clock },
  active: { label: 'Active', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', icon: CheckCircle },
  complete: { label: 'Complete', color: 'bg-green-100 text-green-700', dot: 'bg-green-500', icon: CheckCircle },
  'on-hold': { label: 'On Hold', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', icon: PauseCircle },
} as const;

function ProgressBar({ value, color = 'bg-indigo-500' }: { value: number; color?: string }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
      <div
        className={`h-1.5 rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

function ProjectDetailModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const client = CLIENTS.find(c => c.id === project.clientId)!;
  const tasks = TASKS.filter(t => project.taskIds.includes(t.id));
  const template = project.workflowTemplateId ? WORKFLOW_TEMPLATES.find(wt => wt.id === project.workflowTemplateId) : null;

  // Find strategy/pillar
  let strategyName = '';
  let pillarName = '';
  if (project.strategyId) {
    const strat = STRATEGIES.find(s => s.id === project.strategyId);
    if (strat) {
      strategyName = strat.name;
      if (project.pillarId) {
        const pillar = strat.pillars.find(p => p.id === project.pillarId);
        if (pillar) pillarName = pillar.name;
      }
    }
  }

  const statusCfg = STATUS_CONFIG[project.status];
  const dateRange = `${new Date(project.startDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(project.endDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  // Build task dependency map
  const taskDepMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    tasks.forEach(t => {
      if (t.dependencies) {
        map[t.id] = t.dependencies.filter(d => project.taskIds.includes(d));
      }
    });
    return map;
  }, [tasks, project.taskIds]);

  // Tasks that block others
  const blocksMap: Record<string, string[]> = {};
  tasks.forEach(t => {
    (taskDepMap[t.id] || []).forEach(depId => {
      if (!blocksMap[depId]) blocksMap[depId] = [];
      blocksMap[depId].push(t.id);
    });
  });

  const isBlocked = (taskId: string) => {
    const deps = taskDepMap[taskId] || [];
    return deps.some(depId => {
      const dep = TASKS.find(t => t.id === depId);
      return dep && dep.status !== 'done';
    });
  };

  // Mini gantt: sort tasks by startDate
  const sortedTasks = [...tasks].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const minDate = sortedTasks.length > 0 ? new Date(sortedTasks[0].startDate + 'T12:00:00') : new Date(project.startDate + 'T12:00:00');
  const maxDate = new Date(project.endDate + 'T12:00:00');
  const totalDays = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));

  const getTaskBar = (task: Task) => {
    const start = new Date(task.startDate + 'T12:00:00');
    const end = new Date(task.endDate + 'T12:00:00');
    const left = Math.max(0, Math.ceil((start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
    const width = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    return {
      left: `${(left / totalDays) * 100}%`,
      width: `${Math.min(100 - (left / totalDays) * 100, (width / totalDays) * 100)}%`,
    };
  };

  const statusColor = {
    done: 'bg-green-500',
    inprogress: 'bg-blue-500',
    review: 'bg-amber-500',
    todo: 'bg-gray-300',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-3xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: client.color + '18', color: client.color }}
                >
                  {client.name}
                </span>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusCfg.color}`}>
                  {statusCfg.label}
                </span>
                {template && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium">
                    📋 {template.name}
                  </span>
                )}
              </div>
              <h2 className="font-bold text-gray-900 dark:text-white text-lg leading-snug">{project.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{project.description}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center">
              <X size={18} />
            </button>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 flex-wrap">
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              {dateRange}
            </div>
            {strategyName && (
              <div className="flex items-center gap-1">
                <Layers size={12} />
                {strategyName}
                {pillarName && <span className="text-gray-400">· {pillarName}</span>}
              </div>
            )}
            <div className="flex items-center gap-1">
              <BarChart3 size={12} />
              {project.progress}% complete
            </div>
          </div>
          <div className="mt-3">
            <ProgressBar
              value={project.progress}
              color={project.status === 'complete' ? 'bg-green-500' : project.status === 'on-hold' ? 'bg-amber-500' : 'bg-indigo-500'}
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-5 sm:px-6 py-5 space-y-6">
          {/* Mini Gantt */}
          {sortedTasks.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Timeline</h3>
              <div className="space-y-1.5">
                {sortedTasks.map(task => {
                  const bar = getTaskBar(task);
                  const blocked = isBlocked(task.id);
                  return (
                    <div key={task.id} className="flex items-center gap-3">
                      <div className="w-32 sm:w-40 text-xs text-gray-600 dark:text-gray-400 truncate flex-shrink-0 text-right">
                        {task.title.length > 20 ? task.title.slice(0, 20) + '…' : task.title}
                      </div>
                      <div className="flex-1 relative h-5 bg-gray-100 dark:bg-gray-800 rounded">
                        <div
                          className={`absolute top-0.5 h-4 rounded text-[10px] flex items-center px-1 text-white font-medium transition-all ${
                            blocked ? 'opacity-50 bg-gray-400' : statusColor[task.status]
                          }`}
                          style={{ left: bar.left, width: bar.width, minWidth: '4px' }}
                        />
                        {blocked && (
                          <div
                            className="absolute top-0 h-5 flex items-center"
                            style={{ left: bar.left }}
                          >
                            <Lock size={10} className="text-red-500 ml-0.5" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-0" style={{ marginLeft: '136px' }}>
                <span>{new Date(project.startDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span>{new Date(project.endDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          )}

          {/* Task list with dependencies */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Tasks ({tasks.length})</h3>
            <div className="space-y-2">
              {tasks.map(task => {
                const blocked = isBlocked(task.id);
                const blockedBy = (taskDepMap[task.id] || []).filter(depId => {
                  const dep = TASKS.find(t => t.id === depId);
                  return dep && dep.status !== 'done';
                }).map(depId => TASKS.find(t => t.id === depId)?.title || depId);
                const thisBlocks = (blocksMap[task.id] || []).map(bid => TASKS.find(t => t.id === bid)?.title || bid);
                const assignee = TEAM_MEMBERS.find(m => m.id === task.assigneeId);

                return (
                  <div
                    key={task.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                      blocked
                        ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className={`mt-0.5 flex-shrink-0 ${
                      task.status === 'done' ? 'text-green-500' :
                      task.status === 'review' ? 'text-amber-500' :
                      task.status === 'inprogress' ? 'text-blue-500' :
                      'text-gray-300'
                    }`}>
                      {blocked ? <Lock size={14} className="text-red-500" /> : <CheckCircle size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize ${
                          task.status === 'done' ? 'bg-green-100 text-green-700' :
                          task.status === 'review' ? 'bg-amber-100 text-amber-700' :
                          task.status === 'inprogress' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {task.status === 'inprogress' ? 'In Progress' : task.status}
                        </span>
                        {task.isMilestone && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-medium">Milestone</span>}
                      </div>
                      {blocked && blockedBy.length > 0 && (
                        <div className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                          <Lock size={10} />
                          Blocked by: {blockedBy.join(', ')}
                        </div>
                      )}
                      {thisBlocks.length > 0 && (
                        <div className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                          <ArrowRight size={10} />
                          Blocks: {thisBlocks.join(', ')}
                        </div>
                      )}
                    </div>
                    {assignee && (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                        style={{ backgroundColor: assignee.color }}
                        title={assignee.name}
                      >
                        {assignee.initials}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Workflow template steps */}
          {template && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Workflow: {template.name}
              </h3>
              <div className="space-y-1.5">
                {template.steps.map((step, idx) => (
                  <div key={step.id} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{step.title}</span>
                        <span className="text-[10px] text-gray-400">{step.defaultDurationDays}d · {step.assigneeRole}</span>
                      </div>
                      {step.dependsOn.length > 0 && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          Depends on: {step.dependsOn.map(depId => template.steps.find(s => s.id === depId)?.title || depId).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const client = CLIENTS.find(c => c.id === project.clientId)!;
  const tasks = TASKS.filter(t => project.taskIds.includes(t.id));
  const template = project.workflowTemplateId ? WORKFLOW_TEMPLATES.find(wt => wt.id === project.workflowTemplateId) : null;
  const statusCfg = STATUS_CONFIG[project.status];

  // Find pillar name
  let pillarName = '';
  if (project.strategyId && project.pillarId) {
    const strat = STRATEGIES.find(s => s.id === project.strategyId);
    if (strat) {
      const pillar = strat.pillars.find(p => p.id === project.pillarId);
      if (pillar) pillarName = pillar.name;
    }
  }

  const endDate = new Date(project.endDate + 'T12:00:00');
  const isOverdue = endDate < new Date() && project.status !== 'complete';

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all cursor-pointer group"
    >
      {/* Client + status */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: client.color + '18', color: client.color }}
          >
            {client.name}
          </span>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusCfg.color}`}>
            {statusCfg.label}
          </span>
          {isOverdue && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
              Overdue
            </span>
          )}
        </div>
        <ChevronRight size={14} className="text-gray-300 group-hover:text-indigo-400 transition-colors flex-shrink-0 mt-0.5" />
      </div>

      {/* Title */}
      <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
        {project.name}
      </h3>
      <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{project.description}</p>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">{project.progress}%</span>
        </div>
        <ProgressBar
          value={project.progress}
          color={project.status === 'complete' ? 'bg-green-500' : project.status === 'on-hold' ? 'bg-amber-400' : 'bg-indigo-500'}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
        <div className="flex items-center gap-1">
          <Calendar size={11} />
          {new Date(project.startDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          {' – '}
          {new Date(project.endDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle size={11} />
          {tasks.length} tasks
        </div>
        {pillarName && (
          <div className="flex items-center gap-1">
            <Tag size={11} />
            <span className="truncate max-w-[100px]">{pillarName}</span>
          </div>
        )}
        {template && (
          <div className="ml-auto text-indigo-400 font-medium truncate max-w-[120px]">
            📋 {template.category}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const filtered = useMemo(() => {
    return PROJECTS.filter(p => {
      const matchClient = selectedClient === 'all' || p.clientId === selectedClient;
      const matchStatus = selectedStatus === 'all' || p.status === selectedStatus;
      const matchSearch = !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      return matchClient && matchStatus && matchSearch;
    });
  }, [selectedClient, selectedStatus, search]);

  const stats = useMemo(() => ({
    total: PROJECTS.length,
    active: PROJECTS.filter(p => p.status === 'active').length,
    complete: PROJECTS.filter(p => p.status === 'complete').length,
    planning: PROJECTS.filter(p => p.status === 'planning').length,
  }), []);

  return (
    <div className="pt-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopBar title="Projects" subtitle="Manage client projects and track progress" />

      <div className="p-4 sm:p-6 lg:p-8">
        {selectedProject && (
          <ProjectDetailModal project={selectedProject} onClose={() => setSelectedProject(null)} />
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            { label: 'Total Projects', value: stats.total, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: FolderOpen },
            { label: 'Active', value: stats.active, color: 'text-blue-600', bg: 'bg-blue-50', icon: CheckCircle },
            { label: 'Planning', value: stats.planning, color: 'text-gray-600', bg: 'bg-gray-100', icon: Clock },
            { label: 'Complete', value: stats.complete, color: 'text-green-600', bg: 'bg-green-50', icon: AlertCircle },
          ].map(({ label, value, color, bg, icon: Icon }) => (
            <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon size={15} />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{value}</div>
                  <div className="text-xs text-gray-500">{label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
            />
          </div>

          {/* Client filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setSelectedClient('all')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedClient === 'all' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
              }`}
            >
              All Clients
            </button>
            {CLIENTS.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedClient(c.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedClient === c.id
                    ? 'text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                }`}
                style={selectedClient === c.id ? { backgroundColor: c.color } : {}}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5 ml-auto">
            {(['all', 'active', 'planning', 'complete', 'on-hold'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSelectedStatus(s)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedStatus === s
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                }`}
              >
                {s === 'all' ? 'All Status' : STATUS_CONFIG[s]?.label || s}
              </button>
            ))}
          </div>
        </div>

        {/* Projects grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(project => (
              <ProjectCard key={project.id} project={project} onClick={() => setSelectedProject(project)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <FolderOpen size={40} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">No projects found</p>
            <p className="text-sm mt-1">Adjust your filters to see more projects</p>
          </div>
        )}
      </div>
    </div>
  );
}
