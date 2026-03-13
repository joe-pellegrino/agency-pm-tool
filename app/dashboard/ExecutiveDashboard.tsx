import { Client, Task, TeamMember } from '@/lib/data';
import { PRIORITY_DOT } from '@/lib/supabase/queries';
import { AlertTriangle, CheckCircle2, Clock, Flame, Inbox, ShieldCheck, Users } from 'lucide-react';
import Link from 'next/link';

/* ─── Types ───────────────────────────────────────────────────────────── */

interface Props {
  tasks: Task[];
  clients: Client[];
  teamMembers: TeamMember[];
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const PRIORITY_WEIGHT: Record<string, number> = { Urgent: 4, High: 3, Medium: 2, Low: 1 };

const PRIORITY_COLORS: Record<string, string> = {
  Urgent: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  High: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  Medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  Low: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};

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

function relativeDate(dateStr: string | null | undefined): { text: string; isOverdue: boolean } {
  if (!dateStr) return { text: 'No date', isOverdue: false };
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { text: `overdue ${Math.abs(diffDays)}d`, isOverdue: true };
  if (diffDays === 0) return { text: 'today', isOverdue: false };
  if (diffDays === 1) return { text: 'tomorrow', isOverdue: false };
  return { text: `${diffDays}d`, isOverdue: false };
}

function relativeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

/* ─── Section: Pressing Items ─────────────────────────────────────────── */

function PressingItems({ tasks, clients, teamMembers }: Props) {
  const items = tasks
    .filter(t => !t.isMilestone && t.status !== 'done')
    .sort((a, b) => {
      const pw = (PRIORITY_WEIGHT[b.priority] || 0) - (PRIORITY_WEIGHT[a.priority] || 0);
      if (pw !== 0) return pw;
      const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return aDate - bDate;
    })
    .slice(0, 5);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <Flame size={14} className="text-red-600 dark:text-red-400" />
        </div>
        <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Most Pressing</h2>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">No open tasks</p>
      ) : (
        <div className="space-y-2">
          {items.map(task => {
            const client = clients.find(c => c.id === task.clientId);
            const assignee = teamMembers.find(m => m.id === task.assigneeId);
            const due = relativeDate(task.dueDate);
            return (
              <Link
                key={task.id}
                href={`/kanban?task=${task.id}`}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
              >
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${PRIORITY_COLORS[task.priority]}`}>
                  {task.priority}
                </span>
                <span className="flex-1 min-w-0 text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {task.title}
                </span>
                {client && (
                  <span
                    className="hidden sm:inline text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: client.color + '18', color: client.color }}
                  >
                    {client.name}
                  </span>
                )}
                {assignee && (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                    style={{ backgroundColor: assignee.color }}
                  >
                    {assignee.initials}
                  </div>
                )}
                <span className={`text-[11px] font-medium flex-shrink-0 ${due.isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-500'}`}>
                  {due.text}
                </span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[task.status]}`}>
                  {STATUS_LABELS[task.status]}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Section: Unhealthy Clients ──────────────────────────────────────── */

interface ClientHealth {
  client: Client;
  score: number;
  overdue: number;
  openTasks: number;
  totalTasks: number;
}

function UnhealthyClients({ tasks, clients }: Pick<Props, 'tasks' | 'clients'>) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const healthData: ClientHealth[] = clients.map(client => {
    const clientTasks = tasks.filter(t => t.clientId === client.id && !t.isMilestone);
    const total = clientTasks.length;
    const done = clientTasks.filter(t => t.status === 'done').length;
    const overdue = clientTasks.filter(t => {
      if (t.status === 'done') return false;
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < now;
    }).length;
    const openTasks = clientTasks.filter(t => t.status !== 'done').length;

    let score = total > 0 ? Math.round((done / total) * 100) : 100;
    // Penalize overdue: each overdue task reduces score by 10
    score = Math.max(0, score - overdue * 10);

    return { client, score, overdue, openTasks, totalTasks: total };
  });

  const unhealthy = healthData.filter(h => h.score < 70 || h.overdue >= 2);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Client Health</h2>
      </div>
      {unhealthy.length === 0 ? (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <ShieldCheck size={16} className="text-green-600 dark:text-green-400" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">All clients healthy</span>
        </div>
      ) : (
        <div className="space-y-3">
          {unhealthy.sort((a, b) => a.score - b.score).map(h => {
            const barColor = h.score < 40 ? 'bg-red-500' : h.score < 70 ? 'bg-orange-500' : 'bg-amber-400';
            return (
              <Link
                key={h.client.id}
                href={`/clients/${h.client.id}`}
                className="block p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-md text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: h.client.color + '20', color: h.client.color }}
                    >
                      {h.client.logo}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{h.client.name}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{h.score}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${h.score}%` }} />
                </div>
                <div className="flex items-center gap-3 text-[11px] text-gray-500">
                  <span className="text-red-600 dark:text-red-400 font-medium">{h.overdue} overdue</span>
                  <span>{h.openTasks} open</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Section: Recent Completions ─────────────────────────────────────── */

function RecentCompletions({ tasks, clients, teamMembers }: Props) {
  const items = tasks
    .filter(t => t.status === 'done' && !t.isMilestone)
    .sort((a, b) => {
      const aDate = a.endDate || a.dueDate || '';
      const bDate = b.endDate || b.dueDate || '';
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    })
    .slice(0, 5);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle2 size={14} className="text-green-600 dark:text-green-400" />
        </div>
        <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Recent Completions</h2>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">No completed tasks yet</p>
      ) : (
        <div className="space-y-2">
          {items.map(task => {
            const client = clients.find(c => c.id === task.clientId);
            const assignee = teamMembers.find(m => m.id === task.assigneeId);
            const completed = relativeAgo(task.endDate || task.dueDate);
            return (
              <div
                key={task.id}
                className="flex items-center gap-3 p-2.5 rounded-lg"
              >
                <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                <span className="flex-1 min-w-0 text-sm text-gray-700 dark:text-gray-300 truncate">
                  {task.title}
                </span>
                {client && (
                  <span
                    className="hidden sm:inline text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: client.color + '18', color: client.color }}
                  >
                    {client.name}
                  </span>
                )}
                {assignee && (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                    style={{ backgroundColor: assignee.color }}
                  >
                    {assignee.initials}
                  </div>
                )}
                <span className="text-[11px] text-gray-400 flex-shrink-0">{completed}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Section: Pipeline ───────────────────────────────────────────────── */

function PipelineItems({ tasks, clients, teamMembers }: Props) {
  const items = tasks
    .filter(t => t.status === 'todo' && !t.isMilestone)
    .sort((a, b) => {
      const pw = (PRIORITY_WEIGHT[b.priority] || 0) - (PRIORITY_WEIGHT[a.priority] || 0);
      if (pw !== 0) return pw;
      // Oldest first (been waiting longest)
      return new Date(a.startDate || a.dueDate || '9999').getTime() - new Date(b.startDate || b.dueDate || '9999').getTime();
    })
    .slice(0, 5);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <Inbox size={14} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Pipeline</h2>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">Pipeline is empty</p>
      ) : (
        <div className="space-y-2">
          {items.map(task => {
            const client = clients.find(c => c.id === task.clientId);
            const assignee = teamMembers.find(m => m.id === task.assigneeId);
            return (
              <Link
                key={task.id}
                href={`/kanban?task=${task.id}`}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
              >
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${PRIORITY_COLORS[task.priority]}`}>
                  {task.priority}
                </span>
                <span className="flex-1 min-w-0 text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {task.title}
                </span>
                {client && (
                  <span
                    className="hidden sm:inline text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: client.color + '18', color: client.color }}
                  >
                    {client.name}
                  </span>
                )}
                {assignee ? (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                    style={{ backgroundColor: assignee.color }}
                  >
                    {assignee.initials}
                  </div>
                ) : (
                  <span className="text-[10px] text-gray-400 flex-shrink-0">Unassigned</span>
                )}
                {task.startDate && (
                  <span className="text-[11px] text-gray-400 flex-shrink-0">
                    starts {new Date(task.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Section: Team Capacity ──────────────────────────────────────────── */

function TeamCapacity({ tasks, teamMembers }: Pick<Props, 'tasks' | 'teamMembers'>) {
  const data = teamMembers.map(member => {
    const openTasks = tasks.filter(t => t.assigneeId === member.id && t.status !== 'done' && !t.isMilestone);
    const urgentHigh = openTasks.filter(t => t.priority === 'Urgent' || t.priority === 'High').length;
    const count = openTasks.length;
    let capacityColor = 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400';
    let capacityLabel = '🟢 Low';
    if (count >= 8) {
      capacityColor = 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400';
      capacityLabel = '🔴 High';
    } else if (count >= 4) {
      capacityColor = 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
      capacityLabel = '🟡 Moderate';
    }
    return { member, count, urgentHigh, capacityColor, capacityLabel };
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <Users size={14} className="text-purple-600 dark:text-purple-400" />
        </div>
        <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Team Capacity</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.map(({ member, count, urgentHigh, capacityColor, capacityLabel }) => (
          <div
            key={member.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: member.color }}
            >
              {member.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{member.name}</div>
              <div className="text-[11px] text-gray-400 truncate">{member.role}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${capacityColor}`}>
                  {count} tasks {capacityLabel}
                </span>
                {urgentHigh > 0 && (
                  <span className="text-[10px] font-medium text-red-600 dark:text-red-400">
                    {urgentHigh} urgent/high
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Executive Dashboard ────────────────────────────────────────── */

export default function ExecutiveDashboard({ tasks, clients, teamMembers }: Props) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top row: Pressing + Client Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <PressingItems tasks={tasks} clients={clients} teamMembers={teamMembers} />
        <UnhealthyClients tasks={tasks} clients={clients} />
      </div>

      {/* Middle row: Completions + Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <RecentCompletions tasks={tasks} clients={clients} teamMembers={teamMembers} />
        <PipelineItems tasks={tasks} clients={clients} teamMembers={teamMembers} />
      </div>

      {/* Bottom: Team Capacity */}
      <TeamCapacity tasks={tasks} teamMembers={teamMembers} />
    </div>
  );
}
