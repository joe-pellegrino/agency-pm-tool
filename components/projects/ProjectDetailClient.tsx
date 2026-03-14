'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock, CheckSquare, Users, Pencil, Plus, ChevronLeft,
  Trash2, Download, Upload, X, Check, List, LayoutGrid,
  Calendar, AlertCircle, DollarSign, TrendingUp, Activity,
  FileText, Settings, BarChart3, UserPlus, Filter,
  CheckCircle, RefreshCw, ImageIcon, Video, Paperclip, Archive,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectDetail } from '@/lib/actions-projects';
import {
  getProjectMembers, getProjectTasks, getProjectBudget,
  getProjectExpenses, getProjectActivity, getProjectAssets,
  updateProject, updateProjectBudget, createProjectExpense,
  deleteProjectExpense, addProjectMember, removeProjectMember,
  getAllTeamMembers, createProjectTask, deleteProjectAsset,
  archiveProjectById,
} from '@/lib/actions-projects';
import TaskModal from '@/components/tasks/TaskModal';

// ─── Types ───────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'team' | 'members' | 'budget' | 'activity' | 'tasks' | 'files' | 'settings';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'team', label: 'Team' },
  { id: 'members', label: 'Members' },
  { id: 'budget', label: 'Budget' },
  { id: 'activity', label: 'Activity' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'files', label: 'Files' },
  { id: 'settings', label: 'Settings' },
];

const ICON_COLORS = ['var(--color-primary)', '#2BB673', '#F59F00', '#E03131', '#7C3AED', '#0891B2', '#D97706', '#374151'];

function getActionIcon(actionType: string) {
  switch (actionType) {
    case 'task_created': return <FileText size={13} />;
    case 'task_completed': return <CheckCircle size={13} />;
    case 'task_status_changed': return <RefreshCw size={13} />;
    case 'expense_added':
    case 'expense_deleted': return <DollarSign size={13} />;
    case 'budget_updated': return <BarChart3 size={13} />;
    case 'member_added':
    case 'member_removed': return <Users size={13} />;
    case 'file_uploaded': return <Upload size={13} />;
    case 'file_deleted': return <Trash2 size={13} />;
    case 'settings_updated': return <Settings size={13} />;
    default: return <Activity size={13} />;
  }
}

const STATUS_COLORS: Record<string, string> = {
  todo: 'bg-gray-100 text-gray-600',
  inprogress: 'bg-blue-100 text-blue-700',
  review: 'bg-amber-100 text-amber-700',
  done: 'bg-green-100 text-green-700',
};

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  inprogress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

