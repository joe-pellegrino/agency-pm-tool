'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppData } from '@/lib/contexts/AppDataContext';
import {
  Clock, CheckSquare, Users, Pencil, Plus, ChevronLeft,
  Trash2, Download, Upload, X, Check, List, LayoutGrid,
  Calendar, AlertCircle, DollarSign, TrendingUp, Activity,
  FileText, Settings, BarChart3, UserPlus, Filter,
  CheckCircle, RefreshCw, ImageIcon, Video, Paperclip, Archive,
  Megaphone, Link2, Link2Off, Loader2, TrendingDown, Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { linkTaskToProject } from '@/lib/actions';
import type { ProjectDetail } from '@/lib/actions-projects';
import {
  getProjectMembers, getProjectTasks, getProjectBudget,
  getProjectExpenses, getProjectActivity, getProjectAssets,
  updateProject, updateProjectBudget, createProjectExpense,
  deleteProjectExpense, addProjectMember, removeProjectMember,
  getAllTeamMembers, createProjectTask, deleteProjectAsset,
  archiveProjectById,
} from '@/lib/actions-projects';
import {
  getInitiativeCampaigns,
  linkCampaignToInitiative,
  unlinkCampaignFromInitiative,
  getPortalCampaignsForClient,
  getInitiativeLeads,
  type InitiativeCampaign,
  type InitiativeLead,
} from '@/lib/actions-ads';
import TaskModal from '@/components/tasks/TaskModal';
import ProjectComments from '@/components/projects/ProjectComments';

// ─── Types ───────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'team' | 'members' | 'budget' | 'activity' | 'comments' | 'tasks' | 'files' | 'campaigns' | 'leads' | 'settings';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'team', label: 'Team' },
  { id: 'members', label: 'Members' },
  { id: 'budget', label: 'Budget' },
  { id: 'activity', label: 'Activity' },
  { id: 'comments', label: 'Comments' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'files', label: 'Files' },
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'leads', label: 'Leads' },
  { id: 'settings', label: 'Settings' },
];



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
  const { TASKS = [] } = useAppData();
  const [project, setProject] = useState(initialProject);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [, startTransition] = useTransition();
  const [showCreateTask, setShowCreateTask] = useState(false);

  // Tab data
  const [members, setMembers] = useState<Awaited<ReturnType<typeof getProjectMembers>>>([]);
  const [tasks, setTasks] = useState<Awaited<ReturnType<typeof getProjectTasks>>>([]);
  const [budget, setBudget] = useState<Awaited<ReturnType<typeof getProjectBudget>>>(null);
  const [expenses, setExpenses] = useState<Awaited<ReturnType<typeof getProjectExpenses>>>([]);
  const [activity, setActivity] = useState<Awaited<ReturnType<typeof getProjectActivity>>>([]);
  const [assets, setAssets] = useState<Awaited<ReturnType<typeof getProjectAssets>>>([]);
  const [allTeamMembers, setAllTeamMembers] = useState<Awaited<ReturnType<typeof getAllTeamMembers>>>([]);
  const [linkedCampaigns, setLinkedCampaigns] = useState<InitiativeCampaign[]>([]);
  const [campaignDateRange, setCampaignDateRange] = useState<'today' | '7d' | '30d' | 'month'>('30d');
  const [initiativeLeads, setInitiativeLeads] = useState<InitiativeLead[]>([]);
  const [leadsDateRange, setLeadsDateRange] = useState<'today' | '7d' | '30d' | 'month'>('30d');
  const [leadsLoading, setLeadsLoading] = useState(false);

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
      } else if (tab === 'campaigns') {
        const c = await getInitiativeCampaigns(project.id, campaignDateRange);
        setLinkedCampaigns(c);
      } else if (tab === 'leads') {
        setLeadsLoading(true);
        const l = await getInitiativeLeads(project.id, leadsDateRange);
        setInitiativeLeads(l);
        setLeadsLoading(false);
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



  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const totalBudget = budget?.totalBudget || 0;
  const budgetRemaining = totalBudget - totalSpent;

  return (
    <div>
      {/* Project Header Card */}
      <div className="bg-white border-b border-[var(--color-border)] -mx-4 px-4 sm:-mx-8 sm:px-8" style={{ boxShadow: '0 1px 3px rgba(30,42,58,0.06)' }}>
        <div style={{ paddingTop: '20px' }}>
          {/* Back link */}
          <button
            onClick={() => router.push('/initiatives')}
            className="flex items-center gap-1 text-sm text-[#5A6A7E] hover:text-[#1E2A3A] mb-4 transition-colors"
          >
            <ChevronLeft size={14} />
            All Initiatives
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            {/* Left: Title */}
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

            {/* Right: Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0 self-start">
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
      <div className="px-4 py-6 sm:px-8">
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
        {activeTab === 'comments' && (
          <div className="max-w-3xl">
            <ProjectComments projectId={project.id} />
          </div>
        )}
        {activeTab === 'tasks' && (
          <TasksTab
            project={project}
            tasks={tasks}
            allTasks={TASKS}
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
        {activeTab === 'campaigns' && (
          <LinkedCampaignsTab
            project={project}
            linkedCampaigns={linkedCampaigns}
            dateRange={campaignDateRange}
            onDateRangeChange={async (range) => {
              setCampaignDateRange(range);
              const c = await getInitiativeCampaigns(project.id, range);
              setLinkedCampaigns(c);
            }}
            onLink={async (campaignId, platform) => {
              await linkCampaignToInitiative(project.id, campaignId, platform);
              const c = await getInitiativeCampaigns(project.id, campaignDateRange);
              setLinkedCampaigns(c);
              toast.success('Campaign linked');
            }}
            onUnlink={async (campaignId) => {
              await unlinkCampaignFromInitiative(project.id, campaignId);
              const c = await getInitiativeCampaigns(project.id, campaignDateRange);
              setLinkedCampaigns(c);
              toast.success('Campaign unlinked');
            }}
          />
        )}
        {activeTab === 'leads' && (
          <LeadsTab
            project={project}
            leads={initiativeLeads}
            loading={leadsLoading}
            dateRange={leadsDateRange}
            onDateRangeChange={async (range) => {
              setLeadsDateRange(range);
              setLeadsLoading(true);
              const l = await getInitiativeLeads(project.id, range);
              setInitiativeLeads(l);
              setLeadsLoading(false);
            }}
            onNavigateToCampaigns={() => handleTabChange('campaigns')}
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
              router.push('/initiatives');
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 w-full">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 w-full">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
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
      <div className="flex items-center gap-2 mb-5 flex-wrap">
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
  project, tasks, allTasks, onCreateTask, onRefresh
}: {
  project: ProjectDetail;
  tasks: Awaited<ReturnType<typeof getProjectTasks>>;
  allTasks: any[];
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
  const [showLinkTask, setShowLinkTask] = useState(false);
  const [linkTaskSearch, setLinkTaskSearch] = useState('');
  const [linkingTaskId, setLinkingTaskId] = useState<string | null>(null);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <h2 className="text-base font-semibold text-[#1E2A3A]">Tasks ({tasks.length})</h2>
        <div className="flex items-center gap-2 flex-wrap">
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
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-md hover:bg-[#364FC7] transition-colors sm:flex-none flex-1 justify-center"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
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

      {/* Link existing task button */}
      <button
        onClick={() => setShowLinkTask(!showLinkTask)}
        className="mt-4 flex items-center gap-2 text-sm text-[#3B5BDB] hover:text-[#2F4AC2] font-medium transition-colors"
      >
        <Plus size={14} />
        Link existing task
      </button>

      {showLinkTask && (
        <div className="mt-3 border border-gray-200 rounded-xl bg-white p-4 shadow-sm">
          <input
            type="text"
            value={linkTaskSearch}
            onChange={e => setLinkTaskSearch(e.target.value)}
            placeholder="Search tasks by name..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] mb-3"
            autoFocus
          />
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {allTasks
              .filter(t =>
                t.clientId === project.clientId &&
                !tasks.some(existing => existing.id === t.id) &&
                t.title.toLowerCase().includes(linkTaskSearch.toLowerCase())
              )
              .slice(0, 10)
              .map(t => (
                <button
                  key={t.id}
                  disabled={linkingTaskId === t.id}
                  onClick={async () => {
                    setLinkingTaskId(t.id);
                    try {
                      await linkTaskToProject(project.id, t.id);
                      toast.success('Task linked');
                      setShowLinkTask(false);
                      setLinkTaskSearch('');
                      // Reload tasks
                      await onRefresh();
                    } catch (err) {
                      toast.error('Failed: ' + (err as Error).message);
                    } finally {
                      setLinkingTaskId(null);
                    }
                  }}
                  className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
                >
                  <span className="text-gray-800 truncate flex-1">{t.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${
                    t.status === 'done' ? 'bg-green-100 text-green-600' :
                    t.status === 'inprogress' ? 'bg-blue-100 text-blue-600' :
                    t.status === 'review' ? 'bg-purple-100 text-purple-600' :
                    'bg-gray-100 text-gray-500'
                  }`}>{t.status === 'inprogress' ? 'In Progress' : t.status.charAt(0).toUpperCase() + t.status.slice(1)}</span>
                </button>
              ))}
            {allTasks.filter(t =>
              t.clientId === project.clientId &&
              !tasks.some(existing => existing.id === t.id) &&
              t.title.toLowerCase().includes(linkTaskSearch.toLowerCase())
            ).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-3">No tasks found</p>
            )}
          </div>
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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5 w-full">
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

// ─── Linked Campaigns Tab ─────────────────────────────────────────────────────

type CampaignDateRange = 'today' | '7d' | '30d' | 'month';

const CAMPAIGN_DATE_LABELS: Record<CampaignDateRange, string> = {
  today: 'Today',
  '7d': '7 Days',
  '30d': '30 Days',
  month: 'This Month',
};

function CampaignSparkline({ data }: { data: Array<{ date: string; spend: number }> }) {
  if (!data || data.length < 2) {
    return <div className="w-20 h-8 bg-gray-50 rounded" />;
  }
  const w = 80, h = 32, pad = 2;
  const values = data.map(d => d.spend);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });
  const polyline = points.join(' ');
  const firstX = points[0].split(',')[0];
  const lastX = points[points.length - 1].split(',')[0];
  const area = `${polyline} ${lastX},${h - pad} ${firstX},${h - pad}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polygon points={area} fill="#3B5BDB" fillOpacity="0.08" />
      <polyline points={polyline} fill="none" stroke="#3B5BDB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function fmtCur(v: number) {
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  return `$${v.toFixed(0)}`;
}
function fmtN(v: number) {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return v.toString();
}

function LinkedCampaignCard({
  campaign,
  onUnlink,
  onViewLeads,
}: {
  campaign: InitiativeCampaign;
  onUnlink: (campaignId: string) => Promise<void>;
  onViewLeads: () => void;
}) {
  const [kpiName, setKpiName] = useState<string | null>(null);
  const [kpiLoading, setKpiLoading] = useState(false);
  const [showKpiInfo, setShowKpiInfo] = useState(false);

  useEffect(() => {
    // Fetch KPI link for this campaign
    setKpiLoading(true);
    import('@/lib/actions-ads').then(({ getCampaignKpiLinks }) => {
      getCampaignKpiLinks('', [campaign.campaignId])
        .then(links => {
          const link = links[0];
          if (link?.kpiName) setKpiName(link.kpiName);
          setKpiLoading(false);
        })
        .catch(() => setKpiLoading(false));
    });
  }, [campaign.campaignId]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all overflow-hidden">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
            <h3 className="font-semibold text-[#1E2A3A] text-sm truncate">
              {campaign.campaignName || campaign.campaignId}
            </h3>
          </div>
          <span className="text-[10px] font-semibold bg-[#EEF2FF] text-[#3B5BDB] px-2 py-0.5 rounded-full flex-shrink-0 capitalize">
            {campaign.platform}
          </span>
        </div>
        {/* KPI feed indicator */}
        {!kpiLoading && kpiName && (
          <div className="flex items-center gap-1 ml-4 mt-1">
            <TrendingUp size={10} className="text-[#3B5BDB]" />
            <span className="text-[10px] text-[#5A6A7E]">Feeds KPI: <span className="font-medium text-[#3B5BDB]">{kpiName}</span></span>
          </div>
        )}
        {!kpiLoading && !kpiName && (
          <div className="flex items-center gap-1 ml-4 mt-1">
            <Info size={10} className="text-[#A0AAB8]" />
            <span className="text-[10px] text-[#A0AAB8]">No KPI linked — link one in the Paid Ads tab</span>
          </div>
        )}
      </div>

      {/* Metrics row */}
      <div className="px-4 pb-3 grid grid-cols-4 gap-1">
        {[
          { label: 'Spend', value: fmtCur(campaign.totalSpend ?? 0) },
          { label: 'Impress.', value: fmtN(campaign.totalImpressions ?? 0) },
          { label: 'Clicks', value: fmtN(campaign.totalClicks ?? 0) },
          { label: 'Leads', value: String(campaign.totalResults ?? 0) },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <div className="text-[10px] font-semibold uppercase text-[#8896A6] mb-0.5" style={{ letterSpacing: '0.06em' }}>{label}</div>
            <div className="text-[15px] font-bold text-[#1E2A3A]">{value}</div>
          </div>
        ))}
      </div>

      {/* Sparkline */}
      {campaign.dailySpend && campaign.dailySpend.length > 1 && (
        <div className="px-4 pb-3">
          <div className="text-[9px] font-semibold uppercase text-[#8896A6] mb-1">Spend Trend</div>
          <CampaignSparkline data={campaign.dailySpend} />
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        <button
          onClick={onViewLeads}
          className="flex items-center gap-1 text-[11px] font-medium text-[#5A6A7E] hover:text-[#3B5BDB] hover:bg-[#EEF2FF] px-2 py-1 rounded transition-colors"
        >
          <Users size={11} />
          View Leads
        </button>
        <button
          onClick={() => onUnlink(campaign.campaignId)}
          className="flex items-center gap-1 text-[11px] font-medium text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors"
        >
          <Link2Off size={11} />
          Unlink
        </button>
      </div>
    </div>
  );
}

function LinkedCampaignsTab({
  project,
  linkedCampaigns,
  dateRange,
  onDateRangeChange,
  onLink,
  onUnlink,
}: {
  project: ProjectDetail;
  linkedCampaigns: InitiativeCampaign[];
  dateRange: CampaignDateRange;
  onDateRangeChange: (range: CampaignDateRange) => Promise<void>;
  onLink: (campaignId: string, platform: string) => Promise<void>;
  onUnlink: (campaignId: string) => Promise<void>;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [availableCampaigns, setAvailableCampaigns] = useState<Array<{ id: string; name: string; spend: number; impressions: number }>>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [changingRange, setChangingRange] = useState(false);

  const linkedIds = new Set(linkedCampaigns.map(c => c.campaignId));

  const handleOpenPicker = async () => {
    setShowPicker(true);
    setPickerLoading(true);
    try {
      const campaigns = await getPortalCampaignsForClient(project.clientId, '30d');
      setAvailableCampaigns(campaigns);
    } catch (err) {
      toast.error('Failed to load campaigns');
    } finally {
      setPickerLoading(false);
    }
  };

  const handleRangeChange = async (range: CampaignDateRange) => {
    setChangingRange(true);
    await onDateRangeChange(range);
    setChangingRange(false);
  };

  const filtered = availableCampaigns.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Summary totals
  const totalSpend = linkedCampaigns.reduce((s, c) => s + (c.totalSpend ?? 0), 0);
  const totalImpressions = linkedCampaigns.reduce((s, c) => s + (c.totalImpressions ?? 0), 0);
  const totalResults = linkedCampaigns.reduce((s, c) => s + (c.totalResults ?? 0), 0);
  const totalClicks = linkedCampaigns.reduce((s, c) => s + (c.totalClicks ?? 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-base font-semibold text-[#1E2A3A]">Linked Campaigns</h2>
          <p className="text-sm text-[#8896A6] mt-0.5">Meta campaigns linked to this initiative</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Date range */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {(Object.keys(CAMPAIGN_DATE_LABELS) as CampaignDateRange[]).map(range => (
              <button
                key={range}
                onClick={() => handleRangeChange(range)}
                disabled={changingRange}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  dateRange === range
                    ? 'bg-white text-[#3B5BDB] shadow-sm'
                    : 'text-[#5A6A7E] hover:text-gray-700'
                }`}
              >
                {CAMPAIGN_DATE_LABELS[range]}
              </button>
            ))}
          </div>
          <button
            onClick={handleOpenPicker}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-md hover:bg-[#364FC7] transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Link2 size={13} />
            Link Campaign
          </button>
        </div>
      </div>

      {/* Summary stats */}
      {linkedCampaigns.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Spend', value: fmtCur(totalSpend) },
            { label: 'Impressions', value: fmtN(totalImpressions) },
            { label: 'Clicks', value: fmtN(totalClicks) },
            { label: 'Leads', value: totalResults.toString() },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center" style={{ boxShadow: '0 1px 3px rgba(30,42,58,0.06)' }}>
              <div className="text-[11px] font-semibold uppercase text-[#8896A6] mb-1" style={{ letterSpacing: '0.06em' }}>{label}</div>
              <div className="text-[22px] font-bold text-[#1E2A3A]">{changingRange ? '-' : value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Campaign cards */}
      {changingRange ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-[#3B5BDB]" />
          <span className="ml-2 text-sm text-gray-500">Loading...</span>
        </div>
      ) : linkedCampaigns.length === 0 ? (
        <div className="bg-white rounded-lg border border-[var(--color-border)] text-center py-16 text-[#8896A6]" style={{ boxShadow: '0 1px 3px rgba(30,42,58,0.06)' }}>
          <Megaphone size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No campaigns linked yet</p>
          <p className="text-sm mt-1">Link a Meta campaign to track its performance here</p>
          <button
            onClick={handleOpenPicker}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-md hover:bg-[#364FC7] transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Link2 size={13} />
            Link First Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {linkedCampaigns.map(campaign => (
            <LinkedCampaignCard
              key={campaign.campaignId}
              campaign={campaign}
              onUnlink={onUnlink}
              onViewLeads={() => {/* handled by parent tab change */}}
            />
          ))}
        </div>
      )}

      {/* Campaign Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowPicker(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 text-base">Link a Campaign</h2>
              <button onClick={() => setShowPicker(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-4 border-b border-gray-100">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search campaigns..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              {pickerLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-[#3B5BDB]" />
                  <span className="ml-2 text-sm text-gray-500">Loading campaigns...</span>
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">No campaigns found</p>
              ) : (
                <div className="space-y-2">
                  {filtered.map(c => {
                    const isLinked = linkedIds.has(c.id);
                    return (
                      <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-[#3B5BDB]/30 hover:bg-[#F8F9FF] transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[#1E2A3A] truncate">{c.name}</p>
                          <p className="text-xs text-[#8896A6] mt-0.5">
                            {fmtCur(c.spend)} spend · {fmtN(c.impressions)} impressions (30d)
                          </p>
                        </div>
                        {isLinked ? (
                          <span className="ml-3 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full flex-shrink-0">
                            Linked ✓
                          </span>
                        ) : (
                          <button
                            onClick={async () => {
                              await onLink(c.id, 'meta');
                              setShowPicker(false);
                            }}
                            className="ml-3 flex-shrink-0 px-3 py-1.5 text-xs font-semibold text-white bg-[#3B5BDB] hover:bg-[#364FC7] rounded-lg transition-colors"
                          >
                            Link
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowPicker(false)}
                className="w-full py-2 text-sm font-medium text-[#5A6A7E] border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Leads Tab ────────────────────────────────────────────────────────────────

type LeadsDateRange = 'today' | '7d' | '30d' | 'month';
const LEADS_DATE_LABELS: Record<LeadsDateRange, string> = {
  today: 'Today',
  '7d': '7 Days',
  '30d': '30 Days',
  month: 'This Month',
};

const LEAD_STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-indigo-100 text-indigo-700',
  qualified: 'bg-purple-100 text-purple-700',
  converted: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-600',
};

function LeadsTab({
  project,
  leads,
  loading,
  dateRange,
  onDateRangeChange,
  onNavigateToCampaigns,
}: {
  project: ProjectDetail;
  leads: InitiativeLead[];
  loading: boolean;
  dateRange: LeadsDateRange;
  onDateRangeChange: (range: LeadsDateRange) => Promise<void>;
  onNavigateToCampaigns: () => void;
}) {
  const convertedLeads = leads.filter(l => l.converted);
  const totalRevenue = convertedLeads.reduce((s, l) => s + (l.conversionAmount ?? 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-base font-semibold text-[#1E2A3A]">Leads from Linked Campaigns</h2>
          <p className="text-sm text-[#8896A6] mt-0.5">Meta Ad leads attributed to campaigns linked to this initiative</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(Object.keys(LEADS_DATE_LABELS) as LeadsDateRange[]).map(range => (
            <button
              key={range}
              onClick={() => onDateRangeChange(range)}
              disabled={loading}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                dateRange === range
                  ? 'bg-white text-[#3B5BDB] shadow-sm'
                  : 'text-[#5A6A7E] hover:text-gray-700'
              }`}
            >
              {LEADS_DATE_LABELS[range]}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      {leads.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Leads', value: leads.length.toString() },
            { label: 'Converted', value: convertedLeads.length.toString() },
            { label: 'Conv. Rate', value: leads.length > 0 ? `${Math.round((convertedLeads.length / leads.length) * 100)}%` : '0%' },
            { label: 'Revenue', value: totalRevenue > 0 ? formatCurrency(totalRevenue) : '$0' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center" style={{ boxShadow: '0 1px 3px rgba(30,42,58,0.06)' }}>
              <div className="text-[11px] font-semibold uppercase text-[#8896A6] mb-1" style={{ letterSpacing: '0.06em' }}>{label}</div>
              <div className="text-[22px] font-bold text-[#1E2A3A]">{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Leads table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-[#3B5BDB]" />
          <span className="ml-2 text-sm text-gray-500">Loading leads...</span>
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-lg border border-[var(--color-border)] text-center py-16 text-[#8896A6]" style={{ boxShadow: '0 1px 3px rgba(30,42,58,0.06)' }}>
          <Users size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No leads found</p>
          <p className="text-sm mt-1">Link Meta campaigns to this initiative to see attributed leads</p>
          <button
            onClick={onNavigateToCampaigns}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-md hover:bg-[#364FC7] transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Go to Campaigns
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-[var(--color-border)] overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(30,42,58,0.06)' }}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                {['NAME', 'CAMPAIGN', 'STATUS', 'CONVERTED', 'REVENUE', 'DATE'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-[#3B5BDB] uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr key={lead.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-[#1E2A3A]">
                    {lead.name || <span className="text-[#8896A6] italic">Unknown</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#5A6A7E] max-w-[160px] truncate">
                    {lead.campaignName || lead.sourceDetail || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${LEAD_STATUS_COLORS[lead.status || 'new'] || 'bg-gray-100 text-gray-600'}`}>
                      {lead.status || 'new'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {lead.converted ? (
                      <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                        <Check size={12} /> Yes
                      </span>
                    ) : (
                      <span className="text-xs text-[#8896A6]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#1E2A3A]">
                    {lead.conversionAmount ? formatCurrency(lead.conversionAmount) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#8896A6]">
                    {formatDate(lead.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-[var(--color-border)] bg-[#F8F9FF] text-xs text-[#8896A6]">
            Read-only view · Data from portal Meta Ad leads
          </div>
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
