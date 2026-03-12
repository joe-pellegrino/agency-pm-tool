'use client';

import { useState, useMemo } from 'react';
import {
  TASK_TEMPLATES, TEAM_MEMBERS, PRIORITY_COLORS, PRIORITY_DOT, TaskTemplate,
  WORKFLOW_TEMPLATES, CLIENTS, WorkflowTemplate, WorkflowStep,
} from '@/lib/data';
import {
  LayoutTemplate, Clock, Users, Calendar, Tag, ChevronRight, Plus, Search, X,
  ArrowRight, Zap, GitBranch,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';

const TYPE_COLORS: Record<string, string> = {
  social: 'bg-pink-100 text-pink-700',
  ad: 'bg-orange-100 text-orange-700',
  blog: 'bg-purple-100 text-purple-700',
  report: 'bg-blue-100 text-blue-700',
  meeting: 'bg-indigo-100 text-indigo-700',
  design: 'bg-teal-100 text-teal-700',
  other: 'bg-gray-100 text-gray-600',
};

const TYPE_ICONS: Record<string, string> = {
  social: '📱',
  ad: '📣',
  blog: '✍️',
  report: '📊',
  meeting: '🤝',
  design: '🎨',
  other: '📋',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Paid Media': 'bg-orange-100 text-orange-700',
  'Web Dev': 'bg-blue-100 text-blue-700',
  'Social Media': 'bg-pink-100 text-pink-700',
  'Onboarding': 'bg-indigo-100 text-indigo-700',
  'SEO': 'bg-green-100 text-green-700',
  'Strategy': 'bg-purple-100 text-purple-700',
};

const TASK_CATEGORIES = ['All', 'Reporting', 'Content', 'Paid Media', 'Local SEO', 'Client Relations', 'Reputation', 'Email Marketing'];

// =========================================================
// TASK TEMPLATE COMPONENTS (existing)
// =========================================================

function TemplateDetailModal({ template, onClose }: { template: TaskTemplate; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 sm:px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
              {TYPE_ICONS[template.type || 'other']}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">{template.title}</h2>
              <span className="text-xs text-gray-400">{template.category}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 sm:px-6 py-5 space-y-4 sm:space-y-5">
          <p className="text-sm text-gray-600 dark:text-gray-300">{template.description}</p>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 sm:p-4">
              <div className="text-xs text-gray-500 mb-1">Default Priority</div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded flex items-center gap-1 w-fit ${PRIORITY_COLORS[template.defaultPriority]}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[template.defaultPriority]}`} />
                {template.defaultPriority}
              </span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 sm:p-4">
              <div className="text-xs text-gray-500 mb-1">Duration</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                <Clock size={13} className="text-gray-400" />
                {template.estimatedDuration}d
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 sm:p-4">
              <div className="text-xs text-gray-500 mb-1">Assignee Role</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                <Users size={13} className="text-gray-400" />
                <span className="truncate">{template.defaultAssigneeRole}</span>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 sm:p-4">
              <div className="text-xs text-gray-500 mb-1">Schedule Rule</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                <Calendar size={13} className="text-gray-400" />
                <span className="truncate">{template.dueRule}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors min-h-[44px]">
              Create Automation
            </button>
            <button onClick={onClose} className="px-4 py-3 text-gray-600 hover:text-gray-800 dark:text-gray-400 text-sm transition-colors min-h-[44px]">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskTemplateCard({ template, onClick }: { template: TaskTemplate; onClick: () => void }) {
  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center justify-center text-xl group-hover:bg-indigo-50 transition-colors flex-shrink-0">
          {TYPE_ICONS[template.type || 'other']}
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[template.type || 'other']}`}>
            {template.type}
          </span>
          <ChevronRight size={14} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />
        </div>
      </div>
      <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
        {template.title}
      </h3>
      <p className="text-xs text-gray-500 leading-relaxed mb-3 sm:mb-4 line-clamp-2">{template.description}</p>
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <Clock size={11} />
          {template.estimatedDuration}d
        </div>
        <div className="hidden sm:flex items-center gap-1">
          <Calendar size={11} />
          {template.dueRule.split(' ').slice(0, 3).join(' ')}
        </div>
        <div className="ml-auto">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${PRIORITY_COLORS[template.defaultPriority]}`}>
            {template.defaultPriority}
          </span>
        </div>
      </div>
    </div>
  );
}

// =========================================================
// WORKFLOW TEMPLATE COMPONENTS (new)
// =========================================================

function WorkflowStepFlow({ steps }: { steps: WorkflowStep[] }) {
  // Build a simple level-based layout for the flow diagram
  const levels: number[] = new Array(steps.length).fill(0);
  const stepMap: Record<string, WorkflowStep> = {};
  steps.forEach(s => { stepMap[s.id] = s; });

  // Topological sort to assign levels
  const getLevels = () => {
    const levelMap: Record<string, number> = {};
    steps.forEach(s => { levelMap[s.id] = 0; });
    let changed = true;
    while (changed) {
      changed = false;
      steps.forEach(s => {
        s.dependsOn.forEach(depId => {
          if (levelMap[depId] !== undefined && levelMap[s.id] <= levelMap[depId]) {
            levelMap[s.id] = levelMap[depId] + 1;
            changed = true;
          }
        });
      });
    }
    return levelMap;
  };

  const levelMap = getLevels();
  const maxLevel = Math.max(...Object.values(levelMap));

  // Group steps by level
  const byLevel: Record<number, WorkflowStep[]> = {};
  steps.forEach(s => {
    const lv = levelMap[s.id] || 0;
    if (!byLevel[lv]) byLevel[lv] = [];
    byLevel[lv].push(s);
  });

  return (
    <div className="overflow-x-auto">
      <div className="flex items-start gap-3 min-w-max py-2">
        {Array.from({ length: maxLevel + 1 }, (_, i) => i).map((level, idx) => (
          <div key={level} className="flex items-center gap-3">
            <div className="flex flex-col gap-2">
              {(byLevel[level] || []).map(step => (
                <div
                  key={step.id}
                  className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 min-w-[120px] max-w-[160px]"
                >
                  <div className="text-xs font-semibold text-gray-800 dark:text-white leading-tight">{step.title}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{step.defaultDurationDays}d · {step.assigneeRole.split(' ')[0]}</div>
                </div>
              ))}
            </div>
            {idx < maxLevel && (
              <ArrowRight size={16} className="text-gray-300 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function UseTemplateModal({ template, onClose }: { template: WorkflowTemplate; onClose: () => void }) {
  const [selectedClient, setSelectedClient] = useState('');
  const [startDate, setStartDate] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 sm:px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 flex items-start justify-between">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white text-lg">Use Template</h2>
            <p className="text-sm text-gray-500 mt-0.5">{template.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 sm:px-6 py-5 space-y-5">
          <p className="text-sm text-gray-600 dark:text-gray-300">{template.description}</p>

          {/* Config */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Client</label>
              <select
                value={selectedClient}
                onChange={e => setSelectedClient(e.target.value)}
                className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a client...</option>
                {CLIENTS.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Step flow preview */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Workflow Steps</div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <WorkflowStepFlow steps={template.steps} />
            </div>
          </div>

          {/* Steps list detail */}
          <div className="space-y-2">
            {template.steps.map((step, idx) => (
              <div key={step.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-800 dark:text-white">{step.title}</span>
                    <span className="text-[10px] text-gray-500">{step.defaultDurationDays}d</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded font-medium">{step.assigneeRole}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{step.description}</p>
                  {step.dependsOn.length > 0 && (
                    <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                      <ArrowRight size={9} />
                      Depends on: {step.dependsOn.map(depId => template.steps.find(s => s.id === depId)?.title || depId).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 flex gap-3">
          <button
            disabled={!selectedClient || !startDate}
            className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center gap-2"
          >
            <Zap size={15} />
            Create Project from Template
          </button>
          <button onClick={onClose} className="px-4 py-3 text-gray-600 hover:text-gray-800 dark:text-gray-400 text-sm transition-colors min-h-[44px]">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function WorkflowTemplateDetailModal({ template, onClose, onUse }: { template: WorkflowTemplate; onClose: () => void; onUse: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 sm:px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[template.category] || 'bg-gray-100 text-gray-600'}`}>
                {template.category}
              </span>
              <span className="text-xs text-gray-400">{template.defaultDurationDays} days · {template.steps.length} steps</span>
            </div>
            <h2 className="font-bold text-gray-900 dark:text-white text-lg">{template.name}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 sm:px-6 py-5 space-y-5">
          <p className="text-sm text-gray-600 dark:text-gray-300">{template.description}</p>

          {/* Flow diagram */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <GitBranch size={12} />
              Step Flow
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <WorkflowStepFlow steps={template.steps} />
            </div>
          </div>

          {/* Step detail */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">All Steps</div>
            <div className="space-y-2">
              {template.steps.map((step, idx) => (
                <div key={step.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-sm font-semibold text-gray-800 dark:text-white">{step.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{step.defaultDurationDays}d</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded font-medium">{step.assigneeRole}</span>
                    </div>
                    <p className="text-xs text-gray-500">{step.description}</p>
                    {step.dependsOn.length > 0 && (
                      <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        <ArrowRight size={9} />
                        After: {step.dependsOn.map(depId => template.steps.find(s => s.id === depId)?.title || depId).join(' & ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 flex gap-3">
          <button
            onClick={onUse}
            className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center gap-2"
          >
            <Zap size={15} />
            Use This Template
          </button>
          <button onClick={onClose} className="px-4 py-3 text-gray-600 hover:text-gray-800 dark:text-gray-400 text-sm transition-colors min-h-[44px]">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function WorkflowTemplateCard({ template, onClick }: { template: WorkflowTemplate; onClick: () => void }) {
  const parallelSteps = template.steps.filter(s => s.dependsOn.length > 0).some(s => {
    return template.steps.filter(other => other.id !== s.id && other.dependsOn.length > 0 && 
      other.dependsOn.some(d => s.dependsOn.includes(d))).length > 0;
  });

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[template.category] || 'bg-gray-100 text-gray-600'}`}>
            {template.category}
          </span>
          {parallelSteps && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 font-medium flex items-center gap-0.5">
              <GitBranch size={9} />
              Parallel
            </span>
          )}
        </div>
        <ChevronRight size={14} className="text-gray-300 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
      </div>

      <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
        {template.name}
      </h3>
      <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">{template.description}</p>

      {/* Mini step flow */}
      <div className="flex items-center gap-1 mb-4 overflow-hidden">
        {template.steps.slice(0, 6).map((step, idx) => (
          <div key={step.id} className="flex items-center gap-1">
            <div
              className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[9px] font-bold flex-shrink-0"
              title={step.title}
            >
              {idx + 1}
            </div>
            {idx < Math.min(template.steps.length, 6) - 1 && (
              <div className="w-3 h-px bg-gray-200 flex-shrink-0" />
            )}
          </div>
        ))}
        {template.steps.length > 6 && (
          <span className="text-[10px] text-gray-400 ml-1">+{template.steps.length - 6}</span>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <Clock size={11} />
          {template.defaultDurationDays}d
        </div>
        <div className="flex items-center gap-1">
          <GitBranch size={11} />
          {template.steps.length} steps
        </div>
        <div className="ml-auto">
          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 font-medium">Use Template</span>
        </div>
      </div>
    </div>
  );
}

// =========================================================
// MAIN PAGE
// =========================================================

export default function TemplatesPage() {
  const [activeTab, setActiveTab] = useState<'workflow' | 'task'>('workflow');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedTaskTemplate, setSelectedTaskTemplate] = useState<TaskTemplate | null>(null);
  const [selectedWorkflowTemplate, setSelectedWorkflowTemplate] = useState<WorkflowTemplate | null>(null);
  const [useTemplate, setUseTemplate] = useState<WorkflowTemplate | null>(null);

  // Task template filtering
  const filteredTasks = TASK_TEMPLATES.filter(t => {
    const matchCat = selectedCategory === 'All' || t.category === selectedCategory;
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const groupedTasks = TASK_CATEGORIES.slice(1).reduce((acc, cat) => {
    const items = filteredTasks.filter(t => t.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {} as Record<string, TaskTemplate[]>);

  // Workflow template filtering
  const workflowCategories = ['All', ...new Set(WORKFLOW_TEMPLATES.map(wt => wt.category))];
  const filteredWorkflows = WORKFLOW_TEMPLATES.filter(wt => {
    const matchCat = selectedCategory === 'All' || wt.category === selectedCategory;
    const matchSearch = !search || wt.name.toLowerCase().includes(search.toLowerCase()) || wt.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleTabChange = (tab: 'workflow' | 'task') => {
    setActiveTab(tab);
    setSelectedCategory('All');
    setSearch('');
  };

  return (
    <div className="pt-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopBar title="Templates" subtitle="Workflow templates and reusable task templates" />

      <div className="p-4 sm:p-6 lg:p-8">
        {selectedTaskTemplate && (
          <TemplateDetailModal template={selectedTaskTemplate} onClose={() => setSelectedTaskTemplate(null)} />
        )}
        {selectedWorkflowTemplate && !useTemplate && (
          <WorkflowTemplateDetailModal
            template={selectedWorkflowTemplate}
            onClose={() => setSelectedWorkflowTemplate(null)}
            onUse={() => { setUseTemplate(selectedWorkflowTemplate); setSelectedWorkflowTemplate(null); }}
          />
        )}
        {useTemplate && (
          <UseTemplateModal template={useTemplate} onClose={() => setUseTemplate(null)} />
        )}

        {/* Tab switcher */}
        <div className="flex items-center gap-2 mb-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1.5 w-fit">
          <button
            onClick={() => handleTabChange('workflow')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px] ${
              activeTab === 'workflow'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <GitBranch size={14} />
            Workflow Templates
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${activeTab === 'workflow' ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
              {WORKFLOW_TEMPLATES.length}
            </span>
          </button>
          <button
            onClick={() => handleTabChange('task')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px] ${
              activeTab === 'task'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <LayoutTemplate size={14} />
            Task Templates
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${activeTab === 'task' ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
              {TASK_TEMPLATES.length}
            </span>
          </button>
        </div>

        {/* Search + New */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${activeTab === 'workflow' ? 'workflow' : 'task'} templates...`}
              className="pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors min-h-[44px]">
            <Plus size={15} />
            <span className="hidden sm:inline">New Template</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {(activeTab === 'workflow' ? workflowCategories : TASK_CATEGORIES).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px] ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Stats */}
        {activeTab === 'workflow' ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {[
              { label: 'Workflow Templates', value: WORKFLOW_TEMPLATES.length, icon: GitBranch, color: 'text-indigo-600' },
              { label: 'Categories', value: workflowCategories.length - 1, icon: Tag, color: 'text-purple-600' },
              { label: 'Total Steps', value: WORKFLOW_TEMPLATES.reduce((s, t) => s + t.steps.length, 0), icon: LayoutTemplate, color: 'text-blue-600' },
              { label: 'Avg Duration', value: `${Math.round(WORKFLOW_TEMPLATES.reduce((s, t) => s + t.defaultDurationDays, 0) / WORKFLOW_TEMPLATES.length)}d`, icon: Clock, color: 'text-green-600' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 ${color}`}>
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
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {[
              { label: 'Total Templates', value: TASK_TEMPLATES.length, icon: LayoutTemplate, color: 'text-indigo-600' },
              { label: 'Categories', value: TASK_CATEGORIES.length - 1, icon: Tag, color: 'text-purple-600' },
              { label: 'Avg Duration', value: `${Math.round(TASK_TEMPLATES.reduce((s, t) => s + t.estimatedDuration, 0) / TASK_TEMPLATES.length)}d`, icon: Clock, color: 'text-blue-600' },
              { label: 'Team Roles', value: [...new Set(TASK_TEMPLATES.map(t => t.defaultAssigneeRole))].length, icon: Users, color: 'text-green-600' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 ${color}`}>
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
        )}

        {/* Content */}
        {activeTab === 'workflow' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredWorkflows.map(wt => (
              <WorkflowTemplateCard key={wt.id} template={wt} onClick={() => setSelectedWorkflowTemplate(wt)} />
            ))}
            {filteredWorkflows.length === 0 && (
              <div className="col-span-full text-center py-16 text-gray-400">
                <GitBranch size={40} className="mx-auto mb-4 opacity-30" />
                <p className="font-medium">No workflow templates found</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {selectedCategory === 'All' ? (
              Object.entries(groupedTasks).map(([cat, templates]) => (
                <div key={cat} className="mb-6 sm:mb-8">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-2">
                    <span>{cat}</span>
                    <span className="text-gray-300 font-normal">({templates.length})</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {templates.map(t => (
                      <TaskTemplateCard key={t.id} template={t} onClick={() => setSelectedTaskTemplate(t)} />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredTasks.map(t => (
                  <TaskTemplateCard key={t.id} template={t} onClick={() => setSelectedTaskTemplate(t)} />
                ))}
              </div>
            )}
            {filteredTasks.length === 0 && (
              <div className="text-center py-16 sm:py-20 text-gray-400">
                <LayoutTemplate size={40} className="mx-auto mb-4 opacity-30" />
                <p className="font-medium">No templates found</p>
                <p className="text-sm mt-1">Try adjusting your search or category filter</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
