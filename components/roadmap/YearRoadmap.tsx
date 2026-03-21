'use client';

import { useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
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

// Popover component for task hover
function InitiativePopover({
  initiative,
  tasks,
  clientId,
  onClose,
}: {
  initiative: Initiative;
  tasks: Task[];
  clientId: string;
  onClose: () => void;
}) {
  const statusConfig: Record<string, { color: string; label: string }> = {
    todo: { color: 'bg-gray-100 text-gray-700', label: 'To Do' },
    inprogress: { color: 'bg-blue-100 text-blue-700', label: 'In Progress' },
    review: { color: 'bg-amber-100 text-amber-700', label: 'Review' },
    done: { color: 'bg-green-100 text-green-700', label: 'Done' },
  };

  return (
    <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 min-w-max max-w-sm">
      <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">
        {initiative.name}
      </h4>
      {tasks.length === 0 ? (
        <p className="text-xs text-gray-500">No tasks yet</p>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => {
            const cfg = statusConfig[task.status] || statusConfig.todo;
            return (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="flex items-center gap-2 text-xs hover:underline text-blue-600 dark:text-blue-400"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    task.status === 'done'
                      ? 'bg-green-500'
                      : task.status === 'inprogress'
                      ? 'bg-blue-500'
                      : task.status === 'review'
                      ? 'bg-amber-500'
                      : 'bg-gray-400'
                  }`}
                />
                <span className="truncate">{task.title}</span>
              </Link>
            );
          })}
        </div>
      )}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs">
        <Link
          href={`/projects/${initiative.id}`}
          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          View Initiative →
        </Link>
      </div>
    </div>
  );
}

export default function YearRoadmap({
  strategies,
  initiatives,
  pillars,
  clientId,
}: YearRoadmapProps) {
  const { TASKS = [] } = useAppData();
  const currentYear = new Date().getFullYear();
  const [hoveredInitiative, setHoveredInitiative] = useState<string | null>(null);

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
  const getTasksForInitiative = (initiativeId: string) => {
    const initiative = initiatives.find(i => i.id === initiativeId);
    if (!initiative || !initiative.taskIds) return [];
    return TASKS.filter(t => initiative.taskIds!.includes(t.id) && t.clientId === clientId);
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
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">This Year's Roadmap</h3>
      </div>

      {/* Timeline Container */}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
        <div className="inline-block min-w-full">
          {/* Month Headers */}
          <div className="flex">
            {/* Strategy label column */}
            <div className="w-40 flex-shrink-0 px-3 py-3 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50" />

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

            return (
              <div key={strategy.id} className="flex border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                {/* Strategy Label */}
                <div className="w-40 flex-shrink-0 px-3 py-3 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center">
                  <Link
                    href={`/strategy?clientId=${clientId}`}
                    className="text-sm font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate hover:underline"
                    title={strategy.name}
                  >
                    {strategy.name}
                  </Link>
                </div>

                {/* Timeline */}
                <div className="flex flex-1 relative min-h-24">
                  {/* Month dividers */}
                  {months.map((_, idx) => (
                    <div
                      key={idx}
                      className="flex-1 min-w-[60px] border-r border-gray-100 dark:border-gray-700 last:border-r-0 relative"
                    />
                  ))}

                  {/* Today marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 opacity-70"
                    style={{ left: `${todayPercent}%` }}
                  />

                  {/* Initiative Bars */}
                  {strategyInitiatives.map((initiative, initIdx) => {
                    const leftPercent = getPositionPercent(initiative.startDate, currentYear);
                    const widthPercent = getWidthPercent(initiative.startDate, initiative.endDate, currentYear);
                    const pillar = getPillarForInitiative(initiative.clientPillarId);
                    const tasks = getTasksForInitiative(initiative.id);
                    const isHovered = hoveredInitiative === initiative.id;

                    return (
                      <div
                        key={initiative.id}
                        className="absolute group cursor-pointer"
                        style={{
                          left: `calc(${leftPercent}% + 12px)`,
                          width: `calc(${widthPercent}% - 24px)`,
                          top: `${8 + initIdx * 20}px`,
                        }}
                        onMouseEnter={() => setHoveredInitiative(initiative.id)}
                        onMouseLeave={() => setHoveredInitiative(null)}
                      >
                        {/* Initiative Bar */}
                        <Link href={`/projects/${initiative.id}`}>
                          <div
                            className="rounded px-2 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all"
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

                        {/* Popover */}
                        {isHovered && (
                          <InitiativePopover
                            initiative={initiative}
                            tasks={tasks}
                            clientId={clientId}
                            onClose={() => setHoveredInitiative(null)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
