'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TASKS, CLIENTS, TEAM_MEMBERS, PRIORITY_COLORS, PRIORITY_DOT, Status, Task } from '@/lib/data';
import { CalendarDays, Flag, Plus, ChevronDown, Filter, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const COLUMNS: { id: Status; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: 'border-t-gray-400' },
  { id: 'inprogress', label: 'In Progress', color: 'border-t-blue-500' },
  { id: 'review', label: 'Review', color: 'border-t-amber-500' },
  { id: 'done', label: 'Done', color: 'border-t-green-500' },
];

function TaskCard({ task, isDragging = false }: { task: Task; isDragging?: boolean }) {
  const client = CLIENTS.find(c => c.id === task.clientId)!;
  const assignee = TEAM_MEMBERS.find(m => m.id === task.assigneeId)!;
  const overdue = new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <div
      className={`task-card bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3.5 ${
        isDragging ? 'shadow-2xl rotate-2 opacity-95 ring-2 ring-indigo-400' : 'shadow-sm hover:shadow-md'
      } cursor-grab active:cursor-grabbing`}
    >
      {/* Client tag + priority */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: client.color + '18', color: client.color }}
        >
          {client.name}
        </span>
        <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1 ${PRIORITY_COLORS[task.priority]}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`} />
          {task.priority}
        </span>
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug mb-3">
        {task.title}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
          <CalendarDays size={11} />
          {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          {overdue && ' ⚠'}
        </div>
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
          style={{ backgroundColor: assignee.color }}
          title={assignee.name}
        >
          {assignee.initials}
        </div>
      </div>
    </div>
  );
}

function SortableTaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} />
    </div>
  );
}

function Column({
  id,
  label,
  color,
  tasks,
}: {
  id: Status;
  label: string;
  color: string;
  tasks: Task[];
}) {
  const colBg: Record<Status, string> = {
    todo: 'bg-gray-50 dark:bg-gray-800/40',
    inprogress: 'bg-blue-50/50 dark:bg-blue-900/10',
    review: 'bg-amber-50/50 dark:bg-amber-900/10',
    done: 'bg-green-50/50 dark:bg-green-900/10',
  };

  return (
    <div className={`flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 border-t-4 ${color} ${colBg[id]} min-h-[200px]`}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-gray-900 dark:text-white">{label}</span>
          <span className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full text-xs font-bold text-gray-600 dark:text-gray-300 flex items-center justify-center">
            {tasks.length}
          </span>
        </div>
        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
          <Plus size={15} />
        </button>
      </div>

      {/* Cards */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-[70vh]">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <SortableTaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-400">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}

export default function KanbanBoard() {
  const searchParams = useSearchParams();
  const clientFilter = searchParams.get('client') || 'all';

  const [taskState, setTaskState] = useState<Task[]>(TASKS.filter(t => !t.isMilestone));
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [filterClient, setFilterClient] = useState(clientFilter);
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const filteredTasks = taskState.filter(task => {
    if (filterClient !== 'all' && task.clientId !== filterClient) return false;
    if (filterAssignee !== 'all' && task.assigneeId !== filterAssignee) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    return true;
  });

  const getColumnTasks = (status: Status) =>
    filteredTasks.filter(t => t.status === status);

  const handleDragStart = useCallback((e: DragStartEvent) => {
    const task = taskState.find(t => t.id === e.active.id);
    setActiveTask(task || null);
  }, [taskState]);

  const handleDragOver = useCallback((e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = taskState.find(t => t.id === activeId);
    if (!activeTask) return;

    // Check if over a column
    const overColumn = COLUMNS.find(c => c.id === overId);
    if (overColumn && activeTask.status !== overColumn.id) {
      setTaskState(prev =>
        prev.map(t => t.id === activeId ? { ...t, status: overColumn.id } : t)
      );
      return;
    }

    // Check if over another task
    const overTask = taskState.find(t => t.id === overId);
    if (overTask && activeTask.status !== overTask.status) {
      setTaskState(prev =>
        prev.map(t => t.id === activeId ? { ...t, status: overTask.status } : t)
      );
    }
  }, [taskState]);

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    setTaskState(prev => {
      const activeIndex = prev.findIndex(t => t.id === activeId);
      const overIndex = prev.findIndex(t => t.id === overId);
      if (activeIndex !== -1 && overIndex !== -1) {
        return arrayMove(prev, activeIndex, overIndex);
      }
      return prev;
    });
  }, []);

  const activeFilters = (filterClient !== 'all' ? 1 : 0) + (filterAssignee !== 'all' ? 1 : 0) + (filterPriority !== 'all' ? 1 : 0);

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
            showFilters || activeFilters > 0
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
          }`}
        >
          <Filter size={14} />
          Filters
          {activeFilters > 0 && (
            <span className="w-4 h-4 bg-indigo-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
              {activeFilters}
            </span>
          )}
          <ChevronDown size={12} />
        </button>

        {activeFilters > 0 && (
          <button
            onClick={() => { setFilterClient('all'); setFilterAssignee('all'); setFilterPriority('all'); }}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={12} /> Clear filters
          </button>
        )}

        {/* Active filter chips */}
        {filterClient !== 'all' && (
          <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-green-100 text-green-700 rounded-full">
            {CLIENTS.find(c => c.id === filterClient)?.name}
            <X size={10} className="cursor-pointer" onClick={() => setFilterClient('all')} />
          </span>
        )}
        {filterAssignee !== 'all' && (
          <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full">
            {TEAM_MEMBERS.find(m => m.id === filterAssignee)?.name.split(' ')[0]}
            <X size={10} className="cursor-pointer" onClick={() => setFilterAssignee('all')} />
          </span>
        )}
        {filterPriority !== 'all' && (
          <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full">
            {filterPriority}
            <X size={10} className="cursor-pointer" onClick={() => setFilterPriority('all')} />
          </span>
        )}
      </div>

      {showFilters && (
        <div className="flex gap-3 mb-5 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Client</label>
            <select
              value={filterClient}
              onChange={e => setFilterClient(e.target.value)}
              className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Clients</option>
              {CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Assignee</label>
            <select
              value={filterAssignee}
              onChange={e => setFilterAssignee(e.target.value)}
              className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Assignees</option>
              {TEAM_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Priority</label>
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      )}

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-4 gap-4">
          {COLUMNS.map(col => (
            <Column
              key={col.id}
              id={col.id}
              label={col.label}
              color={col.color}
              tasks={getColumnTasks(col.id)}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {activeTask && <TaskCard task={activeTask} isDragging />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
