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

type RoadmapView = 'year' | 'quarter' | 'month' | '2weeks';

interface Column {
  label: string;
  startMs: number;
  endMs: number;
}

interface YearRoadmapProps {
  strategies: Strategy[];
  initiatives: Initiative[];
  pillars: Pillar[];
  clientId: string;
  onInitiativeClick?: (initiativeId: string) => void;
  onTaskClick?: (taskId: string) => void;
}

// Helper: calculate position percentage within a range
function getPositionPercent(dateStr: string, rangeStart: Date, rangeEnd: Date): number {
  const date = new Date(`${dateStr}T00:00:00Z`);
  const totalMs = rangeEnd.getTime() - rangeStart.getTime();
  const msFromStart = date.getTime() - rangeStart.getTime();
  return Math.max(0, Math.min(100, (msFromStart / totalMs) * 100));
}

// Helper: calculate width percentage of a bar within a range (clamped)
function getWidthPercent(startStr: string, endStr: string, rangeStart: Date, rangeEnd: Date): number {
  const startDate = new Date(`${startStr}T00:00:00Z`);
  const endDate = new Date(`${endStr}T00:00:00Z`);

  const clampedStart = new Date(Math.max(startDate.getTime(), rangeStart.getTime()));
  const clampedEnd = new Date(Math.min(endDate.getTime(), rangeEnd.getTime()));

  const totalMs = rangeEnd.getTime() - rangeStart.getTime();
  const barMs = clampedEnd.getTime() - clampedStart.getTime();

  if (barMs <= 0) return 0;
  const pct = (barMs / totalMs) * 100;
  return Math.max(1.5, pct);
}

// Helper: check if a date range overlaps with the visible range
function overlapsRange(startStr: string, endStr: string | undefined, rangeStart: Date, rangeEnd: Date): boolean {
  const start = new Date(`${startStr}T00:00:00Z`);
  const end = endStr ? new Date(`${endStr}T00:00:00Z`) : start;
  return start < rangeEnd && end > rangeStart;
}

