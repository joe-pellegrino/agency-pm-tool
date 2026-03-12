'use client';

import { useState, useMemo } from 'react';
import { TASKS, CLIENTS, TEAM_MEMBERS, Task } from '@/lib/data';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Flag } from 'lucide-react';
import { addDays, addWeeks, addMonths, format, startOfWeek, differenceInDays, eachDayOfInterval, eachWeekOfInterval, isSameDay, parseISO, isWithinInterval, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';

type ZoomLevel = 'day' | 'week' | 'month';

function getClientColor(clientId: string) {
  return CLIENTS.find(c => c.id === clientId)?.color || '#6366f1';
}

function Avatar({ assigneeId, size = 20 }: { assigneeId: string; size?: number }) {
  const m = TEAM_MEMBERS.find(m => m.id === assigneeId);
  if (!m) return null;
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4, backgroundColor: m.color }}
      title={m.name}
    >
      {m.initials}
    </div>
  );
}

export default function GanttChart() {
  const [zoom, setZoom] = useState<ZoomLevel>('week');
  const [viewStart, setViewStart] = useState(new Date('2026-02-09'));
  const [filterClient, setFilterClient] = useState('all');
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  // Config per zoom level
  const zoomConfig: Record<ZoomLevel, { days: number; colWidth: number; label: string }> = {
    day: { days: 28, colWidth: 40, label: 'day' },
    week: { days: 77, colWidth: 100, label: 'week' },
    month: { days: 120, colWidth: 160, label: 'month' },
  };

  const { days: visibleDays, colWidth } = zoomConfig[zoom];
  const viewEnd = addDays(viewStart, visibleDays);

  // Build header columns
  const headerColumns = useMemo(() => {
    if (zoom === 'day') {
      return eachDayOfInterval({ start: viewStart, end: viewEnd }).map(d => ({
        date: d,
        label: format(d, 'EEE d'),
        span: 1,
      }));
    } else if (zoom === 'week') {
      const weeks = eachWeekOfInterval({ start: viewStart, end: viewEnd }, { weekStartsOn: 1 });
      return weeks.map(w => ({
        date: w,
        label: `Week of ${format(w, 'MMM d')}`,
        span: 7,
      }));
    } else {
      const months = eachMonthOfInterval({ start: viewStart, end: viewEnd });
      return months.map(m => ({
        date: m,
        label: format(m, 'MMMM yyyy'),
        span: differenceInDays(endOfMonth(m), startOfMonth(m)) + 1,
      }));
    }
  }, [zoom, viewStart, viewEnd]);

  const totalDays = differenceInDays(viewEnd, viewStart);

  function dayX(date: Date): number {
    const offset = differenceInDays(date, viewStart);
    return Math.max(0, (offset / totalDays) * 100);
  }

  function barWidth(start: Date, end: Date): number {
    const s = Math.max(0, differenceInDays(start, viewStart));
    const e = Math.min(totalDays, differenceInDays(end, viewStart));
    return Math.max(0.5, ((e - s) / totalDays) * 100);
  }

  const displayTasks = TASKS
    .filter(t => filterClient === 'all' || t.clientId === filterClient)
    .filter(t => {
      const s = parseISO(t.startDate);
      const e = parseISO(t.endDate);
      return s <= viewEnd && e >= viewStart;
    });

  // Group by client
  const grouped = CLIENTS
    .filter(c => filterClient === 'all' || c.id === filterClient)
    .map(client => ({
      client,
      tasks: displayTasks.filter(t => t.clientId === client.id),
    }))
    .filter(g => g.tasks.length > 0);

  const ROW_HEIGHT = 44;
  const LABEL_WIDTH = 220;

  function navigate(dir: -1 | 1) {
    if (zoom === 'day') setViewStart(d => addDays(d, dir * 7));
    else if (zoom === 'week') setViewStart(d => addWeeks(d, dir * 2));
    else setViewStart(d => addMonths(d, dir));
  }

  const today = new Date();
  const todayPct = dayX(today);
  const showTodayLine = todayPct >= 0 && todayPct <= 100;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-200 dark:border-gray-700 flex-wrap gap-y-2">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
          {(['day', 'week', 'month'] as ZoomLevel[]).map(z => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                zoom === z
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {z}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors">
            <ChevronLeft size={15} />
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200 min-w-[140px] text-center">
            {format(viewStart, 'MMM d')} — {format(viewEnd, 'MMM d, yyyy')}
          </span>
          <button onClick={() => navigate(1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors">
            <ChevronRight size={15} />
          </button>
        </div>

        <button
          onClick={() => setViewStart(addDays(today, -7))}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-700 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
        >
          Today
        </button>

        <div className="ml-auto">
          <select
            value={filterClient}
            onChange={e => setFilterClient(e.target.value)}
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Clients</option>
            {CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 ml-2">
          {CLIENTS.map(c => (
            <div key={c.id} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: c.color }} />
              <span className="text-xs text-gray-500">{c.name}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <Flag size={10} className="text-orange-500" />
            <span className="text-xs text-gray-500">Milestone</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: 900 }}>
          {/* Header row */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
            <div className="flex-shrink-0 px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700" style={{ width: LABEL_WIDTH }}>
              Task
            </div>
            <div className="flex-1 relative flex">
              {headerColumns.map((col, i) => (
                <div
                  key={i}
                  className="text-[11px] font-medium text-gray-500 dark:text-gray-400 px-2 py-2.5 border-r border-gray-100 dark:border-gray-700/50 text-center truncate"
                  style={{ width: col.span * (zoom === 'week' ? 14 : zoom === 'day' ? 40 : 5) + 'px' }}
                >
                  {col.label}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {grouped.map(({ client, tasks }) => (
            <div key={client.id}>
              {/* Client group header */}
              <div className="flex items-center border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/80 dark:bg-gray-800/60">
                <div
                  className="flex-shrink-0 px-4 py-2 flex items-center gap-2 border-r border-gray-200 dark:border-gray-700"
                  style={{ width: LABEL_WIDTH }}
                >
                  <span
                    className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center"
                    style={{ backgroundColor: client.color + '25', color: client.color }}
                  >
                    {client.logo}
                  </span>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{client.name}</span>
                </div>
                <div className="flex-1 h-7 relative">
                  {showTodayLine && (
                    <div
                      className="absolute top-0 bottom-0 w-px bg-red-400 opacity-40"
                      style={{ left: `${todayPct}%` }}
                    />
                  )}
                </div>
              </div>

              {/* Task rows */}
              {tasks.map(task => {
                const s = parseISO(task.startDate);
                const e = parseISO(task.endDate);
                const x = dayX(s);
                const w = barWidth(s, e);
                const color = getClientColor(task.clientId);
                const isHovered = hoveredTask === task.id;

                return (
                  <div
                    key={task.id}
                    className="flex items-center border-b border-gray-100 dark:border-gray-700/30 hover:bg-gray-50/80 dark:hover:bg-gray-700/20 transition-colors group"
                    style={{ height: ROW_HEIGHT }}
                    onMouseEnter={() => setHoveredTask(task.id)}
                    onMouseLeave={() => setHoveredTask(null)}
                  >
                    {/* Label */}
                    <div
                      className="flex-shrink-0 flex items-center gap-2 px-4 border-r border-gray-200 dark:border-gray-700"
                      style={{ width: LABEL_WIDTH, height: ROW_HEIGHT }}
                    >
                      {task.isMilestone ? (
                        <Flag size={12} className="text-orange-500 flex-shrink-0" />
                      ) : (
                        <Avatar assigneeId={task.assigneeId} size={20} />
                      )}
                      <span className={`text-xs leading-tight truncate ${task.isMilestone ? 'font-semibold text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-gray-200'}`}>
                        {task.title}
                      </span>
                    </div>

                    {/* Bar area */}
                    <div className="flex-1 relative" style={{ height: ROW_HEIGHT }}>
                      {/* Today line */}
                      {showTodayLine && (
                        <div
                          className="absolute top-0 bottom-0 w-px bg-red-400 z-10"
                          style={{ left: `${todayPct}%` }}
                        />
                      )}

                      {/* Grid lines */}
                      {headerColumns.map((col, i) => {
                        const colX = (differenceInDays(col.date, viewStart) / totalDays) * 100;
                        return (
                          <div
                            key={i}
                            className="absolute top-0 bottom-0 w-px bg-gray-100 dark:bg-gray-700/50"
                            style={{ left: `${colX}%` }}
                          />
                        );
                      })}

                      {/* Milestone diamond */}
                      {task.isMilestone ? (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 z-20 flex items-center justify-center"
                          style={{ left: `calc(${dayX(s)}% - 8px)` }}
                          title={task.title}
                        >
                          <div
                            className="w-4 h-4 rotate-45 border-2 shadow-sm"
                            style={{ backgroundColor: '#f97316', borderColor: '#ea580c' }}
                          />
                        </div>
                      ) : (
                        /* Task bar */
                        <div
                          className="absolute top-1/2 -translate-y-1/2 rounded-md gantt-bar flex items-center px-2 z-10 cursor-pointer"
                          style={{
                            left: `${x}%`,
                            width: `${w}%`,
                            backgroundColor: color,
                            opacity: isHovered ? 1 : 0.85,
                            height: 26,
                            minWidth: 4,
                            boxShadow: isHovered ? `0 2px 8px ${color}60` : 'none',
                          }}
                          title={`${task.title}\n${format(s, 'MMM d')} → ${format(e, 'MMM d')}`}
                        >
                          {w > 8 && (
                            <span className="text-white text-[10px] font-medium truncate leading-none">
                              {task.title}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Dependency arrows (visual hint) */}
                      {task.dependencies && task.dependencies.length > 0 && isHovered && (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 z-30"
                          style={{ left: `${x}%`, transform: 'translateX(-100%)' }}
                        >
                          <div className="w-4 h-px bg-gray-400 border-dashed border border-gray-400 opacity-60" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Today marker label */}
          {showTodayLine && (
            <div className="relative h-6 border-t border-gray-100 dark:border-gray-700">
              <div style={{ position: 'absolute', left: LABEL_WIDTH }}>
                <div className="relative flex-1 h-full" style={{ position: 'relative' }}>
                  <div
                    className="absolute -top-px"
                    style={{ left: `calc(${todayPct}% - 20px)` }}
                  >
                    <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded">
                      Today
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
