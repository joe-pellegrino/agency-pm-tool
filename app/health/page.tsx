'use client';

import { useState } from 'react';
import { Client, Task } from '@/lib/data';
import { useAppData } from '@/lib/contexts/AppDataContext';
import { TrendingUp, TrendingDown, Minus, Activity, Clock, CheckCircle, AlertTriangle, Users, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';

/**
 * Client Health Score Formula:
 * - Base score = (done_count / total_count) * 100
 * - Overdue penalty: subtract 10 points per overdue task (due_date < today AND status != 'done')
 * - Final score capped 0–100
 * - If no tasks exist for a client: health = 100 (no news is good news)
 * - "Unhealthy" = score < 70 OR 2+ overdue tasks
 */
function calcClientHealth(clientId: string, tasks: Task[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const clientTasks = tasks.filter(t => t.clientId === clientId && !t.isMilestone);
  const total = clientTasks.length;
  const done = clientTasks.filter(t => t.status === 'done').length;
  const overdue = clientTasks.filter(t => {
    if (t.status === 'done') return false;
    if (!t.dueDate) return false;
    return new Date(t.dueDate) < today;
  }).length;
  const inProgress = clientTasks.filter(t => t.status === 'inprogress').length;
  const inReview = clientTasks.filter(t => t.status === 'review').length;

  let score = total > 0 ? Math.round((done / total) * 100) - (overdue * 10) : 100;
  score = Math.min(100, Math.max(0, score));

  return { score, total, done, overdue, inProgress, inReview };
}

function getScoreColor(score: number): string {
  if (score > 80) return 'text-green-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

function getScoreBg(score: number): string {
  if (score > 80) return 'from-green-500 to-emerald-600';
  if (score >= 60) return 'from-amber-500 to-orange-500';
  return 'from-red-500 to-rose-600';
}

function getScoreLabel(score: number): string {
  if (score > 80) return 'Healthy';
  if (score >= 60) return 'At Risk';
  return 'Critical';
}

function TrendIcon({ score }: { score: number }) {
  if (score > 80) return <TrendingUp size={16} className="text-green-500" />;
  if (score >= 60) return <Minus size={16} className="text-gray-400" />;
  return <TrendingDown size={16} className="text-red-500" />;
}

function ScoreGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;
  const colorClass = score > 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r="36" fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="44"
          cy="44"
          r="36"
          fill="none"
          stroke={colorClass}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
        <span className="text-[10px] text-gray-400 font-medium">{getScoreLabel(score)}</span>
      </div>
    </div>
  );
}

function ClientHealthCard({ client }: { client: Client }) {
  const { TASKS = [] } = useAppData();
  const [expanded, setExpanded] = useState(false);
  const { score, total, done, overdue, inProgress, inReview } = calcClientHealth(client.id, TASKS);
  const clientTasks = TASKS.filter(t => t.clientId === client.id);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-1" style={{ backgroundColor: client.color }} />

      <div style={{ padding: '24px 32px' }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: client.color }}
            >
              {client.logo}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{client.name}</h3>
              <p className="text-xs text-gray-500">{client.industry}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendIcon score={score} />
            <span className="text-xs text-gray-500">{getScoreLabel(score)}</span>
          </div>
        </div>

        {/* Score gauge + stats */}
        <div className="flex items-center gap-5 mb-5">
          <ScoreGauge score={score} />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle size={14} className="text-green-500" />
              <span className="text-gray-600 dark:text-gray-300">
                <span className="font-semibold text-gray-900 dark:text-white">{done}</span> tasks completed
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock size={14} className="text-blue-500" />
              <span className="text-gray-600 dark:text-gray-300">
                <span className="font-semibold text-gray-900 dark:text-white">{inProgress}</span> in progress
              </span>
            </div>
            {overdue > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle size={14} className="text-red-500" />
                <span className="text-red-600 dark:text-red-400">
                  <span className="font-semibold">{overdue}</span> overdue
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Task stats grid */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-4">
          {[
            { label: 'Total', value: total, color: 'text-gray-700 dark:text-gray-200', bg: 'bg-gray-100 dark:bg-gray-700' },
            { label: 'Done', value: done, color: 'text-green-700', bg: 'bg-green-100 dark:bg-green-900/30' },
            { label: 'Review', value: inReview, color: 'text-amber-700', bg: 'bg-amber-100 dark:bg-amber-900/30' },
            { label: 'Overdue', value: overdue, color: overdue > 0 ? 'text-red-700' : 'text-gray-500', bg: overdue > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-700' },
          ].map(stat => (
            <div key={stat.label} className={`${stat.bg} rounded-lg p-2 text-center`}>
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-gray-500 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-end pt-3 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-[#3B5BDB] hover:text-[#3B5BDB] transition-colors font-medium"
          >
            Details
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>

        {/* Expanded: task breakdown */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Active Tasks</p>
            <div className="space-y-2">
              {clientTasks.filter(t => t.status !== 'done').slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 dark:text-gray-300 truncate flex-1 pr-3">{task.title}</span>
                  <span className={`px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
                    task.status === 'review' ? 'bg-amber-100 text-amber-700' :
                    task.status === 'inprogress' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {task.status === 'inprogress' ? 'In Progress' : task.status === 'review' ? 'Review' : 'To Do'}
                  </span>
                </div>
              ))}
              {clientTasks.filter(t => t.status !== 'done').length === 0 && (
                <p className="text-xs text-gray-400">No active tasks</p>
              )}
              {clientTasks.filter(t => t.status !== 'done').length > 5 && (
                <p className="text-xs text-gray-400 pl-1">+{clientTasks.filter(t => t.status !== 'done').length - 5} more</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HealthPage() {
  const { TASKS = [], CLIENTS = [], TEAM_MEMBERS = [] } = useAppData();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalOverdue = TASKS.filter(t =>
    t.status !== 'done' && t.dueDate && new Date(t.dueDate) < today
  ).length;

  // Calculate avg health from real data
  const healthScores = CLIENTS.map(c => calcClientHealth(c.id, TASKS).score);
  const avgHealth = CLIENTS.length > 0
    ? Math.round(healthScores.reduce((a, b) => a + b, 0) / CLIENTS.length)
    : 100;

  const allTasksDone = TASKS.filter(t => t.status === 'done').length;
  const allTasksTotal = TASKS.length;
  const completionRate = allTasksTotal > 0 ? Math.round((allTasksDone / allTasksTotal) * 100) : 0;

  // Team utilization based on active (non-done) tasks per member
  const activeTasks = TASKS.filter(t => t.status !== 'done').length;
  const maxCapacity = TEAM_MEMBERS.length > 0 ? TEAM_MEMBERS.length * 20 : 1; // ~20 tasks per person as baseline
  const utilization = Math.min(100, Math.round((activeTasks / maxCapacity) * 100));

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-page)' }}>
      <TopBar title="Client Health" subtitle="Relationship scores and task performance per client" />

      <div className="p-4 sm:p-8">
        {/* Summary bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: <Activity size={20} className="text-[#3B5BDB]" />,
              label: 'Avg Health Score',
              value: `${avgHealth}`,
              sub: avgHealth >= 80 ? 'All clients healthy' : avgHealth >= 60 ? 'Some at risk' : 'Needs attention',
              color: 'bg-[#EEF2FF] dark:bg-indigo-900/20',
              iconBg: 'bg-[#E0E7FF] dark:bg-indigo-900/40',
            },
            {
              icon: <AlertTriangle size={20} className="text-red-500" />,
              label: 'Total Overdue',
              value: `${totalOverdue}`,
              sub: totalOverdue === 0 ? 'All on track' : `${totalOverdue} task${totalOverdue !== 1 ? 's' : ''} past due`,
              color: totalOverdue > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20',
              iconBg: totalOverdue > 0 ? 'bg-red-100 dark:bg-red-900/40' : 'bg-green-100 dark:bg-green-900/40',
            },
            {
              icon: <Users size={20} className="text-purple-600" />,
              label: 'Active Tasks',
              value: `${activeTasks}`,
              sub: `${TEAM_MEMBERS.length} team members`,
              color: 'bg-purple-50 dark:bg-purple-900/20',
              iconBg: 'bg-purple-100 dark:bg-purple-900/40',
            },
            {
              icon: <BarChart3 size={20} className="text-green-600" />,
              label: 'Completion Rate',
              value: `${completionRate}%`,
              sub: `${allTasksDone} of ${allTasksTotal} tasks done`,
              color: 'bg-green-50 dark:bg-green-900/20',
              iconBg: 'bg-green-100 dark:bg-green-900/40',
            },
          ].map((stat, i) => (
            <div key={i} className={`${stat.color} rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex items-start gap-4`}>
              <div className={`${stat.iconBg} w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Health score comparison bar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 mb-8">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Health Score Comparison</h3>
          {CLIENTS.length === 0 ? (
            <p className="text-sm text-gray-400">No clients found</p>
          ) : (
            <div className="space-y-3">
              {CLIENTS.map(client => {
                const { score } = calcClientHealth(client.id, TASKS);
                return (
                  <div key={client.id} className="flex items-center gap-2 sm:gap-4">
                    <div className="w-20 sm:w-28 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 truncate flex-shrink-0">{client.name}</div>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${getScoreBg(score)} transition-all duration-700`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <div className="w-8 sm:w-10 text-right flex-shrink-0">
                      <span className={`text-sm font-bold ${getScoreColor(score)}`}>{score}</span>
                    </div>
                    <div className="hidden sm:flex w-16 items-center gap-1">
                      <TrendIcon score={score} />
                      <span className="text-xs text-gray-500">{getScoreLabel(score)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Client cards */}
        {CLIENTS.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users size={40} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">No clients found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {CLIENTS.map(client => (
              <ClientHealthCard key={client.id} client={client} />
            ))}
          </div>
        )}

        {/* Score legend */}
        <div className="mt-6 flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-gray-500">
          <span className="font-medium text-gray-600 dark:text-gray-400">Score legend:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Healthy (&gt;80)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>At Risk (60–80)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Critical (&lt;60)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