// Build columns for a given view
function buildColumns(view: RoadmapView, now: Date): { rangeStart: Date; rangeEnd: Date; columns: Column[] } {
  const year = now.getFullYear();
  const month = now.getMonth();

  if (view === 'year') {
    const rangeStart = new Date(Date.UTC(year, 0, 1));
    const rangeEnd = new Date(Date.UTC(year + 1, 0, 1));
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const columns: Column[] = monthNames.map((label, idx) => ({
      label,
      startMs: Date.UTC(year, idx, 1),
      endMs: Date.UTC(year, idx + 1, 1),
    }));
    return { rangeStart, rangeEnd, columns };
  }

  if (view === 'quarter') {
    const quarterStartMonth = Math.floor(month / 3) * 3;
    const quarterEndMonth = quarterStartMonth + 3;
    const rangeStart = new Date(Date.UTC(year, quarterStartMonth, 1));
    const rangeEnd = new Date(Date.UTC(year, quarterEndMonth, 1));

    // Build weekly columns
    const columns: Column[] = [];
    let cursor = new Date(rangeStart);
    while (cursor < rangeEnd) {
      const weekStart = new Date(cursor);
      const weekEnd = new Date(Math.min(cursor.getTime() + 7 * 24 * 60 * 60 * 1000, rangeEnd.getTime()));
      const d = weekStart.getUTCDate();
      const mo = weekStart.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
      columns.push({ label: `${mo} ${d}`, startMs: weekStart.getTime(), endMs: weekEnd.getTime() });
      cursor = new Date(cursor.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
    return { rangeStart, rangeEnd, columns };
  }

  if (view === 'month') {
    const rangeStart = new Date(Date.UTC(year, month, 1));
    const rangeEnd = new Date(Date.UTC(year, month + 1, 1));

    // Build daily columns
    const columns: Column[] = [];
    let cursor = new Date(rangeStart);
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    while (cursor < rangeEnd) {
      const dayEnd = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
      const dayName = dayNames[cursor.getUTCDay()];
      const d = cursor.getUTCDate();
      columns.push({ label: `${dayName} ${d}`, startMs: cursor.getTime(), endMs: dayEnd.getTime() });
      cursor = dayEnd;
    }
    return { rangeStart, rangeEnd, columns };
  }

  // 2 weeks: today to today+14 days
  {
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const rangeStart = todayStart;
    const rangeEnd = new Date(todayStart.getTime() + 14 * 24 * 60 * 60 * 1000);

    const columns: Column[] = [];
    let cursor = new Date(rangeStart);
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    while (cursor < rangeEnd) {
      const dayEnd = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
      const dayName = dayNames[cursor.getUTCDay()];
      const d = cursor.getUTCDate();
      columns.push({ label: `${dayName} ${d}`, startMs: cursor.getTime(), endMs: dayEnd.getTime() });
      cursor = dayEnd;
    }
    return { rangeStart, rangeEnd, columns };
  }
}

// Helper: get a color for a strategy by index
function getStrategyColor(index: number): string {
  const colors = [
    '#EEF2FF',
    '#F0FDF4',
    '#FEF2F2',
    '#FFFBEB',
    '#F0F9FF',
    '#FCF0FF',
    '#F5F3FF',
  ];
  return colors[index % colors.length];
}

function getStrategyTextColor(index: number): string {
  const colors = [
    '#3730A3',
    '#166534',
    '#7F1D1D',
    '#92400E',
    '#0C4A6E',
    '#6B21A8',
    '#4C1D95',
  ];
  return colors[index % colors.length];
}

const TASK_STATUS_COLORS: Record<string, string> = {
  todo: 'bg-gray-100 border-gray-300 text-gray-600',
  inprogress: 'bg-blue-100 border-blue-300 text-blue-700',
  review: 'bg-amber-100 border-amber-300 text-amber-700',
  done: 'bg-green-100 border-green-300 text-green-700',
};

const VIEW_LABELS: Record<RoadmapView, string> = {
  '2weeks': '2 Weeks',
  month: 'This Month',
  quarter: 'This Quarter',
  year: 'This Year',
};

export default function YearRoadmap({
  strategies,
  initiatives,
  pillars,
  clientId,
  onInitiativeClick,
  onTaskClick,
}: YearRoadmapProps) {
  const { TASKS = [] } = useAppData();
  const [view, setView] = useState<RoadmapView>('year');
  const [expandedInitiatives, setExpandedInitiatives] = useState<Set<string>>(new Set());

  const now = useMemo(() => new Date(), []);

  const { rangeStart, rangeEnd, columns } = useMemo(() => buildColumns(view, now), [view, now]);

  const toggleExpand = (id: string) => {
    setExpandedInitiatives(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Calculate "today" position
  const todayPercent = useMemo(() => {
    const totalMs = rangeEnd.getTime() - rangeStart.getTime();
    const msFromStart = now.getTime() - rangeStart.getTime();
    return Math.max(0, Math.min(100, (msFromStart / totalMs) * 100));
  }, [rangeStart, rangeEnd, now]);

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

  const getPillarForInitiative = (pillarId?: string | null) => {
    if (!pillarId) return null;
    return pillars.find(p => p.id === pillarId) || null;
  };

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
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Roadmap</h3>
        </div>
        {/* View Selector */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
          {(['2weeks', 'month', 'quarter', 'year'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                view === v
                  ? 'bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Container */}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
        <div className="inline-block min-w-full">
          {/* Column Headers */}
          <div className="flex">
            {/* Strategy label column */}
            <div className="w-48 flex-shrink-0 px-3 py-3 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50" />

            {/* Dynamic columns */}
            <div className="flex flex-1">
              {columns.map((col, idx) => (
                <div
                  key={idx}
                  className="flex-1 min-w-[40px] px-1 py-3 text-center border-r border-gray-100 dark:border-gray-700 last:border-r-0 bg-gray-50 dark:bg-gray-900/50"
                >
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 truncate">{col.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* Strategy Rows */}
          {sortedStrategies.map((strategy, strategyIndex) => {
            const strategyInitiatives = (initiativesByStrategy[strategy.id] || []).filter(initiative =>
              overlapsRange(initiative.startDate, initiative.endDate, rangeStart, rangeEnd)
            );
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
                  {/* Background: column grid */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {columns.map((_, idx) => (
                      <div
                        key={idx}
                        className="flex-1 min-w-[40px] border-r border-gray-100 dark:border-gray-700 last:border-r-0"
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
                      const leftPercent = getPositionPercent(initiative.startDate, rangeStart, rangeEnd);
                      const widthPercent = getWidthPercent(initiative.startDate, initiative.endDate, rangeStart, rangeEnd);
                      const pillar = getPillarForInitiative(initiative.clientPillarId);
                      const tasks = getTasksForInitiative(initiative.id);
                      const isExpanded = expandedInitiatives.has(initiative.id);

                      if (widthPercent === 0) return null;

                      return (
                        <div key={initiative.id}>
                          {/* Initiative Row */}
                          <div className="relative h-8 flex items-center">
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

                              {/* Initiative Bar — click to open drawer */}
                              <div
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => onInitiativeClick?.(initiative.id)}
                              >
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
                              </div>
                            </div>
                          </div>

                          {/* Task Sub-Rows (expanded) */}
                          {isExpanded && tasks.map((task) => {
                            const taskStart = task.startDate || task.dueDate;
                            const taskEnd = task.endDate || task.dueDate || task.startDate;
                            if (!taskStart) return null;
                            if (!overlapsRange(taskStart, taskEnd, rangeStart, rangeEnd)) return null;

                            const taskLeft = getPositionPercent(taskStart, rangeStart, rangeEnd);
                            const taskWidth = getWidthPercent(taskStart, taskEnd!, rangeStart, rangeEnd);
                            const colorClass = TASK_STATUS_COLORS[task.status] || TASK_STATUS_COLORS.todo;

                            if (taskWidth === 0) return null;

                            return (
                              <div key={task.id} className="relative h-6 flex items-center">
                                <div
                                  className="absolute cursor-pointer"
                                  style={{
                                    left: `calc(${taskLeft}% + 20px)`,
                                    width: `calc(${taskWidth}% - 4px)`,
                                    minWidth: '40px',
                                  }}
                                  onClick={() => onTaskClick?.(task.id)}
                                >
                                  <div
                                    className={`rounded px-1.5 py-0.5 border text-[10px] font-medium truncate hover:opacity-80 transition-opacity ${colorClass}`}
                                    title={task.title}
                                  >
                                    {task.title}
                                  </div>
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
