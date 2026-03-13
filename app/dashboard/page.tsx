import TopBar from '@/components/layout/TopBar';
import { getAllData, PRIORITY_DOT } from '@/lib/supabase/queries';
import { CheckCircle2, Clock, AlertCircle, Users, TrendingUp, FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import DashboardView from './DashboardView';
import ExecutiveDashboard from './ExecutiveDashboard';

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={15} />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</div>
      <div className="text-xs text-gray-400">{sub}</div>
    </div>
  );
}

export default async function DashboardPage() {
  const { TASKS, CLIENTS, TEAM_MEMBERS } = await getAllData();
  const totalTasks = TASKS.filter(t => !t.isMilestone).length;
  const doneTasks = TASKS.filter(t => t.status === 'done' && !t.isMilestone).length;
  const inProgressTasks = TASKS.filter(t => t.status === 'inprogress').length;
  const urgentTasks = TASKS.filter(t => t.priority === 'Urgent' && t.status !== 'done').length;

  // Tasks by client
  const tasksByClient = CLIENTS.map(client => {
    const clientTasks = TASKS.filter(t => t.clientId === client.id && !t.isMilestone);
    const done = clientTasks.filter(t => t.status === 'done').length;
    return { client, total: clientTasks.length, done };
  });

  // Upcoming deadlines — tasks due in the next 7 days, not done
  const now = new Date();
  const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const recentTasks = TASKS
    .filter(t => !t.isMilestone && t.status !== 'done' && t.dueDate)
    .filter(t => {
      const due = new Date(t.dueDate);
      return due <= sevenDaysOut;
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const standardView = (
    <>
      {/* Stats — 1 col mobile, 2 col sm, 4 col lg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Total Tasks" value={totalTasks} sub="Across all clients" icon={CheckCircle2} color="bg-indigo-100 text-indigo-600" />
        <StatCard label="In Progress" value={inProgressTasks} sub="Currently active" icon={Clock} color="bg-amber-100 text-amber-600" />
        <StatCard label="Completed" value={doneTasks} sub={`${totalTasks > 0 ? Math.round((doneTasks/totalTasks)*100) : 0}% completion rate`} icon={TrendingUp} color="bg-green-100 text-green-600" />
        <StatCard label="Urgent Items" value={urgentTasks} sub="Needs attention" icon={AlertCircle} color="bg-red-100 text-red-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Client Overview */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Client Overview</h2>
            <Link href="/clients" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-4">
            {tasksByClient.map(({ client, total, done }) => {
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              const inProg = TASKS.filter(t => t.clientId === client.id && t.status === 'inprogress').length;
              return (
                <div key={client.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: client.color + '20', color: client.color }}
                      >
                        {client.logo}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{client.name}</div>
                        <div className="text-xs text-gray-400">{client.industry}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{done}/{total}</div>
                      <div className="text-xs text-gray-400">{inProg} active</div>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: client.color }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{pct}% complete</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users size={15} className="text-indigo-500" />
              Team Load
            </h2>
          </div>
          <div className="space-y-3">
            {TEAM_MEMBERS.map(member => {
              const memberTasks = TASKS.filter(
                t => t.assigneeId === member.id && t.status !== 'done' && !t.isMilestone
              );
              const urgent = memberTasks.filter(t => t.priority === 'Urgent').length;
              return (
                <div key={member.id} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{member.name.split(' ')[0]}</span>
                      <span className="text-xs text-gray-500">{memberTasks.length} tasks</span>
                    </div>
                    <div className="text-xs text-gray-400 truncate">{member.role}</div>
                    {urgent > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-xs text-red-600 mt-0.5">
                        <AlertCircle size={10} /> {urgent} urgent
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="mt-4 sm:mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Upcoming Deadlines</h2>
          <Link href="/kanban" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
            View board <ArrowRight size={12} />
          </Link>
        </div>
        {/* Mobile: card list */}
        <div className="sm:hidden space-y-3">
          {recentTasks.map(task => {
            const client = CLIENTS.find(c => c.id === task.clientId);
            const assignee = TEAM_MEMBERS.find(m => m.id === task.assigneeId);
            if (!client || !assignee) return null;
            const statusColors: Record<string, string> = {
              todo: 'bg-gray-100 text-gray-600',
              inprogress: 'bg-blue-100 text-blue-700',
              review: 'bg-amber-100 text-amber-700',
              done: 'bg-green-100 text-green-700',
            };
            const statusLabels: Record<string, string> = {
              todo: 'To Do',
              inprogress: 'In Progress',
              review: 'Review',
              done: 'Done',
            };
            return (
              <div key={task.id} className="flex flex-col gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-gray-900 dark:text-white text-sm leading-snug">{task.title}</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${statusColors[task.status]}`}>
                    {statusLabels[task.status]}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500">
                  <span
                    className="inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: client.color + '18', color: client.color }}
                  >
                    {client.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                      style={{ backgroundColor: assignee.color }}
                    >
                      {assignee.initials}
                    </div>
                    <span>{assignee.name.split(' ')[0]}</span>
                  </div>
                  <span className="flex items-center gap-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`} />
                    {task.priority}
                  </span>
                  <span>{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            );
          })}
        </div>
        {/* Desktop: table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Task</th>
                <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assignee</th>
                <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Due</th>
                <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {recentTasks.map(task => {
                const client = CLIENTS.find(c => c.id === task.clientId);
                const assignee = TEAM_MEMBERS.find(m => m.id === task.assigneeId);
                if (!client || !assignee) return null;
                const statusColors: Record<string, string> = {
                  todo: 'bg-gray-100 text-gray-600',
                  inprogress: 'bg-blue-100 text-blue-700',
                  review: 'bg-amber-100 text-amber-700',
                  done: 'bg-green-100 text-green-700',
                };
                const statusLabels: Record<string, string> = {
                  todo: 'To Do',
                  inprogress: 'In Progress',
                  review: 'Review',
                  done: 'Done',
                };
                return (
                  <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="py-3 pr-4">
                      <span className="font-medium text-gray-900 dark:text-white">{task.title}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
                        style={{ backgroundColor: client.color + '18', color: client.color }}
                      >
                        {client.name}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                          style={{ backgroundColor: assignee.color }}
                        >
                          {assignee.initials}
                        </div>
                        <span className="text-gray-600 dark:text-gray-300">{assignee.name.split(' ')[0]}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`} />
                        <span className="text-gray-600">{task.priority}</span>
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-300 text-xs">
                      {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[task.status]}`}>
                        {statusLabels[task.status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const executiveView = (
    <ExecutiveDashboard tasks={TASKS} clients={CLIENTS} teamMembers={TEAM_MEMBERS} />
  );

  return (
    <div className="pt-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopBar title="Dashboard" subtitle="Welcome back, Joe" />
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <DashboardView standardView={standardView} executiveView={executiveView} />
      </div>
    </div>
  );
}
