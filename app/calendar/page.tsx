'use client';

import { useState } from 'react';
import { TYPE_ICONS, Task } from '@/lib/data';
import { useAppData } from '@/lib/contexts/AppDataContext';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS_LONG = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function isToday(year: number, month: number, day: number) {
  const now = new Date();
  return now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;
}

const STATUS_OPACITY: Record<string, string> = {
  todo: '90',
  inprogress: 'cc',
  review: 'cc',
  done: '50',
};

function DayModal({ date, tasks, onClose }: { date: string; tasks: Task[]; onClose: () => void }) {
  const { CLIENTS = [], TEAM_MEMBERS = [] } = useAppData();
  const d = new Date(date + 'T12:00:00');
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{tasks.length} task{tasks.length !== 1 ? 's' : ''} due</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          {tasks.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No tasks due on this day</p>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => {
                const client = CLIENTS.find(c => c.id === task.clientId)!;
                return (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                  >
                    <span className="text-base mt-0.5">{TYPE_ICONS[task.type || 'other']}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: client.color + '20', color: client.color }}
                        >
                          {client.name}
                        </span>
                        <span className={`text-[10px] capitalize px-1.5 py-0.5 rounded-full font-medium ${
                          task.status === 'done' ? 'bg-green-100 text-green-700' :
                          task.status === 'review' ? 'bg-amber-100 text-amber-700' :
                          task.status === 'inprogress' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {task.status === 'inprogress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const { TASKS = [], CLIENTS = [] } = useAppData();
  const today = new Date();
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(2);
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showClientFilter, setShowClientFilter] = useState(false);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const filteredTasks = TASKS.filter(t => {
    if (selectedClient !== 'all' && t.clientId !== selectedClient) return false;
    return true;
  });

  const tasksByDate: Record<string, Task[]> = {};
  filteredTasks.forEach(task => {
    const d = task.dueDate;
    const tYear = parseInt(d.split('-')[0]);
    const tMonth = parseInt(d.split('-')[1]) - 1;
    if (tYear === year && tMonth === month) {
      if (!tasksByDate[d]) tasksByDate[d] = [];
      tasksByDate[d].push(task);
    }
  });

  const getDateKey = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const selectedTasks = selectedDay ? (tasksByDate[selectedDay] || []) : [];
  const monthTasks = Object.values(tasksByDate).flat();

  return (
    <div className="pt-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopBar title="Calendar" subtitle="Monthly view of tasks and deadlines" />

      <div className="p-4 sm:p-6 lg:p-8">
        {selectedDay && (
          <DayModal
            date={selectedDay}
            tasks={selectedTasks}
            onClose={() => setSelectedDay(null)}
          />
        )}

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Main calendar */}
          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Nav */}
              <div className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={prevMonth}
                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    {MONTHS[month]} {year}
                  </h2>
                  <button
                    onClick={nextMonth}
                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {/* Mobile: client filter toggle */}
                  <button
                    onClick={() => setShowClientFilter(v => !v)}
                    className="lg:hidden px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    {selectedClient === 'all' ? 'All Clients' : CLIENTS.find(c => c.id === selectedClient)?.name}
                  </button>
                  <button
                    onClick={() => { setYear(2026); setMonth(2); }}
                    className="px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
                  >
                    Today
                  </button>
                </div>
              </div>

              {/* Mobile client filter dropdown */}
              {showClientFilter && (
                <div className="lg:hidden px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex flex-wrap gap-2">
                  <button
                    onClick={() => { setSelectedClient('all'); setShowClientFilter(false); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedClient === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    All
                  </button>
                  {CLIENTS.map(client => (
                    <button
                      key={client.id}
                      onClick={() => { setSelectedClient(client.id); setShowClientFilter(false); }}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors text-white"
                      style={{ backgroundColor: selectedClient === client.id ? client.color : client.color + '80' }}
                    >
                      {client.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Day headers — short on mobile, long on desktop */}
              <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700">
                {DAYS_SHORT.map((d, i) => (
                  <div key={i} className="py-2 sm:py-2.5 text-center">
                    <span className="sm:hidden text-xs font-semibold text-gray-400 uppercase">{d}</span>
                    <span className="hidden sm:inline text-xs font-semibold text-gray-400 uppercase tracking-wider">{DAYS_LONG[i]}</span>
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-16 sm:h-28 border-r border-b border-gray-50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateKey = getDateKey(day);
                  const dayTasks = tasksByDate[dateKey] || [];
                  const isT = isToday(year, month, day);
                  const isSelected = selectedDay === dateKey;
                  const dayCol = (firstDay + i) % 7;
                  const isLastCol = dayCol === 6;

                  return (
                    <div
                      key={day}
                      onClick={() => setSelectedDay(isSelected ? null : dateKey)}
                      className={`h-16 sm:h-28 border-b border-gray-50 dark:border-gray-700/50 p-1 sm:p-1.5 transition-colors overflow-hidden relative
                        ${!isLastCol ? 'border-r' : ''}
                        ${dayTasks.length > 0 ? 'cursor-pointer hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10' : ''}
                        ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}
                      `}
                    >
                      {/* Day number */}
                      <div className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs font-medium rounded-full mb-0.5 sm:mb-1 ${
                        isT ? 'bg-indigo-600 text-white' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {day}
                      </div>

                      {/* Task dots on mobile, full labels on desktop */}
                      {dayTasks.length > 0 && (
                        <>
                          {/* Mobile: dots */}
                          <div className="flex gap-0.5 flex-wrap sm:hidden">
                            {dayTasks.slice(0, 3).map(task => {
                              const client = CLIENTS.find(c => c.id === task.clientId)!;
                              return (
                                <div
                                  key={task.id}
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: client.color }}
                                />
                              );
                            })}
                            {dayTasks.length > 3 && (
                              <span className="text-[9px] text-gray-400">+{dayTasks.length - 3}</span>
                            )}
                          </div>
                          {/* Desktop: labels */}
                          <div className="hidden sm:block space-y-0.5">
                            {dayTasks.slice(0, 3).map(task => {
                              const client = CLIENTS.find(c => c.id === task.clientId)!;
                              return (
                                <div
                                  key={task.id}
                                  className="flex items-center gap-1 px-1 py-0.5 rounded text-[10px] font-medium truncate"
                                  style={{
                                    backgroundColor: client.color + (STATUS_OPACITY[task.status] || '30'),
                                    color: task.status === 'done' ? '#6b7280' : '#ffffff',
                                  }}
                                >
                                  <span>{TYPE_ICONS[task.type || 'other']}</span>
                                  <span className="truncate">{task.title}</span>
                                </div>
                              );
                            })}
                            {dayTasks.length > 3 && (
                              <div className="text-[10px] text-gray-400 pl-1">+{dayTasks.length - 3} more</div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile: Selected day task list below calendar */}
            {selectedDay && selectedTasks.length > 0 && (
              <div className="lg:hidden mt-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                    {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </h3>
                  <button onClick={() => setSelectedDay(null)} className="text-gray-400">
                    <X size={16} />
                  </button>
                </div>
                <div className="space-y-2">
                  {selectedTasks.map(task => {
                    const client = CLIENTS.find(c => c.id === task.clientId)!;
                    return (
                      <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700">
                        <span className="text-sm mt-0.5">{TYPE_ICONS[task.type || 'other']}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{task.title}</p>
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-1 inline-block"
                            style={{ backgroundColor: client.color + '20', color: client.color }}
                          >
                            {client.name}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar — hidden on mobile, shown on lg+ */}
          <div className="hidden lg:flex w-64 flex-shrink-0 flex-col space-y-4">
            {/* Client filter */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Clients</h3>
              <div className="space-y-1.5">
                <button
                  onClick={() => setSelectedClient('all')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedClient === 'all' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  All Clients
                </button>
                {CLIENTS.map(client => (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClient(selectedClient === client.id ? 'all' : client.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedClient === client.id ? 'text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    style={selectedClient === client.id ? { backgroundColor: client.color } : {}}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: client.color }} />
                    {client.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Task Types</h3>
              <div className="space-y-1.5">
                {Object.entries(TYPE_ICONS).map(([type, icon]) => (
                  <div key={type} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                    <span>{icon}</span>
                    <span className="capitalize">{type === 'social' ? 'Social Post' : type === 'ad' ? 'Ad Campaign' : type}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Month stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{MONTHS[month]} Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total tasks</span>
                  <span className="font-medium text-gray-900 dark:text-white">{monthTasks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Completed</span>
                  <span className="font-medium text-green-600">{monthTasks.filter(t => t.status === 'done').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">In Review</span>
                  <span className="font-medium text-amber-600">{monthTasks.filter(t => t.status === 'review').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">In Progress</span>
                  <span className="font-medium text-blue-600">{monthTasks.filter(t => t.status === 'inprogress').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Days with tasks</span>
                  <span className="font-medium text-gray-900 dark:text-white">{Object.keys(tasksByDate).length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
