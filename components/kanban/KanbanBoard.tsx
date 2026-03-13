'use client';

import { useState, useCallback, useEffect, useRef, useTransition } from 'react';
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
import { PRIORITY_COLORS, PRIORITY_DOT, Status, Task, ApprovalEntry, TimeEntry } from '@/lib/data';
import { useAppData } from '@/lib/contexts/AppDataContext';
import { CalendarDays, Plus, ChevronDown, Filter, X, CheckCircle, XCircle, Clock, History, Play, Square, Timer, Edit3, Lock, ArrowRight, Archive, Pencil, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { updateTaskStatus, updateTask, archiveTask, createTimeEntry } from '@/lib/actions';
import TaskModal from '@/components/tasks/TaskModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

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
  const { TEAM_MEMBERS = [] } = useAppData();
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

function TaskDetailModal({
  task,
  onClose,
  onOpenApproval,
  onEdit,
  onArchive,
  onStatusChange,
}: {
  task: Task;
  onClose: () => void;
  onOpenApproval: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onArchive?: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: string) => void;
}) {
  const { CLIENTS = [], TEAM_MEMBERS = [], TASKS = [], TIME_ENTRIES = [], refresh } = useAppData();
  // Use fallbacks for unknown client/assignee so modal always renders
  const client = CLIENTS.find(c => c.id === task.clientId) ?? { id: task.clientId, name: 'Unknown Client', color: '#9ca3af', logo: '?' };
  const assignee = TEAM_MEMBERS.find(m => m.id === task.assigneeId) ?? { id: task.assigneeId, name: task.assigneeId || 'Unassigned', initials: '?', color: '#9ca3af', isOwner: false, role: '' };
  const [localAssigneeId, setLocalAssigneeId] = useState(task.assigneeId);
  const [savingAssignee, setSavingAssignee] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);

  const handleAssigneeChange = async (newId: string) => {
    setLocalAssigneeId(newId);
    setSavingAssignee(true);
    try {
      await updateTask(task.id, { assigneeId: newId });
      toast.success('Assignee updated');
      refresh?.();
    } catch (err) {
      toast.error('Failed to update assignee: ' + (err as Error).message);
      setLocalAssigneeId(task.assigneeId);
    } finally {
      setSavingAssignee(false);
    }
  };

  const handleMarkComplete = async () => {
    setMarkingComplete(true);
    try {
      await updateTaskStatus(task.id, 'done');
      toast.success('Task marked complete!');
      onStatusChange?.(task.id, 'done');
      refresh?.();
      onClose();
    } catch (err) {
      toast.error('Failed: ' + (err as Error).message);
    } finally {
      setMarkingComplete(false);
    }
  };

  const currentAssignee = TEAM_MEMBERS.find(m => m.id === localAssigneeId) || assignee;

  // Time tracking state
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(
    TIME_ENTRIES.filter(e => e.taskId === task.id)
  );
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [showManual, setShowManual] = useState(false);
  const [manualMinutes, setManualMinutes] = useState('');
  const [manualNote, setManualNote] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning]);

  const formatElapsed = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const [, startTransition] = useTransition();

  const stopTimer = () => {
    setIsRunning(false);
    if (elapsed >= 60) {
      const mins = Math.round(elapsed / 60);
      const entry: TimeEntry = {
        id: `te-live-${Date.now()}`,
        taskId: task.id,
        clientId: task.clientId,
        memberId: CURRENT_USER_ID,
        date: new Date().toISOString().split('T')[0],
        durationMinutes: mins,
        note: 'Timer session',
      };
      setTimeEntries(prev => [entry, ...prev]);
      // Persist to Supabase
      startTransition(async () => {
        try {
          await createTimeEntry({
            taskId: task.id,
            clientId: task.clientId,
            memberId: CURRENT_USER_ID,
            date: new Date().toISOString().split('T')[0],
            durationMinutes: mins,
            note: 'Timer session',
          });
          toast.success(`Logged ${mins} min`);
        } catch { /* silent */ }
      });
    }
    setElapsed(0);
  };

  const addManualEntry = () => {
    const mins = parseInt(manualMinutes);
    if (!mins || mins <= 0) return;
    const entry: TimeEntry = {
      id: `te-manual-${Date.now()}`,
      taskId: task.id,
      clientId: task.clientId,
      memberId: CURRENT_USER_ID,
      date: new Date().toISOString().split('T')[0],
      durationMinutes: mins,
      note: manualNote || undefined,
    };
    setTimeEntries(prev => [entry, ...prev]);
    // Persist to Supabase
    startTransition(async () => {
      try {
        await createTimeEntry({
          taskId: task.id,
          clientId: task.clientId,
          memberId: CURRENT_USER_ID,
          date: new Date().toISOString().split('T')[0],
          durationMinutes: mins,
          note: manualNote || undefined,
        });
        toast.success(`Logged ${mins} min`);
      } catch { /* silent */ }
    });
    setManualMinutes('');
    setManualNote('');
    setShowManual(false);
  };

  const totalMinutes = timeEntries.reduce((sum, e) => sum + e.durationMinutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  const isOwner = TEAM_MEMBERS.find(m => m.id === CURRENT_USER_ID)?.isOwner;
  const overdue = new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between flex-shrink-0">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: (client.color || '#6366f1') + '18', color: client.color || '#6366f1' }}
              >
                {client.name}
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>
                {task.priority}
              </span>
              {overdue && (
                <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">
                  Overdue
                </span>
              )}
            </div>
            <h2 className="font-semibold text-gray-900 dark:text-white text-lg leading-snug">{task.title}</h2>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {onEdit && (
              <button
                onClick={() => onEdit(task)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Edit task"
              >
                <Pencil size={13} />
                Edit
              </button>
            )}
            {onArchive && (
              <button
                onClick={() => onArchive(task.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Archive task"
              >
                <Archive size={13} />
                Archive
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors ml-1">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Meta row */}
          <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
            {/* Editable assignee */}
            <div className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                style={{ backgroundColor: currentAssignee.color }}
              >
                {currentAssignee.initials}
              </div>
              <select
                value={localAssigneeId}
                onChange={e => handleAssigneeChange(e.target.value)}
                disabled={savingAssignee}
                className="text-xs border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
              >
                {TEAM_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              {savingAssignee && <Loader2 size={11} className="animate-spin text-indigo-500" />}
            </div>
            <div className="flex items-center gap-1">
              <CalendarDays size={12} />
              <span>Due {new Date(task.dueDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className={`capitalize px-2 py-0.5 rounded-full font-medium ${
              task.status === 'done' ? 'bg-green-100 text-green-700' :
              task.status === 'review' ? 'bg-amber-100 text-amber-700' :
              task.status === 'inprogress' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {task.status === 'inprogress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
            </div>
          </div>

          {/* Mark Complete button */}
          {task.status !== 'done' && (
            <button
              onClick={handleMarkComplete}
              disabled={markingComplete}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {markingComplete ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
              Mark as Complete
            </button>
          )}

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{task.description}</p>

          {/* Dependencies */}
          {((task.dependencies && task.dependencies.length > 0) || TASKS.some(t => t.dependencies?.includes(task.id))) && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <Lock size={13} className="text-gray-500" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Dependencies</span>
              </div>
              <div className="px-4 py-3 space-y-2">
                {task.dependencies && task.dependencies.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1.5">Blocked by</div>
                    {task.dependencies.map(depId => {
                      const dep = TASKS.find(t => t.id === depId);
                      if (!dep) return null;
                      const isBlocked = dep.status !== 'done';
                      return (
                        <div key={depId} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs mb-1 ${isBlocked ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'}`}>
                          {isBlocked ? <Lock size={10} /> : <CheckCircle size={10} />}
                          <span className="flex-1 font-medium truncate">{dep.title}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] capitalize ${isBlocked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                            {dep.status === 'done' ? 'Done' : dep.status === 'inprogress' ? 'In Progress' : dep.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {TASKS.filter(t => t.dependencies?.includes(task.id)).length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1.5">Blocks</div>
                    {TASKS.filter(t => t.dependencies?.includes(task.id)).map(blocking => (
                      <div key={blocking.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 mb-1">
                        <ArrowRight size={10} />
                        <span className="flex-1 font-medium truncate">{blocking.title}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-600 capitalize">
                          {blocking.status === 'inprogress' ? 'In Progress' : blocking.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Approval action if in review */}
          {task.status === 'review' && isOwner && (
            <button
              onClick={() => { onClose(); onOpenApproval(task); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-sm font-medium transition-colors"
            >
              <CheckCircle size={15} />
              Open Review &amp; Approve
            </button>
          )}

          {/* Time Tracking */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer size={14} className="text-indigo-600" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Time Tracking</span>
              </div>
              <div className="text-sm text-gray-500">
                Total: <span className="font-semibold text-gray-900 dark:text-white">{totalHours}h</span>
                <span className="text-xs ml-1">({totalMinutes} min)</span>
              </div>
            </div>

            <div className="p-4">
              {/* Timer controls */}
              <div className="flex items-center gap-3 mb-4">
                {!isRunning ? (
                  <button
                    onClick={() => setIsRunning(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Play size={14} />
                    Start Timer
                  </button>
                ) : (
                  <button
                    onClick={stopTimer}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Square size={14} />
                    Stop — {formatElapsed(elapsed)}
                  </button>
                )}
                {isRunning && (
                  <div className="flex items-center gap-2 text-sm text-indigo-600 font-mono font-medium">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    {formatElapsed(elapsed)}
                  </div>
                )}
                <button
                  onClick={() => setShowManual(!showManual)}
                  className="flex items-center gap-1.5 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm transition-colors ml-auto"
                >
                  <Edit3 size={13} />
                  Manual entry
                </button>
              </div>

              {/* Manual entry form */}
              {showManual && (
                <div className="flex items-end gap-3 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Minutes</label>
                    <input
                      type="number"
                      value={manualMinutes}
                      onChange={e => setManualMinutes(e.target.value)}
                      placeholder="60"
                      min="1"
                      className="w-20 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Note (optional)</label>
                    <input
                      type="text"
                      value={manualNote}
                      onChange={e => setManualNote(e.target.value)}
                      placeholder="What did you work on?"
                      className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    onClick={addManualEntry}
                    disabled={!manualMinutes || parseInt(manualMinutes) <= 0}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>
              )}

              {/* Time log */}
              {timeEntries.length > 0 ? (
                <div className="space-y-2">
                  {timeEntries.map(entry => {
                    const member = TEAM_MEMBERS.find(m => m.id === entry.memberId);
                    const hours = Math.floor(entry.durationMinutes / 60);
                    const mins = entry.durationMinutes % 60;
                    const durationStr = hours > 0
                      ? `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim()
                      : `${mins}m`;
                    return (
                      <div key={entry.id} className="flex items-center gap-3 py-2 text-xs border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0"
                          style={{ backgroundColor: member?.color || '#6366f1' }}
                        >
                          {member?.initials || '?'}
                        </div>
                        <span className="text-gray-500 w-20 flex-shrink-0">
                          {new Date(entry.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white w-16 flex-shrink-0">{durationStr}</span>
                        <span className="text-gray-500 flex-1 truncate">{entry.note || '—'}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-4">No time entries yet. Start the timer or add a manual entry.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, isDragging = false, onOpenApproval, onOpenDetail }: { task: Task; isDragging?: boolean; onOpenApproval?: (task: Task) => void; onOpenDetail?: (task: Task) => void }) {
  const { CLIENTS = [], TEAM_MEMBERS = [], TASKS = [] } = useAppData();
  // Use fallbacks for unknown client/assignee — never show permanent skeleton
  const client = CLIENTS.find(c => c.id === task.clientId) ?? { id: task.clientId, name: task.clientId || 'Unknown', color: '#9ca3af', logo: '?' };
  const assignee = TEAM_MEMBERS.find(m => m.id === task.assigneeId) ?? { id: task.assigneeId, name: task.assigneeId || 'Unassigned', initials: task.assigneeId?.slice(0, 2).toUpperCase() || '?', color: '#9ca3af', isOwner: false };
  const overdue = task.dueDate ? new Date(task.dueDate) < new Date() && task.status !== 'done' : false;
  const isOwner = TEAM_MEMBERS.find(m => m.id === CURRENT_USER_ID)?.isOwner;

  // Check if this task is blocked (has unfinished dependencies)
  const isBlocked = !isDragging && task.status !== 'done' && (task.dependencies || []).some(depId => {
    const dep = TASKS.find(t => t.id === depId);
    return dep && dep.status !== 'done';
  });

  return (
    <div
      onClick={() => !isDragging && onOpenDetail?.(task)}
      className={`task-card bg-white dark:bg-gray-800 rounded-lg border p-3.5 ${
        isBlocked ? 'border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-700'
      } ${
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

      {/* Blocked indicator */}
      {isBlocked && (
        <div className="flex items-center gap-1.5 mb-2 text-xs text-red-600 dark:text-red-400">
          <Lock size={11} />
          <span>Blocked</span>
        </div>
      )}

      {/* Title */}
      <p className={`text-sm font-medium leading-snug mb-3 ${isBlocked ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
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
          style={{ backgroundColor: assignee?.color || '#6366f1' }}
          title={assignee?.name || 'Unknown'}
        >
          {assignee?.initials || '?'}
        </div>
      </div>
    </div>
  );
}

function SortableTaskCard({ task, onOpenApproval, onOpenDetail }: { task: Task; onOpenApproval?: (task: Task) => void; onOpenDetail?: (task: Task) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onOpenApproval={onOpenApproval} onOpenDetail={onOpenDetail} />
    </div>
  );
}

function Column({
  id,
  label,
  color,
  tasks,
  onOpenApproval,
  onOpenDetail,
  onNewTask,
}: {
  id: Status;
  label: string;
  color: string;
  tasks: Task[];
  onOpenApproval?: (task: Task) => void;
  onOpenDetail?: (task: Task) => void;
  onNewTask?: () => void;
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
        <button
          onClick={onNewTask}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:text-indigo-600 transition-colors"
          title={`New ${label} task`}
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Cards */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-[70vh]">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <SortableTaskCard key={task.id} task={task} onOpenApproval={onOpenApproval} onOpenDetail={onOpenDetail} />
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
  const { TASKS = [], CLIENTS = [], TEAM_MEMBERS = [], TIME_ENTRIES = [], PROJECTS = [] } = useAppData();

  const [taskState, setTaskState] = useState<Task[]>([]);
  const [initialLoaded, setInitialLoaded] = useState(false);
  // Update taskState when TASKS loads/changes from Supabase
  useEffect(() => {
    setTaskState(TASKS.filter(t => !t.isMilestone));
    if (TASKS.length > 0) setInitialLoaded(true);
  }, [TASKS]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [filterClient, setFilterClient] = useState(clientFilter);
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [approvalTask, setApprovalTask] = useState<Task | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskDefaultStatus, setNewTaskDefaultStatus] = useState<string>('todo');
  const [archiveTaskId, setArchiveTaskId] = useState<string | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const filteredTasks = taskState.filter(task => {
    if (filterClient !== 'all' && task.clientId !== filterClient) return false;
    if (filterAssignee !== 'all' && task.assigneeId !== filterAssignee) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    if (filterProject !== 'all') {
      const project = PROJECTS.find(p => p.id === filterProject);
      if (!project || !project.taskIds.includes(task.id)) return false;
    }
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

    // Persist new status to Supabase
    const newStatus = taskState.find(t => t.id === activeId)?.status;
    if (newStatus) {
      startTransition(async () => {
        try {
          await updateTaskStatus(activeId, newStatus);
        } catch {
          toast.error('Failed to save status change');
          // Revert optimistic update
          setTaskState(TASKS.filter(t => !t.isMilestone));
        }
      });
    }
  }, [taskState, TASKS]);

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

  const activeFilters = (filterClient !== 'all' ? 1 : 0) + (filterAssignee !== 'all' ? 1 : 0) + (filterPriority !== 'all' ? 1 : 0) + (filterProject !== 'all' ? 1 : 0);

  const openDetail = (task: Task) => {
    const latest = taskState.find(t => t.id === task.id) || task;
    setDetailTask(latest);
  };

  const handleArchiveTask = (taskId: string) => {
    setArchiveTaskId(taskId);
  };

  const confirmArchive = () => {
    if (!archiveTaskId) return;
    const id = archiveTaskId;
    setArchiveTaskId(null);
    setDetailTask(null);
    // Optimistic remove
    setTaskState(prev => prev.filter(t => t.id !== id));
    startTransition(async () => {
      try {
        await archiveTask(id);
        toast.success('Task archived');
      } catch {
        toast.error('Failed to archive task');
        setTaskState(TASKS.filter(t => !t.isMilestone));
      }
    });
  };

  return (
    <div>
      {/* New/Edit Task Modal */}
      {(showNewTaskModal || editTask) && (
        <TaskModal
          task={editTask || undefined}
          defaultStatus={newTaskDefaultStatus}
          onClose={() => { setShowNewTaskModal(false); setEditTask(null); }}
          onSuccess={() => { setShowNewTaskModal(false); setEditTask(null); setDetailTask(null); }}
        />
      )}

      {/* Archive confirmation */}
      {archiveTaskId && (
        <ConfirmDialog
          title="Archive Task"
          message="Archive this task? It will be hidden from all views but can be recovered."
          confirmLabel="Archive"
          destructive
          onConfirm={confirmArchive}
          onCancel={() => setArchiveTaskId(null)}
        />
      )}

      {/* Task Detail Modal */}
      {detailTask && !editTask && !archiveTaskId && (
        <TaskDetailModal
          task={detailTask}
          onClose={() => setDetailTask(null)}
          onOpenApproval={(task) => { setDetailTask(null); openApproval(task); }}
          onEdit={(task) => { setEditTask(task); }}
          onArchive={(taskId) => handleArchiveTask(taskId)}
          onStatusChange={(taskId, status) => {
            setTaskState(prev => prev.map(t => t.id === taskId ? { ...t, status: status as Task['status'] } : t));
          }}
        />
      )}

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
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5">
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
            onClick={() => { setFilterClient('all'); setFilterAssignee('all'); setFilterPriority('all'); setFilterProject('all'); }}
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

        {/* New Task + Reviewer indicator */}
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => { setNewTaskDefaultStatus('todo'); setShowNewTaskModal(true); }}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={14} />
            New Task
          </button>
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
              style={{ backgroundColor: TEAM_MEMBERS.find(m => m.id === CURRENT_USER_ID)?.color }}
            >
              {TEAM_MEMBERS.find(m => m.id === CURRENT_USER_ID)?.initials}
            </div>
            Reviewing as {TEAM_MEMBERS.find(m => m.id === CURRENT_USER_ID)?.name.split(' ')[0]} (Owner)
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 mb-5 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
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
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Project</label>
            <select
              value={filterProject}
              onChange={e => setFilterProject(e.target.value)}
              className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Projects</option>
              {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
        {/* Mobile: horizontal scroll; Desktop: 4-col grid */}
        <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0 pb-4">
          <div className="flex gap-4 lg:grid lg:grid-cols-4" style={{ minWidth: 'max-content' }}>
            {COLUMNS.map(col => (
              <div key={col.id} className="w-[85vw] sm:w-80 lg:w-auto flex-shrink-0 lg:flex-shrink">
                <Column
                  id={col.id}
                  label={col.label}
                  color={col.color}
                  tasks={getColumnTasks(col.id)}
                  onOpenApproval={openApproval}
                  onOpenDetail={openDetail}
                  onNewTask={() => { setNewTaskDefaultStatus(col.id); setShowNewTaskModal(true); }}
                />
              </div>
            ))}
          </div>
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {activeTask && CLIENTS.find(c => c.id === activeTask.clientId) && TEAM_MEMBERS.find(m => m.id === activeTask.assigneeId) && (
            <TaskCard task={activeTask} isDragging />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
