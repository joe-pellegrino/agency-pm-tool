'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, ChevronRight, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useAppData } from '@/lib/contexts/AppDataContext';

interface Strategy {
  id: string;
  clientId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  quarter?: string;
}

interface Initiative {
  id: string;
  clientId: string;
  name: string;
  startDate: string;
  endDate: string;
  strategyId?: string;
  clientPillarId?: string | null;
  taskIds?: string[];
  progress?: number;
}

interface Pillar {
  id: string;
  clientId: string;
  name: string;
  color: string;
  description?: string;
}

interface Task {
  id: string;
  title: string;
  clientId: string;
  status: string;
  dueDate?: string;
  startDate?: string;
  endDate?: string;
}

interface YearRoadmapProps {
  strategies: Strategy[];
  initiatives: Initiative[];
  pillars: Pillar[];
  clientId: string;
}

// Helper: calculate position percentage within the year
function getPositionPercent(dateStr: string, year: number): number {
  const date = new Date(`${dateStr}T00:00:00Z`);
  const yearStart = new Date(`${year}-01-01T00:00:00Z`);
  const yearEnd = new Date(`${year + 1}-01-01T00:00:00Z`);
  const msInYear = yearEnd.getTime() - yearStart.getTime();
  const msFromStart = date.getTime() - yearStart.getTime();
  const percent = Math.max(0, Math.min(100, (msFromStart / msInYear) * 100));
  return percent;
}

// Helper: calculate width percentage of a bar
function getWidthPercent(startStr: string, endStr: string, year: number): number {
  const startPercent = getPositionPercent(startStr, year);
  const endPercent = getPositionPercent(endStr, year);
  return Math.max(1.5, endPercent - startPercent);
}

// Helper: get a color for a strategy by index
function getStrategyColor(index: number): string {
  const colors = [
    '#EEF2FF', // indigo
    '#F0FDF4', // green
    '#FEF2F2', // red
    '#FFFBEB', // amber
    '#F0F9FF', // blue
    '#FCF0FF', // purple
    '#F5F3FF', // violet
  ];
  return colors[index % colors.length];
}

function getStrategyTextColor(index: number): string {
  const colors = [
    '#3730A3', // indigo
    '#166534', // green
    '#7F1D1D', // red
    '#92400E', // amber
    '#0C4A6E', // blue
    '#6B21A8', // purple
    '#4C1D95', // violet
  ];
  return colors[index % colors.length];
}

// Task status color classes
const TASK_STATUS_COLORS: Record<string, string> = {
  todo: 'bg-gray-100 border-gray-300 text-gray-600',
  inprogress: 'bg-blue-100 border-blue-300 text-blue-700',
  review: 'bg-amber-100 border-amber-300 text-amber-700',
  done: 'bg-green-100 border-green-300 text-green-700',
};

