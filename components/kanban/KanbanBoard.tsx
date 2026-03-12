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
import { TASKS, CLIENTS, TEAM_MEMBERS, PRIORITY_COLORS, PRIORITY_DOT, Status, Task, ApprovalEntry } from '@/lib/data';
import { CalendarDays, Plus, ChevronDown, Filter, X, CheckCircle, XCircle, Clock, History } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const COLUMNS: { id: Status; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: 'border-t-gray-400' },
  { id: 'inprogress', label: 'In Progress', color: 'border-t-blue-500' },
  { id: 'review', label: 'Review', color: 'border-t-amber-500' },
  { id: 'done', label: 'Done', color: 'border-t-green-500' },
];

// Simulated current user — in a real app this comes from auth
const CURRENT_USER_ID = 'joe'; // Owner

function ApprovalModal({
  task,
  onApprove,
  onSendBack,
  onClose,
}: {
  task: Task;
  onApprove: (note: string) => void;
  onSendBack: (note: string) => void;
  onClose: () => void;
}) {
  const [note, setNote] = useState('');
  const [mode, setMode] = useState<'decide' | 'sendback'>('decide');
  const isOwner = TEAM_MEMBERS.find(m => m.id === CURRENT_USER_ID)?.isOwner;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white text-lg">Task Review</h2>
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{task.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors mt-0.5">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">{task.description}</p>

          {/* Approval history */}
          {task.approvalHistory && task.approvalHistory.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                <History size={12} />
                Approval History
              </div>
              <div className="space-y-2">
                {task.approvalHistory.map((entry) => {
                  const approver = TEAM_MEMBERS.find(m => m.id === entry.approverId);
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-start gap-3 p-3 rounded-lg text-sm ${
                        entry.action === 'approved'
                          ? 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800'
                          : 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5`}
                        style={{ backgroundColor: approver?.color, color: '#fff' }}
                      >
                        {approver?.initials}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${entry.action === 'approved' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                            {entry.action === 'approved' ? '✓ Approved' : '↩ Sent Back'}
                          </span>
                          <span className="text-gray-400 text-xs">by {approver?.name}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {new Date(entry.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </div>
                        {entry.note && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">"{entry.note}"</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action area */}
          {isOwner ? (
            mode === 'decide' ? (
              <div className="space-y-3">
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add a note (optional)..."
                  rows={2}
                  className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => onApprove(note)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <CheckCircle size={16} />
                    Approve — Move to Done
                  </button>
                  <button
                    onClick={() => setMode('sendback')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    <XCircle size={16} />
                    Send Back
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">Send back to In Progress</p>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Explain what needs to be revised..."
                  rows={3}
                  className="w-full text-sm border border-red-200 dark:border-red-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => onSendBack(note)}
                    disabled={!note.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <XCircle size={16} />
                    Confirm Send Back
                  </button>
                  <button
                    onClick={() => setMode('decide')}
                    className="px-4 py-2.5 text-gray-600 hover:text-gray-800 text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
              <Clock size={18} className="text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Awaiting Owner Review</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Only Joe or Rick can approve or reject this task.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, isDragging = false, onOpenApproval }: { task: Task; isDragging?: boolean; onOpenApproval?: (task: Task) => void }) {
  const client = CLIENTS.find(c => c.id === task.clientId)!;
  const assignee = TEAM_MEMBERS.find(m => m.id === task.assigneeId)!;
  const overdue = new Date(task.dueDate) < new Date() && task.status !== 'done';
  const isOwner = TEAM_MEMBERS.find(m => m.id === CURRENT_USER_ID)?.isOwner;

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

      {/* Review action area */}
      {task.status === 'review' && !isDragging && (
        <div className="mb-3">
          {isOwner ? (
            <button
              onClick={(e) => { e.stopPropagation(); onOpenApproval?.(task); }}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors cursor-pointer"
            >
              <CheckCircle size={12} />
              Review &amp; Approve
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-600 border border-amber-100">
              <Clock size={12} />
              Awaiting Review
            </div>
          )}
        </div>
      )}

      {/* Done badge with approver */}
      {task.status === 'done' && task.approvalHistory && task.approvalHistory.length > 0 && !isDragging && (
        <div className="mb-2">
          {(() => {
            const lastApproval = task.approvalHistory[task.approvalHistory.length - 1];
            const approver = TEAM_MEMBERS.find(m => m.id === lastApproval.approverId);
            return (
              <div className="flex items-center gap-1.5 text-[11px] text-green-600">
                <CheckCircle size={11} />
                <span>Approved by {approver?.name.split(' ')[0]}</span>
              </div>
            );
          })()}
        </div>
      )}

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

function SortableTaskCard({ task, onOpenApproval }: { task: Task; onOpenApproval?: (task: Task) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onOpenApproval={onOpenApproval} />
    </div>
  );
}

function Column({
  id,
  label,
  color,
  tasks,
  onOpenApproval,
}: {
  id: Status;
  label: string;
  color: string;
  tasks: Task[];
  onOpenApproval?: (task: Task) => void;
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
            <SortableTaskCard key={task.id} task={task} onOpenApproval={onOpenApproval} />
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
  const [approvalTask, setApprovalTask] = useState<Task | null>(null);

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
    const overColumn = COLUMNS.find(c => c.id === overId);
    if (overColumn && activeTask.status !== overColumn.id) {
      setTaskState(prev =>
        prev.map(t => t.id === activeId ? { ...t, status: overColumn.id } : t)
      );
      return;
    }
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

  const handleApprove = (note: string) => {
    if (!approvalTask) return;
    const entry: ApprovalEntry = {
      id: `ah-${Date.now()}`,
      action: 'approved',
      approverId: CURRENT_USER_ID,
      timestamp: new Date().toISOString(),
      note: note || undefined,
    };
    setTaskState(prev =>
      prev.map(t =>
        t.id === approvalTask.id
          ? { ...t, status: 'done', approvalHistory: [...(t.approvalHistory || []), entry] }
          : t
      )
    );
    setApprovalTask(null);
  };

  const handleSendBack = (note: string) => {
    if (!approvalTask) return;
    const entry: ApprovalEntry = {
      id: `ah-${Date.now()}`,
      action: 'rejected',
      approverId: CURRENT_USER_ID,
      timestamp: new Date().toISOString(),
      note,
    };
    setTaskState(prev =>
      prev.map(t =>
        t.id === approvalTask.id
          ? { ...t, status: 'inprogress', approvalHistory: [...(t.approvalHistory || []), entry] }
          : t
      )
    );
    setApprovalTask(null);
  };

  const openApproval = (task: Task) => {
    // Sync task from latest state
    const latest = taskState.find(t => t.id === task.id) || task;
    setApprovalTask(latest);
  };

  const activeFilters = (filterClient !== 'all' ? 1 : 0) + (filterAssignee !== 'all' ? 1 : 0) + (filterPriority !== 'all' ? 1 : 0);

  return (
    <div>
      {/* Approval Modal */}
      {approvalTask && (
        <ApprovalModal
          task={approvalTask}
          onApprove={handleApprove}
          onSendBack={handleSendBack}
          onClose={() => setApprovalTask(null)}
        />
      )}

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

        {/* Reviewer indicator */}
        <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
            style={{ backgroundColor: TEAM_MEMBERS.find(m => m.id === CURRENT_USER_ID)?.color }}
          >
            {TEAM_MEMBERS.find(m => m.id === CURRENT_USER_ID)?.initials}
          </div>
          Reviewing as {TEAM_MEMBERS.find(m => m.id === CURRENT_USER_ID)?.name.split(' ')[0]} (Owner)
        </div>
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
              onOpenApproval={openApproval}
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
