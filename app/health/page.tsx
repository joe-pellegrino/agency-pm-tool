'use client';

import { useState } from 'react';
import { TASKS, CLIENTS, TEAM_MEMBERS, TIME_ENTRIES, Client } from '@/lib/data';
import { TrendingUp, TrendingDown, Minus, Activity, Clock, CheckCircle, AlertTriangle, Users, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';

// Mock health data per client
const CLIENT_HEALTH: Record<string, {
  score: number;
  trend: 'up' | 'down' | 'stable';
  sentiment: 'positive' | 'neutral' | 'cautious';
  lastMeeting: string;
  hoursThisMonth: number;
  sentimentNote: string;
}> = {
  'happy-days': {
    score: 75,
    trend: 'stable',
    sentiment: 'positive',
    lastMeeting: '2026-03-28',
    hoursThisMonth: 42,
    sentimentNote: 'Client is engaged and responsive. Excited about Q2 campaign launch.',
  },
  'k-pacho': {
    score: 70,
    trend: 'stable',
    sentiment: 'neutral',
    lastMeeting: '2026-03-27',
    hoursThisMonth: 31,
    sentimentNote: 'Slight hesitation on ad creative direction. Needs closer alignment.',
  },
  'the-refuge': {
    score: 70,
    trend: 'up',
    sentiment: 'positive',
    lastMeeting: '2026-03-31',
    hoursThisMonth: 56,
    sentimentNote: 'Grand opening was a huge success. Momentum is strong.',
  },
};

const SENTIMENT_EMOJI: Record<string, string> = {
  positive: '😊',
  neutral: '😐',
  cautious: '😟',
};

const SENTIMENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  positive: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
  neutral: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
  cautious: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
};

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

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <TrendingUp size={16} className="text-green-500" />;
  if (trend === 'down') return <TrendingDown size={16} className="text-red-500" />;
  return <Minus size={16} className="text-gray-400" />;
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
  const [expanded, setExpanded] = useState(false);
  const health = CLIENT_HEALTH[client.id];
  const clientTasks = TASKS.filter(t => t.clientId === client.id);
  const completed = clientTasks.filter(t => t.status === 'done').length;
  const inReview = clientTasks.filter(t => t.status === 'review').length;
  const overdue = clientTasks.filter(t => {
    return t.status !== 'done' && new Date(t.dueDate) < new Date();
  }).length;
  const inProgress = clientTasks.filter(t => t.status === 'inprogress').length;

  const sentiment = SENTIMENT_COLORS[health.sentiment];
  const lastMeetingDate = new Date(health.lastMeeting);
  const daysSince = Math.floor((new Date().getTime() - lastMeetingDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
      {/* Top accent bar */}
      <div className="h-1" style={{ backgroundColor: client.color }} />

      <div className="p-6">
        {/* Header row */}
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
            <TrendIcon trend={health.trend} />
            <span className="text-xs text-gray-500 capitalize">{health.trend}</span>
          </div>
        </div>

        {/* Score + Sentiment */}
        <div className="flex items-center gap-5 mb-5">
          <ScoreGauge score={health.score} />
          <div className="flex-1 space-y-3">
            {/* Sentiment */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${sentiment.bg} ${sentiment.border}`}>
              <span className="text-base">{SENTIMENT_EMOJI[health.sentiment]}</span>
              <div>
                <p className={`text-xs font-semibold capitalize ${sentiment.text}`}>{health.sentiment}</p>
                <p className="text-[11px] text-gray-500 leading-tight line-clamp-2">{health.sentimentNote}</p>
              </div>
            </div>

            {/* Hours */}
            <div className="flex items-center gap-2 text-sm">
              <Clock size={14} className="text-indigo-500" />
              <span className="text-gray-600 dark:text-gray-300">
                <span className="font-semibold text-gray-900 dark:text-white">{health.hoursThisMonth}h</span>
                {' '}tracked this month
              </span>
            </div>
          </div>
        </div>

        {/* Task stats grid */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-4">
          {[
            { label: 'Total', value: clientTasks.length, color: 'text-gray-700 dark:text-gray-200', bg: 'bg-gray-100 dark:bg-gray-700' },
            { label: 'Done', value: completed, color: 'text-green-700', bg: 'bg-green-100 dark:bg-green-900/30' },
            { label: 'Review', value: inReview, color: 'text-amber-700', bg: 'bg-amber-100 dark:bg-amber-900/30' },
            { label: 'Overdue', value: overdue, color: overdue > 0 ? 'text-red-700' : 'text-gray-500', bg: overdue > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-700' },
          ].map(stat => (
            <div key={stat.label} className={`${stat.bg} rounded-lg p-2 text-center`}>
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-gray-500 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Last meeting */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100 dark:border-gray-700">
          <span>Last meeting: <span className="font-medium text-gray-700 dark:text-gray-300">
            {lastMeetingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span> ({daysSince}d ago)</span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 transition-colors font-medium"
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
  const totalOverdue = TASKS.filter(t =>
    t.status !== 'done' && new Date(t.dueDate) < new Date()
  ).length;

  const avgHealth = Math.round(
    Object.values(CLIENT_HEALTH).reduce((sum, h) => sum + h.score, 0) / Object.keys(CLIENT_HEALTH).length
  );

  const totalHours = Object.values(CLIENT_HEALTH).reduce((sum, h) => sum + h.hoursThisMonth, 0);
  const maxCapacity = TEAM_MEMBERS.length * 160; // ~160h per person per month
  const utilization = Math.round((totalHours / maxCapacity) * 100);

  const allTasksDone = TASKS.filter(t => t.status === 'done').length;
  const allTasksTotal = TASKS.length;
  const completionRate = Math.round((allTasksDone / allTasksTotal) * 100);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopBar title="Client Health" subtitle="Relationship scores, sentiment, and task performance per client" />

      <div className="pt-16 p-4 sm:p-8">
        {/* Summary bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: <Activity size={20} className="text-indigo-600" />,
              label: 'Avg Health Score',
              value: `${avgHealth}`,
              sub: avgHealth >= 80 ? 'All clients healthy' : avgHealth >= 60 ? 'Some at risk' : 'Needs attention',
              color: 'bg-indigo-50 dark:bg-indigo-900/20',
              iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
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
              label: 'Team Utilization',
              value: `${utilization}%`,
              sub: `${totalHours}h of ${maxCapacity}h capacity`,
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

        {/* Health score bar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 mb-8">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Health Score Comparison</h3>
          <div className="space-y-3">
            {CLIENTS.map(client => {
              const health = CLIENT_HEALTH[client.id];
              return (
                <div key={client.id} className="flex items-center gap-2 sm:gap-4">
                  <div className="w-20 sm:w-28 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 truncate flex-shrink-0">{client.name}</div>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${getScoreBg(health.score)} transition-all duration-700`}
                      style={{ width: `${health.score}%` }}
                    />
                  </div>
                  <div className="w-8 sm:w-10 text-right flex-shrink-0">
                    <span className={`text-sm font-bold ${getScoreColor(health.score)}`}>{health.score}</span>
                  </div>
                  <div className="hidden sm:flex w-16 items-center gap-1">
                    <TrendIcon trend={health.trend} />
                    <span className="text-xs text-gray-500 capitalize">{health.trend}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Client cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {CLIENTS.map(client => (
            <ClientHealthCard key={client.id} client={client} />
          ))}
        </div>

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