export default function YearRoadmap({
  strategies,
  initiatives,
  pillars,
  clientId,
}: YearRoadmapProps) {
  const { TASKS = [] } = useAppData();
  const currentYear = new Date().getFullYear();
  const [expandedInitiatives, setExpandedInitiatives] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedInitiatives(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Calculate "today" position
  const todayPercent = useMemo(() => {
    const today = new Date();
    const yearStart = new Date(`${currentYear}-01-01T00:00:00Z`);
    const yearEnd = new Date(`${currentYear + 1}-01-01T00:00:00Z`);
    const msInYear = yearEnd.getTime() - yearStart.getTime();
    const msFromStart = today.getTime() - yearStart.getTime();
    return Math.max(0, Math.min(100, (msFromStart / msInYear) * 100));
  }, [currentYear]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Sort strategies by startDate
  const sortedStrategies = useMemo(() => {
    return [...strategies]
      .filter(s => s.clientId === clientId)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [strategies, clientId]);

  // Group initiatives by strategy
  const initiativesByStrategy = useMemo(() => {
    const map: Record<string, Initiative[]> = {};
    sortedStrategies.forEach(s => {
      map[s.id] = [];
    });

    initiatives
      .filter(i => i.clientId === clientId)
      .forEach(i => {
        if (i.strategyId && map[i.strategyId] !== undefined) {
          map[i.strategyId].push(i);
        }
      });

    return map;
  }, [sortedStrategies, initiatives, clientId]);

  // Get pillar data for an initiative
  const getPillarForInitiative = (pillarId?: string | null) => {
    if (!pillarId) return null;
    return pillars.find(p => p.id === pillarId) || null;
  };

  // Get tasks for an initiative
  const getTasksForInitiative = (initiativeId: string): Task[] => {
    const initiative = initiatives.find(i => i.id === initiativeId);
    if (!initiative || !initiative.taskIds) return [];
    return TASKS.filter(t => initiative.taskIds!.includes(t.id) && t.clientId === clientId) as Task[];
  };

  // Empty state
  if (sortedStrategies.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/30">
        <CalendarDays size={28} className="mx-auto mb-2 opacity-30 text-gray-400" />
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          No strategies defined yet. Create a strategy to see your roadmap.
        </p>
        <Link href={`/strategy?clientId=${clientId}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block font-medium">
          Create Strategy →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <CalendarDays size={18} className="text-blue-600 dark:text-blue-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">This Year&apos;s Roadmap</h3>
      </div>

      {/* Timeline Container */}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
        <div className="inline-block min-w-full">
          {/* Month Headers */}
          <div className="flex">
            {/* Strategy label column */}
            <div className="w-48 flex-shrink-0 px-3 py-3 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50" />

            {/* Month columns */}
            <div className="flex flex-1">
              {months.map((month, idx) => (
                <div
                  key={idx}
                  className="flex-1 min-w-[60px] px-2 py-3 text-center border-r border-gray-100 dark:border-gray-700 last:border-r-0 bg-gray-50 dark:bg-gray-900/50"
                >
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">{month}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* Strategy Rows */}
          {sortedStrategies.map((strategy, strategyIndex) => {
            const strategyInitiatives = initiativesByStrategy[strategy.id] || [];
            const bgColor = getStrategyColor(strategyIndex);
            const textColor = getStrategyTextColor(strategyIndex);
            const isActive = strategy.status === 'active';

            return (
              <div key={strategy.id} className="flex border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                {/* Strategy Label */}
                <div className="w-48 flex-shrink-0 px-3 py-3 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-col justify-start gap-1">
                  <Link
                    href={`/strategy?clientId=${clientId}`}
                    className="text-sm font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 break-words whitespace-normal hover:underline leading-snug"
                    title={strategy.name}
                  >
                    {strategy.name}
                  </Link>
                  {isActive && (
                    <span className="self-start text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 flex-shrink-0">
                      Active
                    </span>
                  )}
                </div>

                {/* Timeline */}
                <div className="flex-1 relative">
                  {/* Background: Month grid */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {months.map((_, idx) => (
                      <div
                        key={idx}
                        className="flex-1 min-w-[60px] border-r border-gray-100 dark:border-gray-700 last:border-r-0"
                      />
                    ))}
                  </div>

                  {/* Today marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 opacity-70 pointer-events-none"
                    style={{ left: `${todayPercent}%` }}
                  />

                  {/* Initiative rows */}
                  <div className="relative z-10 py-2 flex flex-col gap-1 min-h-24">
                    {strategyInitiatives.map((initiative) => {
                      const leftPercent = getPositionPercent(initiative.startDate, currentYear);
                      const widthPercent = getWidthPercent(initiative.startDate, initiative.endDate, currentYear);
                      const pillar = getPillarForInitiative(initiative.clientPillarId);
                      const tasks = getTasksForInitiative(initiative.id);
                      const isExpanded = expandedInitiatives.has(initiative.id);

                      return (
                        <div key={initiative.id}>
                          {/* Initiative Row */}
                          <div className="relative h-8 flex items-center">
                            {/* Initiative bar wrapper */}
                            <div
                              className="absolute flex items-center gap-0.5"
                              style={{
                                left: `${leftPercent}%`,
                                width: `calc(${widthPercent}%)`,
                              }}
                            >
                              {/* Expand toggle */}
                              <button
                                className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors z-30"
                                onClick={() => toggleExpand(initiative.id)}
                                title={isExpanded ? 'Collapse tasks' : 'Expand tasks'}
                              >
                                {isExpanded
                                  ? <ChevronDown size={10} />
                                  : <ChevronRight size={10} />
                                }
                              </button>

                              {/* Initiative Bar */}
                              <Link href={`/projects/${initiative.id}`} className="flex-1 min-w-0">
                                <div
                                  className="rounded px-2 py-1 border border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all"
                                  style={{
                                    backgroundColor: bgColor,
                                    color: textColor,
                                  }}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-xs font-semibold truncate whitespace-nowrap">
                                      {initiative.name}
                                    </span>
                                    {pillar && (
                                      <Link
                                        href={`/clients/${clientId}/pillars/${pillar.id}`}
                                        className="flex-shrink-0 text-[9px] font-medium px-1.5 py-0.5 rounded-full text-white hover:opacity-90 transition-opacity"
                                        style={{ backgroundColor: pillar.color }}
                                        title={pillar.name}
                                        onClick={e => e.stopPropagation()}
                                      >
                                        {pillar.name.substring(0, 3).toUpperCase()}
                                      </Link>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            </div>
                          </div>

                          {/* Task Sub-Rows (expanded) */}
                          {isExpanded && tasks.map((task) => {
                            const taskStart = task.startDate || task.dueDate;
                            const taskEnd = task.endDate || task.dueDate || task.startDate;
                            if (!taskStart) return null;

                            const taskLeft = getPositionPercent(taskStart, currentYear);
                            const taskWidth = getWidthPercent(taskStart, taskEnd!, currentYear);
                            const colorClass = TASK_STATUS_COLORS[task.status] || TASK_STATUS_COLORS.todo;

                            return (
                              <div key={task.id} className="relative h-6 flex items-center">
                                <div
                                  className="absolute"
                                  style={{
                                    left: `calc(${taskLeft}% + 20px)`,
                                    width: `calc(${taskWidth}% - 4px)`,
                                    minWidth: '40px',
                                  }}
                                >
                                  <Link href={`/tasks/${task.id}`}>
                                    <div
                                      className={`rounded px-1.5 py-0.5 border text-[10px] font-medium truncate hover:opacity-80 transition-opacity ${colorClass}`}
                                      title={task.title}
                                    >
                                      {task.title}
                                    </div>
                                  </Link>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
