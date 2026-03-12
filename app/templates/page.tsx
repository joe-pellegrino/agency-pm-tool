'use client';

import { useState } from 'react';
import { TASK_TEMPLATES, TEAM_MEMBERS, PRIORITY_COLORS, PRIORITY_DOT, TaskTemplate } from '@/lib/data';
import { LayoutTemplate, Clock, Users, Calendar, Tag, ChevronRight, Plus, Search, X } from 'lucide-react';
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

const CATEGORIES = ['All', 'Reporting', 'Content', 'Paid Media', 'Local SEO', 'Client Relations', 'Reputation', 'Email Marketing'];

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
            <button
              onClick={onClose}
              className="px-4 py-3 text-gray-600 hover:text-gray-800 dark:text-gray-400 text-sm transition-colors min-h-[44px]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplateCard({ template, onClick }: { template: TaskTemplate; onClick: () => void }) {
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

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);

  const filtered = TASK_TEMPLATES.filter(t => {
    const matchCat = selectedCategory === 'All' || t.category === selectedCategory;
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const grouped = CATEGORIES.slice(1).reduce((acc, cat) => {
    const items = filtered.filter(t => t.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {} as Record<string, TaskTemplate[]>);

  return (
    <div className="pt-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopBar title="Templates" subtitle="Reusable task templates for recurring agency work" />

      <div className="p-4 sm:p-6 lg:p-8">
        {selectedTemplate && (
          <TemplateDetailModal template={selectedTemplate} onClose={() => setSelectedTemplate(null)} />
        )}

        {/* Header actions */}
        <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors min-h-[44px]">
            <Plus size={15} />
            <span className="hidden sm:inline">New Template</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>

        {/* Category tabs — scrollable */}
        <div className="flex items-center gap-2 mb-6 sm:mb-8 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {CATEGORIES.map(cat => (
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

        {/* Stats bar — 2 cols on mobile, 4 on lg */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            { label: 'Total Templates', value: TASK_TEMPLATES.length, icon: LayoutTemplate, color: 'text-indigo-600' },
            { label: 'Categories', value: CATEGORIES.length - 1, icon: Tag, color: 'text-purple-600' },
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

        {/* Templates grid — 1 col on mobile, 2 on sm, 3 on lg */}
        {selectedCategory === 'All' ? (
          Object.entries(grouped).map(([cat, templates]) => (
            <div key={cat} className="mb-6 sm:mb-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-2">
                <span>{cat}</span>
                <span className="text-gray-300 font-normal">({templates.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {templates.map(t => (
                  <TemplateCard key={t.id} template={t} onClick={() => setSelectedTemplate(t)} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filtered.map(t => (
              <TemplateCard key={t.id} template={t} onClick={() => setSelectedTemplate(t)} />
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16 sm:py-20 text-gray-400">
            <LayoutTemplate size={40} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">No templates found</p>
            <p className="text-sm mt-1">Try adjusting your search or category filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
