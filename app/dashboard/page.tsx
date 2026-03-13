import TopBar from '@/components/layout/TopBar';
import { getAllData, PRIORITY_DOT } from '@/lib/supabase/queries';
import { CheckCircle2, Clock, AlertCircle, Users, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import DashboardView from './DashboardView';
import ExecutiveDashboard from './ExecutiveDashboard';

function StatCard({ label, value, sub, icon: Icon, iconBg, iconColor }: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div
      className="rounded-lg p-5 sm:p-6"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E8ECF1',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm" style={{ color: '#8B95A5' }}>{label}</span>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: iconBg }}
        >
          <Icon size={16} style={{ color: iconColor }} />
        </div>
      </div>
      <div className="text-3xl font-bold mb-1" style={{ color: '#1E2A3A' }}>{value}</div>
      <div className="text-xs" style={{ color: '#8B95A5' }}>{sub}</div>
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

  const statusBadgeStyle = (status: string) => {
    const styles: Record<string, { backgroundColor: string; color: string }> = {
      todo:       { backgroundColor: '#E0E7FF', color: '#4338CA' },
      inprogress: { backgroundColor: '#FEF3C7', color: '#D97706' },
      review:     { backgroundColor: '#F3E8FF', color: '#7C3AED' },
      done:       { backgroundColor: '#D1FAE5', color: '#059669' },
    };
    return styles[status] || { backgroundColor: '#F0F3F8', color: '#4A5568' };
  };

  const statusLabel = (status: string) => {
    const labels: Record<string, string> = {
      todo: 'To Do', inprogress: 'In Progress', review: 'Review', done: 'Done',
    };
    return labels[status] || status;
  };

  const standardView = (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Tasks"   value={totalTasks}      sub="Across all clients"   icon={CheckCircle2} iconBg="#E0E7FF" iconColor="#4F6AE8" />
        <StatCard label="In Progress"   value={inProgressTasks} sub="Currently active"     icon={Clock}        iconBg="#FEF3C7" iconColor="#D97706" />
        <StatCard label="Completed"     value={doneTasks}       sub={`${totalTasks > 0 ? Math.round((doneTasks/totalTasks)*100) : 0}% completion rate`} icon={TrendingUp} iconBg="#D1FAE5" iconColor="#059669" />
        <StatCard label="Urgent Items"  value={urgentTasks}     sub="Needs attention"      icon={AlertCircle}  iconBg="#FEE2E2" iconColor="#DC2626" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Client Overview */}
        <div
          className="lg:col-span-2 rounded-lg p-5 sm:p-6"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E8ECF1',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-lg" style={{ color: '#1E2A3A' }}>Client Overview</h2>
            <Link href="/clients" className="text-xs flex items-center gap-1 hover:underline" style={{ color: '#4F6AE8' }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-5">
            {tasksByClient.map(({ client, total, done }) => {
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              const inProg = TASKS.filter(t => t.clientId === client.id && t.status === 'inprogress').length;
              return (
                <div key={client.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: client.color + '20', color: client.color }}
                      >
                        {client.logo}
                      </span>
                      <div>
                        <div className="text-sm font-medium" style={{ color: '#1E2A3A' }}>{client.name}</div>
                        <div className="text-xs" style={{ color: '#8B95A5' }}>{client.industry}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold" style={{ color: '#1E2A3A' }}>{done}/{total}</div>
                      <div className="text-xs" style={{ color: '#8B95A5' }}>{inProg} active</div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#E0E7FF' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: '#4F6AE8' }}
                    />
                  </div>
                  <div className="text-xs mt-1" style={{ color: '#8B95A5' }}>{pct}% complete</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Activity */}
        <div
          className="rounded-lg p-5 sm:p-6"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E8ECF1',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-lg flex items-center gap-2" style={{ color: '#1E2A3A' }}>
              <Users size={15} style={{ color: '#4F6AE8' }} />
              Team Load
            </h2>
          </div>
          <div className="space-y-4">
            {TEAM_MEMBERS.map(member => {
              const memberTasks = TASKS.filter(
                t => t.assigneeId === member.id && t.status !== 'done' && !t.isMilestone
              );
              const urgent = memberTasks.filter(t => t.priority === 'Urgent').length;
              const maxTasks = 10;
              const pct = Math.min(100, (memberTasks.length / maxTasks) * 100);
              return (
                <div key={member.id} className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium" style={{ color: '#1E2A3A' }}>{member.name.split(' ')[0]}</span>
                      <span className="text-xs" style={{ color: '#8B95A5' }}>{memberTasks.length} tasks</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#E0E7FF' }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: '#4F6AE8' }}
                      />
                    </div>
                    {urgent > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-xs mt-0.5" style={{ color: '#DC2626' }}>
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
      <div
        className="mt-6 rounded-lg p-5 sm:p-6"
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E8ECF1',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-lg" style={{ color: '#1E2A3A' }}>Upcoming Deadlines</h2>
          <Link href="/kanban" className="text-xs flex items-center gap-1 hover:underline" style={{ color: '#4F6AE8' }}>
            View board <ArrowRight size={12} />
          </Link>
        </div>
        {/* Mobile: card list */}
        <div className="sm:hidden space-y-3">
          {recentTasks.map(task => {
            const client = CLIENTS.find(c => c.id === task.clientId);
            const assignee = TEAM_MEMBERS.find(m => m.id === task.assigneeId);
            if (!client || !assignee) return null;
            const badge = statusBadgeStyle(task.status);
            return (
              <div
                key={task.id}
                className="flex flex-col gap-2 p-3 rounded-lg"
                style={{ backgroundColor: '#F0F3F8', border: '1px solid #E8ECF1' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-sm leading-snug" style={{ color: '#1E2A3A' }}>{task.title}</span>
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0"
                    style={badge}
                  >
                    {statusLabel(task.status)}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-wrap text-xs" style={{ color: '#8B95A5' }}>
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
                {['Task', 'Client', 'Assignee', 'Priority', 'Due', 'Status'].map(h => (
                  <th
                    key={h}
                    className="pb-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: '#8B95A5' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentTasks.map(task => {
                const client = CLIENTS.find(c => c.id === task.clientId);
                const assignee = TEAM_MEMBERS.find(m => m.id === task.assigneeId);
                if (!client || !assignee) return null;
                const badge = statusBadgeStyle(task.status);
                return (
                  <tr
                    key={task.id}
                    className="transition-colors hover:bg-gray-50"
                    style={{ borderTop: '1px solid #E8ECF1' }}
                  >
                    <td className="py-3 pr-4">
                      <span className="font-medium" style={{ color: '#1E2A3A' }}>{task.title}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
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
                        <span style={{ color: '#4A5568' }}>{assignee.name.split(' ')[0]}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex items-center gap-1 text-xs font-medium">
                        <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`} />
                        <span style={{ color: '#4A5568' }}>{task.priority}</span>
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-xs" style={{ color: '#4A5568' }}>
                      {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-3">
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full"
                        style={badge}
                      >
                        {statusLabel(task.status)}
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
    <div className="pt-16 min-h-screen" style={{ backgroundColor: '#F0F3F8' }}>
      <TopBar title="Dashboard" subtitle="Welcome back, Joe" />
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <DashboardView standardView={standardView} executiveView={executiveView} />
      </div>
    </div>
  );
}