const PRIORITY_COLORS: Record<string, string> = {
  Low: 'bg-gray-100 text-gray-500',
  Medium: 'bg-blue-100 text-blue-600',
  High: 'bg-orange-100 text-orange-600',
  Urgent: 'bg-red-100 text-red-700',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatCurrency(amount: number) {
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}k`;
  return `$${amount.toLocaleString()}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function groupActivitiesByDate<T extends { id: string; createdAt: string }>(activities: T[]) {
  const groups: Record<string, T[]> = {};
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  activities.forEach(a => {
    const d = new Date(a.createdAt);
    const key = d.toDateString() === today ? 'TODAY' : d.toDateString() === yesterday ? 'YESTERDAY' : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  });
  return groups;
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, percentage, color = 'var(--color-primary)', note }: {
  label: string; value: string; percentage: number; color?: string; note?: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-[var(--color-border)] p-5" style={{ boxShadow: '0 1px 3px rgba(30,42,58,0.06)' }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold text-[#8896A6] uppercase tracking-wide">{label}</span>
        <span className="text-[13px] text-[#8896A6]">{note || `${Math.round(percentage)}%`}</span>
      </div>
      <div className="text-[28px] font-bold text-[#1E2A3A] mb-3">{value}</div>
      <div className="h-1 rounded-full bg-[var(--color-border)]">
        <div className="h-1 rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, percentage))}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ─── Avatar ──────────────────────────────────────────────────────────────────
function Avatar({ initials, color, size = 32, name }: { initials: string; color: string; size?: number; name?: string }) {
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold border-2 border-white flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.33 }}
      title={name}
    >
      {initials}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, color = 'var(--color-primary)' }: { value: number; color?: string }) {
  return (
    <div className="w-full h-1 bg-[var(--color-border)] rounded-full overflow-hidden">
      <div className="h-1 rounded-full" style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProjectDetailClient({ project: initialProject }: { project: ProjectDetail }) {
  const router = useRouter();
  const [project, setProject] = useState(initialProject);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [, startTransition] = useTransition();
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [pendingColor, setPendingColor] = useState(project.iconColor);
  const [showCreateTask, setShowCreateTask] = useState(false);

  // Tab data
  const [members, setMembers] = useState<Awaited<ReturnType<typeof getProjectMembers>>>([]);
  const [tasks, setTasks] = useState<Awaited<ReturnType<typeof getProjectTasks>>>([]);
  const [budget, setBudget] = useState<Awaited<ReturnType<typeof getProjectBudget>>>(null);
  const [expenses, setExpenses] = useState<Awaited<ReturnType<typeof getProjectExpenses>>>([]);
  const [activity, setActivity] = useState<Awaited<ReturnType<typeof getProjectActivity>>>([]);
  const [assets, setAssets] = useState<Awaited<ReturnType<typeof getProjectAssets>>>([]);
  const [allTeamMembers, setAllTeamMembers] = useState<Awaited<ReturnType<typeof getAllTeamMembers>>>([]);

  const [loadedTabs, setLoadedTabs] = useState<Set<Tab>>(new Set());

  const loadTabData = async (tab: Tab) => {
    if (loadedTabs.has(tab)) return;
    setLoadedTabs(prev => new Set([...prev, tab]));

    try {
      if (tab === 'overview') {
        const [m, a] = await Promise.all([
          getProjectMembers(project.id),
          getProjectActivity(project.id, 10),
        ]);
        setMembers(m);
        setActivity(a);
        // Budget for overview stats
        const [b, e] = await Promise.all([getProjectBudget(project.id), getProjectExpenses(project.id)]);
        setBudget(b);
        setExpenses(e);
      } else if (tab === 'team' || tab === 'members') {
        const [m, all] = await Promise.all([getProjectMembers(project.id), getAllTeamMembers()]);
        setMembers(m);
        setAllTeamMembers(all);
        setLoadedTabs(prev => new Set([...prev, 'team', 'members']));
      } else if (tab === 'budget') {
        const [b, e] = await Promise.all([getProjectBudget(project.id), getProjectExpenses(project.id)]);
        setBudget(b);
        setExpenses(e);
      } else if (tab === 'activity') {
        const a = await getProjectActivity(project.id, 50);
        setActivity(a);
      } else if (tab === 'tasks') {
        const t = await getProjectTasks(project.id);
        setTasks(t);
      } else if (tab === 'files') {
        const a = await getProjectAssets(project.id);
        setAssets(a);
      }
    } catch (err) {
      console.error('Error loading tab data:', err);
    }
  };

  useEffect(() => {
    loadTabData('overview');
  }, [project.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    loadTabData(tab);
  };

  const handleSaveIcon = () => {
    startTransition(async () => {
      try {
        await updateProject(project.id, { iconColor: pendingColor });
        setProject(p => ({ ...p, iconColor: pendingColor }));
        setShowIconPicker(false);
        toast.success('Icon updated');
      } catch {
        toast.error('Failed to update icon');
      }
    });
  };

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const totalBudget = budget?.totalBudget || 0;
  const budgetRemaining = totalBudget - totalSpent;

  return (
    <div>
      {/* Project Header Card */}
      <div className="bg-white border-b border-[var(--color-border)]" style={{ boxShadow: '0 1px 3px rgba(30,42,58,0.06)', marginLeft: '-32px', marginRight: '-32px', paddingLeft: '32px', paddingRight: '32px' }}>
        <div style={{ paddingTop: '20px' }}>
          {/* Back link */}
          <button
            onClick={() => router.push('/projects')}
            className="flex items-center gap-1 text-sm text-[#5A6A7E] hover:text-[#1E2A3A] mb-4 transition-colors"
          >
            <ChevronLeft size={14} />
            All Projects
          </button>

          <div className="flex items-start justify-between gap-4">
            {/* Left: Icon + Title */}
            <div className="flex items-start gap-4">
              {/* Project Icon */}
              <div className="relative">
                <button
                  onClick={() => setShowIconPicker(v => !v)}
                  className="flex items-center justify-center rounded-xl transition-opacity hover:opacity-80"
                  style={{
                    width: 64, height: 64,
                    backgroundColor: project.iconColor,
                    borderRadius: 12,
                    flexShrink: 0,
                  }}
                  title="Change color"
                >
                  <span style={{ fontSize: 24, fontWeight: 'bold', color: 'white', lineHeight: 1 }}>
                    {project.name.charAt(0).toUpperCase()}
                  </span>
                </button>

                {showIconPicker && (
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-lg border border-[var(--color-border)] p-4 z-50 w-56"
                    style={{ boxShadow: '0 8px 24px rgba(30,42,58,0.12)' }}>
                    <div className="text-xs font-semibold text-[#1E2A3A] mb-2">Background Color</div>
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {ICON_COLORS.map(c => (
                        <button key={c} onClick={() => setPendingColor(c)}
                          className="w-7 h-7 rounded-full border-2 transition-all"
                          style={{ backgroundColor: c, borderColor: pendingColor === c ? 'var(--color-text-primary)' : 'transparent' }} />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleSaveIcon}
                        className="flex-1 py-1.5 text-sm font-medium text-white rounded-md bg-[#3B5BDB] hover:bg-[#364FC7] transition-colors">
                        Save
                      </button>
                      <button onClick={() => setShowIconPicker(false)}
                        className="flex-1 py-1.5 text-sm font-medium text-[#5A6A7E] rounded-md border border-[var(--color-border)] hover:bg-[#F5F7FA] transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h1 className="text-[20px] font-bold text-[#1E2A3A] leading-tight">{project.name}</h1>
                <p className="text-[14px] text-[#5A6A7E] mt-0.5 max-w-xl">{project.description}</p>

                {/* Meta row */}
                <div className="flex items-center gap-5 mt-2">
                  <div className="flex items-center gap-1 text-[13px] text-[#8896A6]">
                    <Clock size={13} className="text-[#A0AAB8]" />
                    {project.totalHours}h
                  </div>
                  <div className="flex items-center gap-1 text-[13px] text-[#8896A6]">
                    <CheckSquare size={13} className="text-[#A0AAB8]" />
                    {project.taskCount} tasks left
                  </div>
                  <div className="flex items-center gap-1 text-[13px] text-[#8896A6]">
                    <Users size={13} className="text-[#A0AAB8]" />
                    {project.memberCount} Members
                  </div>
                  {/* Avatar stack */}
                  <div className="flex items-center">
                    {members.slice(0, 4).map((m, i) => (
                      <div key={m.id} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: 4 - i }}>
                        <Avatar initials={m.initials} color={m.color} size={28} name={m.name} />
                      </div>
                    ))}
                    {members.length > 4 && (
                      <div className="w-7 h-7 rounded-full bg-[#EDF0F5] text-[#5A6A7E] text-xs font-semibold flex items-center justify-center border-2 border-white" style={{ marginLeft: -8 }}>
                        +{members.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => handleTabChange('settings')}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#3B5BDB] border border-[#3B5BDB] rounded-md hover:bg-[#E8EDFF] transition-colors"
              >
                <Pencil size={13} />
                Edit Project
              </button>
              <button
                onClick={() => setShowCreateTask(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-md hover:bg-[#364FC7] transition-colors"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <Plus size={13} />
                Create task
              </button>
            </div>
          </div>

          {/* Tabs - Scrollable on mobile */}
          <div className="overflow-x-auto -mx-4 px-4 mt-5" style={{ scrollBehavior: 'smooth' }}>
            <div className="flex items-center gap-0 border-b-2 border-[var(--color-border)] min-w-min">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleTabChange(t.id)}
                  className="px-0 py-3 mr-7 text-sm transition-colors border-b-2 -mb-0.5 whitespace-nowrap"
                  style={{
                    color: activeTab === t.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    borderBottomColor: activeTab === t.id ? 'var(--color-primary)' : 'transparent',
                    fontWeight: activeTab === t.id ? 600 : 500,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ padding: '24px 32px' }}>
        {activeTab === 'overview' && (
          <OverviewTab
            project={project}
            members={members}
            activity={activity}
            totalBudget={totalBudget}
            totalSpent={totalSpent}
            budgetRemaining={budgetRemaining}
          />
        )}
        {(activeTab === 'team' || activeTab === 'members') && (
          <TeamTab
            project={project}
            members={members}
            allTeamMembers={allTeamMembers}
            onAdd={async (memberId) => {
              await addProjectMember(project.id, memberId);
              const [m, all] = await Promise.all([getProjectMembers(project.id), getAllTeamMembers()]);
              setMembers(m);
              setAllTeamMembers(all);
              setProject(p => ({ ...p, memberCount: m.length }));
              toast.success('Member added');
            }}
            onRemove={async (memberId) => {
              await removeProjectMember(project.id, memberId);
              const [m, all] = await Promise.all([getProjectMembers(project.id), getAllTeamMembers()]);
              setMembers(m);
              setAllTeamMembers(all);
              setProject(p => ({ ...p, memberCount: m.length }));
              toast.success('Member removed');
            }}
          />
        )}
        {activeTab === 'budget' && (
          <BudgetTab
            project={project}
            budget={budget}
            expenses={expenses}
            onUpdateBudget={async (amount) => {
              await updateProjectBudget(project.id, amount);
              const b = await getProjectBudget(project.id);
              setBudget(b);
              toast.success('Budget updated');
            }}
            onAddExpense={async (data) => {
              await createProjectExpense(project.id, data);
              const e = await getProjectExpenses(project.id);
              setExpenses(e);
              toast.success('Expense added');
            }}
            onDeleteExpense={async (id) => {
              await deleteProjectExpense(id, project.id);
              const e = await getProjectExpenses(project.id);
              setExpenses(e);
              toast.success('Expense deleted');
            }}
          />
        )}
        {activeTab === 'activity' && (
          <ActivityTab activity={activity} />
        )}
        {activeTab === 'tasks' && (
          <TasksTab
            project={project}
            tasks={tasks}
            onCreateTask={() => setShowCreateTask(true)}
            onRefresh={async () => {
              const t = await getProjectTasks(project.id);
              setTasks(t);
            }}
          />
        )}
        {activeTab === 'files' && (
          <FilesTab
            project={project}
            assets={assets}
            onDelete={async (assetId, name) => {
              await deleteProjectAsset(assetId, project.id, name);
              const a = await getProjectAssets(project.id);
              setAssets(a);
              toast.success('File deleted');
            }}
            onRefresh={async () => {
              const a = await getProjectAssets(project.id);
              setAssets(a);
            }}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsTab
            project={project}
            onSave={async (data) => {
              await updateProject(project.id, data);
              setProject(p => ({ ...p, ...data }));
              toast.success('Settings saved');
            }}
            onArchive={async () => {
              await archiveProjectById(project.id);
              toast.success('Project archived');
              router.push('/projects');
            }}
          />
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateTask && (
        <TaskModal
          defaultProjectId={project.id}
          defaultStatus="todo"
          onClose={() => setShowCreateTask(false)}
          onSuccess={async () => {
            setShowCreateTask(false);
            const t = await getProjectTasks(project.id);
            setTasks(t);
            setProject(p => ({ ...p, taskCount: t.length }));
            toast.success('Task created');
          }}
        />
      )}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({
  project, members, activity, totalBudget, totalSpent, budgetRemaining
}: {
  project: ProjectDetail;
  members: Awaited<ReturnType<typeof getProjectMembers>>;
  activity: Awaited<ReturnType<typeof getProjectActivity>>;
  totalBudget: number;
  totalSpent: number;
  budgetRemaining: number;
}) {
  const budgetPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const remainingPct = totalBudget > 0 ? (budgetRemaining / totalBudget) * 100 : 0;
  const groups = groupActivitiesByDate(activity);

  return (
    <div>
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 w-full">
        <StatCard label="Total Budget" value={formatCurrency(totalBudget)} percentage={100} />
        <StatCard label="Budget Remaining" value={formatCurrency(Math.max(0, budgetRemaining))} percentage={remainingPct} color="#2BB673" />
        <StatCard label="Money Spent" value={formatCurrency(totalSpent)} percentage={budgetPct} color="#E03131" />
        <StatCard label="Revenue" value="$0" percentage={0} note="Coming soon" color="#F59F00" />
      </div>

      {/* Two column layout - responsive */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3 w-full">
        {/* Left */}
        <div className="space-y-6 md:col-span-2">
          <div className="bg-white rounded-lg border border-[var(--color-border)] p-6" style={{ boxShadow: '0 1px 3px rgba(30,42,58,0.06)' }}>
            <h2 className="text-base font-semibold text-[#1E2A3A] mb-3">Project Details</h2>
            <p className="text-[14px] text-[#5A6A7E] leading-relaxed">{project.description || 'No description provided.'}</p>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[#8896A6] text-xs font-semibold uppercase tracking-wide">Status</span>
                <div className="mt-1">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    project.status === 'active' ? 'bg-blue-100 text-blue-700' :
                    project.status === 'complete' ? 'bg-green-100 text-green-700' :
                    project.status === 'on-hold' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{project.status}</span>
                </div>
              </div>
              <div>
                <span className="text-[#8896A6] text-xs font-semibold uppercase tracking-wide">Progress</span>
                <div className="mt-1.5">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={project.progress} />
                    <span className="text-sm font-medium text-[#1E2A3A]">{project.progress}%</span>
                  </div>
                </div>
              </div>
              <div>
                <span className="text-[#8896A6] text-xs font-semibold uppercase tracking-wide">Start Date</span>
                <div className="mt-1 text-sm text-[#1E2A3A]">{formatDate(project.startDate)}</div>
              </div>
              <div>
                <span className="text-[#8896A6] text-xs font-semibold uppercase tracking-wide">Due Date</span>
                <div className="mt-1 text-sm text-[#1E2A3A]">{formatDate(project.endDate)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="space-y-6">
          {/* Project Leads */}
          <div className="bg-white rounded-lg border border-[var(--color-border)] p-5" style={{ boxShadow: '0 1px 3px rgba(30,42,58,0.06)' }}>
            <h2 className="text-base font-semibold text-[#1E2A3A] mb-4">Project Leads</h2>
            {members.length === 0 ? (
              <p className="text-sm text-[#8896A6]">No members assigned yet.</p>
            ) : (
              <div className="space-y-4">
                {members.map(m => (
                  <div key={m.id} className="flex items-start gap-3">
                    <Avatar initials={m.initials} color={m.color} size={44} name={m.name} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-semibold text-[#1E2A3A]">{m.name}</div>
                      <div className="text-[13px] text-[#5A6A7E]">{m.role}</div>
                      <button className="text-[13px] font-medium mt-1 hover:underline" style={{ color: 'var(--color-primary)' }}>
                        Send Message
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-lg border border-[var(--color-border)] p-5" style={{ boxShadow: '0 1px 3px rgba(30,42,58,0.06)' }}>
            <h2 className="text-base font-semibold text-[#1E2A3A] mb-4">Recent Activities</h2>
            {activity.length === 0 ? (
              <p className="text-sm text-[#8896A6]">No activity yet.</p>
            ) : (
              <div>
                {Object.entries(groups).map(([dateLabel, items]) => (
                  <div key={dateLabel}>
                    <div className="text-[11px] font-semibold text-[#8896A6] uppercase tracking-wide mb-2">{dateLabel}</div>
                    <div className="relative pl-12 space-y-4 mb-4">
                      <div className="absolute left-10 top-0 bottom-0 w-px bg-[var(--color-border)]" />
                      {items.map(a => (
                        <div key={a.id} className="flex items-start gap-2">
                          <div className="absolute left-8 text-[10px] text-[#8896A6] pt-0.5">{formatTime(a.createdAt)}</div>
                          <span className="flex-shrink-0 text-[#5A6A7E] flex items-center pt-0.5">{getActionIcon(a.actionType)}</span>
                          <span className="text-[13px] text-[#5A6A7E] leading-5">{a.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Team Tab ─────────────────────────────────────────────────────────────────
function TeamTab({
  project, members, allTeamMembers, onAdd, onRemove
}: {
  project: ProjectDetail;
  members: Awaited<ReturnType<typeof getProjectMembers>>;
  allTeamMembers: Awaited<ReturnType<typeof getAllTeamMembers>>;
  onAdd: (memberId: string) => Promise<void>;
  onRemove: (memberId: string) => Promise<void>;
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const memberIds = new Set(members.map(m => m.teamMemberId));
  const available = allTeamMembers.filter((m: { id: string }) => !memberIds.has(m.id));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-[#1E2A3A]">Team Members ({members.length})</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-md hover:bg-[#364FC7] transition-colors"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <UserPlus size={14} />
          Add Member
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {members.map(m => (
          <div key={m.id} className="bg-white rounded-lg border border-[var(--color-border)] p-5 flex items-center gap-4"
            style={{ boxShadow: '0 1px 3px rgba(30,42,58,0.06)' }}>
            <Avatar initials={m.initials} color={m.color} size={48} name={m.name} />
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-semibold text-[#1E2A3A]">{m.name}</div>
              <div className="text-[13px] text-[#5A6A7E]">{m.role}</div>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-[#8896A6]">
                <span>{m.taskCount} tasks</span>
              </div>
            </div>
            <button
              onClick={() => setConfirmRemove(m.teamMemberId)}
              className="text-[#A0AAB8] hover:text-[#E03131] transition-colors p-1 rounded"
              title="Remove member"
            >
              <X size={16} />
            </button>
          </div>
        ))}
        {members.length === 0 && (
          <div className="col-span-3 text-center py-12 text-[#8896A6]">
            <Users size={36} className="mx-auto mb-3 opacity-30" />
            <p>No members assigned yet.</p>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(30,42,58,0.45)' }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" style={{ boxShadow: '0 16px 48px rgba(30,42,58,0.18)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[#1E2A3A]">Add Team Member</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#A0AAB8] hover:text-[#1E2A3A]"><X size={18} /></button>
            </div>
            {available.length === 0 ? (
              <p className="text-sm text-[#8896A6]">All team members are already on this project.</p>
            ) : (
              <div className="space-y-2">
                {available.map((m: { id: string; name: string; role: string; initials: string; color: string }) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      startTransition(async () => {
                        await onAdd(m.id);
                        setShowAddModal(false);
                      });
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#F5F7FA] transition-colors text-left"
                  >
                    <Avatar initials={m.initials} color={m.color} size={36} />
                    <div>
                      <div className="text-sm font-medium text-[#1E2A3A]">{m.name}</div>
                      <div className="text-xs text-[#8896A6]">{m.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm Remove */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(30,42,58,0.45)' }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-sm" style={{ boxShadow: '0 16px 48px rgba(30,42,58,0.18)' }}>
            <h3 className="text-base font-semibold text-[#1E2A3A] mb-2">Remove Member</h3>
            <p className="text-sm text-[#5A6A7E] mb-5">Remove this member from the project?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmRemove(null)}
                className="flex-1 py-2 text-sm font-medium text-[#5A6A7E] border border-[var(--color-border)] rounded-md hover:bg-[#F5F7FA]">
                Cancel
              </button>
              <button
                onClick={() => {
                  startTransition(async () => {
                    await onRemove(confirmRemove);
                    setConfirmRemove(null);
                  });
                }}
                className="flex-1 py-2 text-sm font-medium text-white bg-[#E03131] hover:bg-[#C92A2A] rounded-md">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Budget Tab ───────────────────────────────────────────────────────────────
function BudgetTab({
  project, budget, expenses, onUpdateBudget, onAddExpense, onDeleteExpense
}: {
  project: ProjectDetail;
  budget: Awaited<ReturnType<typeof getProjectBudget>>;
  expenses: Awaited<ReturnType<typeof getProjectExpenses>>;
  onUpdateBudget: (amount: number) => Promise<void>;
  onAddExpense: (data: { description: string; amount: number; category: string; expenseDate: string }) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
}) {
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(budget?.totalBudget || 0));
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expForm, setExpForm] = useState({ description: '', amount: '', category: 'Labor', expenseDate: new Date().toISOString().split('T')[0] });
  const [, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);

  const totalBudget = budget?.totalBudget || 0;
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const budgetRemaining = totalBudget - totalSpent;
  const spentPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const remainingPct = totalBudget > 0 ? (budgetRemaining / totalBudget) * 100 : 0;

  const handleSaveBudget = () => {
    const amount = parseFloat(budgetInput);
    if (isNaN(amount) || amount < 0) { toast.error('Invalid amount'); return; }
    startTransition(async () => {
      await onUpdateBudget(amount);
      setEditingBudget(false);
    });
  };

  const handleAddExpense = async () => {
    if (!expForm.description || !expForm.amount) { toast.error('Fill in all required fields'); return; }
    setSaving(true);
    try {
      await onAddExpense({
        description: expForm.description,
        amount: parseFloat(expForm.amount),
        category: expForm.category,
        expenseDate: expForm.expenseDate,
      });
      setExpForm({ description: '', amount: '', category: 'Labor', expenseDate: new Date().toISOString().split('T')[0] });
      setShowAddExpense(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Budget header */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-base font-semibold text-[#1E2A3A]">Budget:</span>
        {editingBudget ? (
          <div className="flex items-center gap-2">
            <span className="text-[#8896A6]">$</span>
            <input
              type="number"
              value={budgetInput}
              onChange={e => setBudgetInput(e.target.value)}
              className="w-32 h-9 px-3 text-sm border border-[#3B5BDB] rounded-md focus:outline-none"
              autoFocus
            />
            <button onClick={handleSaveBudget} className="p-1.5 text-white bg-[#3B5BDB] rounded-md hover:bg-[#364FC7]"><Check size={14} /></button>
            <button onClick={() => setEditingBudget(false)} className="p-1.5 text-[#5A6A7E] border border-[var(--color-border)] rounded-md hover:bg-[#F5F7FA]"><X size={14} /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[20px] font-bold text-[#1E2A3A]">{formatCurrency(totalBudget)}</span>
            <button onClick={() => { setEditingBudget(true); setBudgetInput(String(totalBudget)); }}
              className="text-[#A0AAB8] hover:text-[#3B5BDB] transition-colors">
              <Pencil size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 w-full">
        <StatCard label="Total Budget" value={formatCurrency(totalBudget)} percentage={100} />
        <StatCard label="Budget Remaining" value={formatCurrency(Math.max(0, budgetRemaining))} percentage={remainingPct} color="#2BB673" />
        <StatCard label="Money Spent" value={formatCurrency(totalSpent)} percentage={spentPct} color="#E03131" />
        <StatCard label="Revenue" value="$0" percentage={0} note="Coming soon" color="#F59F00" />
      </div>

      {/* Expense table */}
      <div className="bg-white rounded-lg border border-[var(--color-border)]" style={{ boxShadow: '0 1px 3px rgba(30,42,58,0.06)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-base font-semibold text-[#1E2A3A]">Expenses ({expenses.length})</h2>
          <button
            onClick={() => setShowAddExpense(v => !v)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white rounded-md hover:bg-[#364FC7] transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Plus size={13} />
            Add Expense
          </button>
        </div>

        {/* Add expense form */}
        {showAddExpense && (
          <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[#F8F9FF]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs font-semibold text-[#1E2A3A] mb-1.5">Description *</label>
                <input
                  value={expForm.description}
                  onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Expense description"
                  className="w-full h-10 px-3 text-sm border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[#3B5BDB]"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-[#1E2A3A] mb-1.5">Amount *</label>
                <input
                  type="number"
                  value={expForm.amount}
                  onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00"
                  className="w-full h-10 px-3 text-sm border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[#3B5BDB]"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-[#1E2A3A] mb-1.5">Category</label>
                <select
                  value={expForm.category}
                  onChange={e => setExpForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full h-10 px-3 text-sm border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[#3B5BDB] bg-white"
                >
                  {['Labor', 'Software', 'Advertising', 'Design', 'Other'].map(c => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1E2A3A] mb-1.5">Date</label>
                <input
                  type="date"
                  value={expForm.expenseDate}
                  onChange={e => setExpForm(f => ({ ...f, expenseDate: e.target.value }))}
                  className="h-10 px-3 text-sm border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[#3B5BDB]"
                />
              </div>
              <div className="flex items-end gap-2 ml-auto">
                <button onClick={() => setShowAddExpense(false)}
                  className="px-4 py-2 text-sm font-medium text-[#5A6A7E] border border-[var(--color-border)] rounded-md hover:bg-[#F5F7FA]">
                  Cancel
                </button>
                <button onClick={handleAddExpense} disabled={saving}
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#3B5BDB] hover:bg-[#364FC7] rounded-md disabled:opacity-50">
                  {saving ? 'Saving...' : 'Add Expense'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        {expenses.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                {['DESCRIPTION', 'CATEGORY', 'DATE', 'AMOUNT', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-[#3B5BDB] uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expenses.map(e => (
                <tr key={e.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-5 py-3 text-sm text-[#1E2A3A]">{e.description}</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#EDF0F5] text-[#5A6A7E]">{e.category}</span>
                  </td>
                  <td className="px-5 py-3 text-sm text-[#5A6A7E]">{formatDate(e.expenseDate)}</td>
                  <td className="px-5 py-3 text-sm font-medium text-[#1E2A3A]">${e.amount.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => startTransition(() => onDeleteExpense(e.id))}
                      className="text-[#A0AAB8] hover:text-[#E03131] transition-colors p-1"
                      title="Delete expense"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#F8F9FF]">
                <td colSpan={3} className="px-5 py-3 text-sm font-semibold text-[#1E2A3A]">Total Spent</td>
                <td className="px-5 py-3 text-sm font-bold text-[#1E2A3A]">${totalSpent.toLocaleString()}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        ) : (
          <div className="text-center py-10 text-[#8896A6]">
            <DollarSign size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No expenses added yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Activity Tab ─────────────────────────────────────────────────────────────
function ActivityTab({ activity }: { activity: Awaited<ReturnType<typeof getProjectActivity>> }) {
  const [filter, setFilter] = useState('all');
  const filters = ['all', 'tasks', 'files', 'budget', 'team'];
  const actionTypeMap: Record<string, string> = {
    tasks: 'task_created|task_completed|task_status_changed',
    files: 'file_uploaded|file_deleted',
    budget: 'budget_updated|expense_added|expense_deleted',
    team: 'member_added|member_removed',
  };

  const filtered = filter === 'all' ? activity : activity.filter(a => {
    const pattern = actionTypeMap[filter] || '';
    return pattern.split('|').some(p => a.actionType.includes(p));
  });

  const groups = groupActivitiesByDate(filtered);

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-5">
        <Filter size={14} className="text-[#A0AAB8]" />
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors capitalize ${
              filter === f ? 'bg-[#3B5BDB] text-white' : 'bg-white text-[#5A6A7E] border border-[var(--color-border)] hover:bg-[#F5F7FA]'
            }`}>
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-[var(--color-border)] p-6" style={{ boxShadow: '0 1px 3px rgba(30,42,58,0.06)' }}>
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-[#8896A6]">
            <Activity size={32} className="mx-auto mb-2 opacity-30" />
            <p>No activity found for this filter.</p>
          </div>
        ) : (
          Object.entries(groups).map(([dateLabel, items]) => (
            <div key={dateLabel} className="mb-6 last:mb-0">
              <div className="text-[11px] font-semibold text-[#8896A6] uppercase tracking-wide mb-3">{dateLabel}</div>
              <div className="relative">
                <div className="absolute left-[52px] top-0 bottom-0 w-px bg-[var(--color-border)]" />
                <div className="space-y-4">
                  {items.map(a => (
                    <div key={a.id} className="flex items-start gap-3 pl-16 relative">
                      <div className="absolute left-0 text-xs text-[#8896A6] pt-0.5 w-12 text-right tabular-nums">
                        {formatTime(a.createdAt)}
                      </div>
                      <div className="absolute left-[46px] w-5 h-5 rounded-full bg-white border border-[var(--color-border)] flex items-center justify-center text-[#5A6A7E]">
                        {getActionIcon(a.actionType)}
                      </div>
                      <div className="flex-1">
                        <p className="text-[14px] text-[#1E2A3A]">{a.description}</p>
                        <span className="text-[11px] text-[#8896A6]">by {a.userName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Tasks Tab ────────────────────────────────────────────────────────────────
function TasksTab({
  project, tasks, onCreateTask, onRefresh
}: {
  project: ProjectDetail;
  tasks: Awaited<ReturnType<typeof getProjectTasks>>;
  onCreateTask: () => void;
  onRefresh: () => Promise<void>;
}) {
  const [view, setView] = useState<'list' | 'kanban'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('project-tasks-view') as 'list' | 'kanban') || 'list';
    }
    return 'list';
  });
  const [sortBy, setSortBy] = useState<'status' | 'dueDate' | 'priority'>('status');

  const setViewAndSave = (v: 'list' | 'kanban') => {
    setView(v);
    if (typeof window !== 'undefined') localStorage.setItem('project-tasks-view', v);
  };

  const sorted = [...tasks].sort((a, b) => {
    if (sortBy === 'dueDate') return a.dueDate.localeCompare(b.dueDate);
    if (sortBy === 'priority') {
      const ord = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
      return (ord[a.priority as keyof typeof ord] ?? 2) - (ord[b.priority as keyof typeof ord] ?? 2);
    }
    const statusOrd = { inprogress: 0, review: 1, todo: 2, done: 3 };
    return (statusOrd[a.status as keyof typeof statusOrd] ?? 2) - (statusOrd[b.status as keyof typeof statusOrd] ?? 2);
  });

  const columns = ['todo', 'inprogress', 'review', 'done'];
  const colLabels: Record<string, string> = { todo: 'To Do', inprogress: 'In Progress', review: 'Review', done: 'Done' };
  const colColors: Record<string, string> = { todo: '#868E96', inprogress: 'var(--color-primary)', review: '#F59F00', done: '#2BB673' };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-[#1E2A3A]">Tasks ({tasks.length})</h2>
        <div className="flex items-center gap-3">
          {view === 'list' && (
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="h-9 px-3 text-sm border border-[var(--color-border)] rounded-md bg-white text-[#5A6A7E] focus:outline-none"
            >
              <option value="status">Sort: Status</option>
              <option value="dueDate">Sort: Due Date</option>
              <option value="priority">Sort: Priority</option>
            </select>
          )}
          <div className="flex items-center border border-[var(--color-border)] rounded-md overflow-hidden">
            <button
              onClick={() => setViewAndSave('list')}
              className={`px-3 py-2 transition-colors ${view === 'list' ? 'bg-[#3B5BDB] text-white' : 'bg-white text-[#5A6A7E] hover:bg-[#F5F7FA]'}`}
              title="List view"
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setViewAndSave('kanban')}
              className={`px-3 py-2 transition-colors border-l border-[var(--color-border)] ${view === 'kanban' ? 'bg-[#3B5BDB] text-white' : 'bg-white text-[#5A6A7E] hover:bg-[#F5F7FA]'}`}
              title="Kanban view"
            >
              <LayoutGrid size={14} />
            </button>
          </div>
          <button
            onClick={onCreateTask}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-md hover:bg-[#364FC7] transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Plus size={13} />
            Create Task
          </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white rounded-lg border border-[var(--color-border)] text-center py-16 text-[#8896A6]" style={{ boxShadow: '0 1px 3px rgba(30,42,58,0.06)' }}>
          <CheckSquare size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No tasks yet</p>
          <p className="text-sm mt-1">Create a task to get started</p>
        </div>
      ) : view === 'list' ? (
        <div className="bg-white rounded-lg border border-[var(--color-border)]" style={{ boxShadow: '0 1px 3px rgba(30,42,58,0.06)' }}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                {['TASK', 'STATUS', 'ASSIGNEE', 'DUE DATE', 'PRIORITY'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-[#3B5BDB] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(t => (
                <tr key={t.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[#F8FAFC] transition-colors cursor-pointer">
                  <td className="px-5 py-3.5 text-sm font-medium text-[#1E2A3A]">{t.title}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[t.status] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[t.status] || t.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Avatar initials={t.assigneeInitials} color={t.assigneeColor} size={24} />
                      <span className="text-sm text-[#5A6A7E]">{t.assigneeName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-[#5A6A7E]">{formatDate(t.dueDate)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_COLORS[t.priority] || 'bg-gray-100 text-gray-500'}`}>
                      {t.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {columns.map(col => {
            const colTasks = tasks.filter(t => t.status === col);
            return (
              <div key={col} className="bg-white rounded-lg border border-[var(--color-border)] overflow-hidden"
                style={{ boxShadow: '0 1px 3px rgba(30,42,58,0.06)', borderTop: `3px solid ${colColors[col]}` }}>
                <div className="px-4 py-3 border-b border-[var(--color-border)]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#1E2A3A]">{colLabels[col]}</span>
                    <span className="text-xs text-[#8896A6]">{colTasks.length}</span>
                  </div>
                </div>
                <div className="p-3 space-y-3">
                  {colTasks.map(t => (
                    <div key={t.id} className="bg-white rounded-lg border border-[var(--color-border)] p-3 hover:shadow-md transition-shadow cursor-pointer"
                      style={{ boxShadow: '0 1px 2px rgba(30,42,58,0.04)' }}>
                      <div className="text-sm font-semibold text-[#1E2A3A] mb-1.5">{t.title}</div>
                      <div className="flex items-center justify-between">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${PRIORITY_COLORS[t.priority] || 'bg-gray-100 text-gray-500'}`}>
                          {t.priority}
                        </span>
                        <Avatar initials={t.assigneeInitials} color={t.assigneeColor} size={22} name={t.assigneeName} />
                      </div>
                      <div className="mt-1.5 flex items-center gap-1 text-[11px] text-[#8896A6]">
                        <Calendar size={10} />
                        {formatDate(t.dueDate)}
                      </div>
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <div className="text-center py-4 text-[#A0AAB8] text-xs">No tasks</div>
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

// ─── Files Tab ────────────────────────────────────────────────────────────────
function FilesTab({
  project, assets, onDelete, onRefresh
}: {
  project: ProjectDetail;
  assets: Awaited<ReturnType<typeof getProjectAssets>>;
  onDelete: (id: string, name: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', project.id);

      const res = await fetch('/api/projects/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      await onRefresh();
      toast.success(`"${file.name}" uploaded`);
    } catch (err) {
      toast.error('Upload failed: ' + (err as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <ImageIcon size={48} className="text-gray-300" />;
    if (type.includes('pdf')) return <FileText size={48} className="text-gray-300" />;
    if (type.includes('video')) return <Video size={48} className="text-gray-300" />;
    if (type.includes('zip') || type.includes('archive')) return <Archive size={48} className="text-gray-300" />;
    return <Paperclip size={48} className="text-gray-300" />;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-[#1E2A3A]">Project Files ({assets.length})</h2>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-md hover:bg-[#364FC7] transition-colors disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Upload size={13} />
            {uploading ? 'Uploading...' : '+ Upload File'}
          </button>
          <a
            href="/documents"
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#3B5BDB] bg-[#EEF2FF] hover:bg-[#E0E7FF] rounded-md transition-colors border border-[#C7D2FE]"
          >
            <FileText size={13} />
            + Create Document
          </a>
        </div>
      </div>

      {assets.length === 0 ? (
        <div className="bg-white rounded-lg border border-[var(--color-border)] text-center py-16 text-[#8896A6]" style={{ boxShadow: '0 1px 3px rgba(30,42,58,0.06)' }}>
          <FileText size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No files yet</p>
          <p className="text-sm mt-1">Upload your first file to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 w-full">
          {assets.map(a => (
            <div key={a.id} className="bg-white rounded-lg border border-[var(--color-border)] overflow-hidden"
              style={{ boxShadow: '0 1px 3px rgba(30,42,58,0.06)' }}>
              {/* Thumbnail */}
              <div className="relative" style={{ aspectRatio: '4/3', backgroundColor: 'var(--color-hover-bg)' }}>
                {a.url && a.type.includes('image') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.url} alt={a.name} className="w-full h-full object-cover" style={{ borderRadius: '8px 8px 0 0' }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {getFileIcon(a.type)}
                  </div>
                )}
                <button
                  onClick={() => onDelete(a.id, a.name)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-[#A0AAB8] hover:text-[#E03131] hover:bg-white transition-colors"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}
                  title="Delete file"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              {/* Info */}
              <div className="p-3 text-center">
                <div className="text-[13px] font-medium text-[#1E2A3A] truncate mb-0.5">{a.name}</div>
                <div className="text-[12px] text-[#8896A6]">{formatFileSize(a.size)} · {a.type.split('/').pop()?.toUpperCase() || 'FILE'}</div>
                {a.uploadedBy && (
                  <div className="text-[12px] text-[#8896A6] mt-0.5">Uploaded by {a.uploadedBy}</div>
                )}
                {a.url && (
                  <a href={a.url} download className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#5A6A7E] border border-[var(--color-border)] rounded-md hover:bg-[#F5F7FA] transition-colors">
                    <Download size={12} />
                    Download
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab({
  project, onSave, onArchive
}: {
  project: ProjectDetail;
  onSave: (data: Partial<ProjectDetail>) => Promise<void>;
  onArchive: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: project.name,
    description: project.description,
    status: project.status,
    startDate: project.startDate,
    endDate: project.endDate,
  });
  const [saving, setSaving] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [, startTransition] = useTransition();

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-lg border border-[var(--color-border)] p-6 mb-6" style={{ boxShadow: '0 1px 3px rgba(30,42,58,0.06)' }}>
        <h2 className="text-base font-semibold text-[#1E2A3A] mb-5">Project Settings</h2>

        <div className="space-y-5">
          <div>
            <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-1.5">Project Name</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full h-11 px-3.5 text-sm border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[#3B5BDB] focus:shadow-[0_0_0_3px_rgba(59,91,219,0.12)]"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={4}
              className="w-full px-3.5 py-3 text-sm border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[#3B5BDB] focus:shadow-[0_0_0_3px_rgba(59,91,219,0.12)] resize-none"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-1.5">Status</label>
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full h-11 px-3.5 text-sm border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[#3B5BDB] bg-white"
            >
              {['active', 'on-hold', 'complete', 'planning'].map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-1.5">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="w-full h-11 px-3.5 text-sm border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[#3B5BDB]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-1.5">Due Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                className="w-full h-11 px-3.5 text-sm border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[#3B5BDB]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-[#3B5BDB] hover:bg-[#364FC7] rounded-md disabled:opacity-60 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg border border-red-200 p-6" style={{ boxShadow: '0 1px 3px rgba(30,42,58,0.06)' }}>
        <h2 className="text-base font-semibold text-red-600 mb-2">Danger Zone</h2>
        <p className="text-sm text-[#5A6A7E] mb-4">Archiving a project will hide it from all views. This can be reversed from your database.</p>
        <button
          onClick={() => setShowArchiveConfirm(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
        >
          <AlertCircle size={14} />
          Archive Project
        </button>

        {showArchiveConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(30,42,58,0.45)' }}>
            <div className="bg-white rounded-lg p-6 w-full max-w-sm" style={{ boxShadow: '0 16px 48px rgba(30,42,58,0.18)' }}>
              <h3 className="text-base font-semibold text-[#1E2A3A] mb-2">Archive Project</h3>
              <p className="text-sm text-[#5A6A7E] mb-5">This will hide the project from all views. Are you sure?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowArchiveConfirm(false)}
                  className="flex-1 py-2 text-sm font-medium text-[#5A6A7E] border border-[var(--color-border)] rounded-md hover:bg-[#F5F7FA]">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowArchiveConfirm(false);
                    startTransition(() => onArchive());
                  }}
                  className="flex-1 py-2 text-sm font-medium text-white bg-[#E03131] hover:bg-[#C92A2A] rounded-md">
                  Archive
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
