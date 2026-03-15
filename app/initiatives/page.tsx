'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogPanel, DialogBackdrop } from '@headlessui/react';
import { Project, Task, PRIORITY_COLORS } from '@/lib/data';
import { useAppData } from '@/lib/contexts/AppDataContext';
import TopBar from '@/components/layout/TopBar';
import {
  FolderOpen, Filter, Search, ChevronRight, X, Calendar, CheckCircle,
  Clock, AlertCircle, PauseCircle, ArrowRight, Tag, Lock, Unlock,
  BarChart3, Users, Layers, Plus, Pencil, Archive, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import ProjectModal from '@/components/projects/ProjectModal';
import TaskModal from '@/components/tasks/TaskModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { archiveProject, updateTaskStatus } from '@/lib/actions';

const STATUS_CONFIG = {
  planning: { label: 'Planning', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400', icon: Clock },
  active: { label: 'Active', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', icon: CheckCircle },
  complete: { label: 'Complete', color: 'bg-green-100 text-green-700', dot: 'bg-green-500', icon: CheckCircle },
  'on-hold': { label: 'On Hold', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', icon: PauseCircle },
} as const;

function ProgressBar({ value, color = 'bg-[#3B5BDB]' }: { value: number; color?: string }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
      <div
        className={`h-1.5 rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

function ProjectDetailModal({ project, onClose, onEdit, onAddTask }: { project: Project; onClose: () => void; onEdit?: () => void; onAddTask?: () => void }) {
  const { CLIENTS = [], TASKS = [], WORKFLOW_TEMPLATES = [], STRATEGIES = [], TEAM_MEMBERS = [], CLIENT_SERVICES = [], SERVICES = [] } = useAppData();
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
    <Dialog open={true} onClose={onClose} className="relative z-50">
      {/* Backdrop with fade transition */}
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
      />

      {/* Dialog positioning container */}
      <div className="fixed inset-0 flex items-end sm:items-center justify-center overflow-y-auto">
        {/* Panel with scale + fade animation */}
        <DialogPanel
          transition
          className="relative transform overflow-hidden rounded-t-lg sm:rounded-lg bg-white dark:bg-gray-900 text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-3xl data-closed:sm:translate-y-0 data-closed:sm:scale-95 max-h-[92vh] flex flex-col"
        >
        {/* Header */}
        <div className="px-5 sm:px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: '#000000', color: '#ffffff' }}
                >
                  {client.name}
                </span>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusCfg.color}`}>
                  {statusCfg.label}
                </span>
                {template && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#3B5BDB] font-medium">
                    {template.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="font-bold text-gray-900 dark:text-white text-lg leading-snug">{project.name}</h2>
                {project.type && project.type !== 'Project' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 font-medium">{project.type}</span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">{project.description}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {onAddTask && (
                <button
                  onClick={onAddTask}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#3B5BDB] hover:bg-[#3B5BDB] rounded-lg transition-colors"
                >
                  <Plus size={12} />
                  Add Task
                </button>
              )}
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#3B5BDB] hover:bg-[#EEF2FF] rounded-lg transition-colors"
                >
                  <Pencil size={12} />
                  Edit
                </button>
              )}
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X size={18} />
              </button>
            </div>
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
              color={project.status === 'complete' ? 'bg-green-500' : project.status === 'on-hold' ? 'bg-amber-500' : 'bg-[#3B5BDB]'}
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
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tasks ({tasks.length})</h3>
              {onAddTask && (
                <button
                  onClick={onAddTask}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#3B5BDB] hover:bg-[#EEF2FF] px-2 py-1 rounded-lg transition-colors"
                >
                  <Plus size={11} />
                  Add Task
                </button>
              )}
            </div>
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
                    <div className="w-6 h-6 rounded-full bg-[#E0E7FF] text-[#3B5BDB] flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
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
        </DialogPanel>
      </div>
    </Dialog>
  );
}

function ProjectCard({ project, onClick, onEdit, onArchive }: { project: Project; onClick: () => void; onEdit?: (p: Project) => void; onArchive?: (id: string) => void }) {
  const { CLIENTS = [], TASKS = [], WORKFLOW_TEMPLATES = [], STRATEGIES = [], TEAM_MEMBERS = [] } = useAppData();
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
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 hover:shadow-md hover:border-[#C7D2FE] dark:hover:border-indigo-700 transition-all cursor-pointer group"
    >
      {/* Client + status */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: '#000000', color: '#ffffff' }}
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
      <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1.5 group-hover:text-[#3B5BDB] dark:group-hover:text-indigo-400 transition-colors leading-snug">
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
          color={project.status === 'complete' ? 'bg-green-500' : project.status === 'on-hold' ? 'bg-amber-400' : 'bg-[#3B5BDB]'}
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
        <div className="ml-auto flex items-center gap-1">
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(project); }}
              className="p-1.5 text-gray-400 hover:text-[#3B5BDB] hover:bg-[#EEF2FF] rounded-lg transition-colors"
              title="Edit initiative"
            >
              <Pencil size={12} />
            </button>
          )}
          {onArchive && (
            <button
              onClick={(e) => { e.stopPropagation(); onArchive(project.id); }}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Archive initiative"
            >
              <Archive size={12} />
            </button>
          )}
          {template && (
            <span className="text-indigo-400 font-medium truncate max-w-[120px]">
              {template.category}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const { PROJECTS = [], CLIENTS = [], TASKS = [], STRATEGIES = [], WORKFLOW_TEMPLATES = [], TEAM_MEMBERS = [], CLIENT_SERVICES = [], SERVICES = [] } = useAppData();
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [addTaskForProject, setAddTaskForProject] = useState<Project | null>(null);
  const [, startTransition] = useTransition();
  const { refresh } = useAppData();

  // Map projectId → serviceId via CLIENT_SERVICES
  const projectServiceMap = useMemo(() => {
    const map: Record<string, string> = {};
    CLIENT_SERVICES.forEach(cs => {
      cs.linkedProjects.forEach(pid => {
        map[pid] = cs.serviceId;
      });
    });
    return map;
  }, [CLIENT_SERVICES]);

  const filtered = useMemo(() => {
    return PROJECTS.filter(p => {
      const matchClient = selectedClient === 'all' || p.clientId === selectedClient;
      const matchStatus = selectedStatus === 'all' || p.status === selectedStatus;
      const matchService = selectedService === 'all' || projectServiceMap[p.id] === selectedService;
      const matchSearch = !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      return matchClient && matchStatus && matchService && matchSearch;
    });
  }, [selectedClient, selectedStatus, selectedService, search, projectServiceMap, PROJECTS]);

  const stats = useMemo(() => ({
    total: PROJECTS.length,
    active: PROJECTS.filter(p => p.status === 'active').length,
    complete: PROJECTS.filter(p => p.status === 'complete').length,
    planning: PROJECTS.filter(p => p.status === 'planning').length,
  }), [PROJECTS]);

  const handleArchive = () => {
    if (!archiveId) return;
    const id = archiveId;
    setArchiveId(null);
    startTransition(async () => {
      try {
        await archiveProject(id);
        toast.success('Project archived');
        refresh?.();
      } catch (err) {
        toast.error('Failed: ' + (err as Error).message);
      }
    });
  };

  return (
    <div style={{ backgroundColor: 'var(--color-bg-page)', minHeight: '100vh' }}>
      <TopBar />

      {(showNewProject || editProject) && (
        <ProjectModal project={editProject || undefined} onClose={() => { setShowNewProject(false); setEditProject(null); refresh?.(); }} />
      )}
      {addTaskForProject && (
        <TaskModal
          defaultProjectId={addTaskForProject.id}
          defaultStatus="todo"
          onClose={() => setAddTaskForProject(null)}
          onSuccess={() => { setAddTaskForProject(null); refresh?.(); }}
        />
      )}
      {archiveId && (
        <ConfirmDialog
          title="Archive Initiative"
          message="Archive this project? It will be hidden from all views."
          confirmLabel="Archive"
          destructive
          onConfirm={handleArchive}
          onCancel={() => setArchiveId(null)}
        />
      )}

      <div style={{ padding: '24px 32px' }}>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage client projects and track progress</p>
        </div>
        {selectedProject && !editProject && !archiveId && !addTaskForProject && (
          <ProjectDetailModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
            onEdit={() => { setEditProject(selectedProject); }}
            onAddTask={() => { setAddTaskForProject(selectedProject); }}
          />
        )}

        {/* Header with New button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowNewProject(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#3B5BDB] hover:bg-[#3B5BDB] text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={14} />
            New Initiative
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            { label: 'Total Initiatives', value: stats.total, color: 'text-[#3B5BDB]', bg: 'bg-[#EEF2FF]', icon: FolderOpen },
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
              placeholder="Search initiatives..."
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] w-48"
            />
          </div>

          {/* Client filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setSelectedClient('all')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedClient === 'all' ? 'bg-[#3B5BDB] text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
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

          {/* Service filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setSelectedService('all')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedService === 'all' ? 'bg-[#3B5BDB] text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
              }`}
            >
              All Services
            </button>
            {SERVICES.map(svc => (
              <button
                key={svc.id}
                onClick={() => setSelectedService(svc.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedService === svc.id ? 'bg-[#3B5BDB] text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                }`}
              >
                {svc.name}
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
                    ? 'bg-[#3B5BDB] text-white'
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
              <ProjectCard key={project.id} project={project} onClick={() => router.push(`/initiatives/${project.id}`)} onEdit={setEditProject} onArchive={setArchiveId} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <FolderOpen size={40} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">No initiatives found</p>
            <p className="text-sm mt-1">Adjust your filters to see more projects</p>
          </div>
        )}
      </div>
    </div>
  );
}
