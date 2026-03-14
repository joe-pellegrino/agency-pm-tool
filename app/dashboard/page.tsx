import TopBar from '@/components/layout/TopBar';
import { getAllData, PRIORITY_DOT } from '@/lib/supabase/queries';
import { AlertCircle, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import DashboardView from './DashboardView';
import ExecutiveDashboard from './ExecutiveDashboard';
import TeamLoadCard from '@/components/dashboard/TeamLoadCard';
import StatCardLink from '@/components/dashboard/StatCardLink';

function DonutRing({ pct, color = 'var(--color-primary)' }: { pct: number; color?: string }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx="24" cy="24" r={r} fill="none" stroke="var(--color-border)" strokeWidth="6" />
      <circle
        cx="24" cy="24" r={r} fill="none"
        stroke={color} strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`}
      />
    </svg>
  );
}

function StatCard({ label, value, sub, pct, donutColor }: {
  label: string;
  value: string | number;
  sub: string;
  pct: number;
  donutColor?: string;
}) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-white)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '20px 24px',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
          {label}
        </div>
        <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>{value}</div>
        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>{sub}</div>
      </div>
      <DonutRing pct={pct} color={donutColor} />
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
      todo:       { backgroundColor: 'var(--color-donut-track)', color: '#4338CA' },
      inprogress: { backgroundColor: '#FEF3C7', color: '#D97706' },
      review:     { backgroundColor: '#F3E8FF', color: '#7C3AED' },
      done:       { backgroundColor: '#D1FAE5', color: '#059669' },
    };
    return styles[status] || { backgroundColor: 'var(--color-bg-page)', color: 'var(--color-text-secondary)' };
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
        <StatCardLink href="/kanban?status=todo,inprogress,review">
          <StatCard label="Total Tasks"   value={totalTasks}      sub="Across all clients"   pct={totalTasks > 0 ? Math.min(100, Math.round((totalTasks/50)*100)) : 0} donutColor="var(--color-primary)" />
        </StatCardLink>
        <StatCardLink href="/kanban?status=inprogress">
          <StatCard label="In Progress"   value={inProgressTasks} sub="Currently active"     pct={totalTasks > 0 ? Math.round((inProgressTasks/totalTasks)*100) : 0} donutColor="#F59F00" />
        </StatCardLink>
        <StatCardLink href="/kanban?status=done">
          <StatCard label="Completed"     value={doneTasks}       sub={`${totalTasks > 0 ? Math.round((doneTasks/totalTasks)*100) : 0}% completion rate`} pct={totalTasks > 0 ? Math.round((doneTasks/totalTasks)*100) : 0} donutColor="#2BB673" />
        </StatCardLink>
        <StatCardLink href="/kanban?priority=Urgent">
          <StatCard label="Urgent Items"  value={urgentTasks}     sub="Needs attention"      pct={totalTasks > 0 ? Math.round((urgentTasks/totalTasks)*100) : 0} donutColor="#E03131" />
        </StatCardLink>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Client Overview */}
        <div
          className="lg:col-span-2 rounded-lg p-5 sm:p-6"
          style={{
            backgroundColor: 'var(--color-white)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-lg" style={{ color: 'var(--color-text-primary)' }}>Client Overview</h2>
            <Link href="/clients" className="text-xs flex items-center gap-1 hover:underline" style={{ color: 'var(--color-primary)' }}>
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
                        style={{ backgroundColor: '#000000', color: '#ffffff' }}
                      >
                        {client.logo}
                      </span>
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{client.name}</div>
                        <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{client.industry}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{done}/{total}</div>
                      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{inProg} active</div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-donut-track)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: 'var(--color-primary)' }}
                    />
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{pct}% complete</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Activity */}
        <TeamLoadCard teamMembers={TEAM_MEMBERS} tasks={TASKS} />
      </div>

      {/* Recent Tasks */}
      <div
        className="mt-6 rounded-lg p-5 sm:p-6"
        style={{
          backgroundColor: 'var(--color-white)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-lg" style={{ color: 'var(--color-text-primary)' }}>Upcoming Deadlines</h2>
          <Link href="/kanban" className="text-xs flex items-center gap-1 hover:underline" style={{ color: 'var(--color-primary)' }}>
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
                style={{ backgroundColor: 'var(--color-bg-page)', border: '1px solid var(--color-border)' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-sm leading-snug" style={{ color: 'var(--color-text-primary)' }}>{task.title}</span>
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0"
                    style={badge}
                  >
                    {statusLabel(task.status)}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-wrap text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  <span
                    className="inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: '#000000', color: '#ffffff' }}
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
                    style={{ color: 'var(--color-text-muted)' }}
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
                    style={{ borderTop: '1px solid var(--color-border)' }}
                  >
                    <td className="py-3 pr-4">
                      <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{task.title}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: '#000000', color: '#ffffff' }}
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
                        <span style={{ color: 'var(--color-text-secondary)' }}>{assignee.name.split(' ')[0]}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex items-center gap-1 text-xs font-medium">
                        <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`} />
                        <span style={{ color: 'var(--color-text-secondary)' }}>{task.priority}</span>
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
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
    <div style={{ backgroundColor: 'var(--color-bg-page)', minHeight: '100vh' }}>
      <TopBar />
      <div style={{ padding: '24px 32px', maxWidth: '1400px' }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Dashboard</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Welcome back, Joe</p>
        </div>
        <DashboardView standardView={standardView} executiveView={executiveView} />
      </div>
    </div>
  );
}
