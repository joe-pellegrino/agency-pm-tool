'use client';

import { useState } from 'react';
import { Edit2, AlertCircle, Clock, User } from 'lucide-react';
import type { Task } from '@/lib/data';
import { useAppData } from '@/lib/contexts/AppDataContext';
import Drawer from '@/components/ui/Drawer';
import TaskComments from '@/components/tasks/TaskComments';
import TaskModal from '@/components/tasks/TaskModal';

interface TaskDetailDrawerProps {
  task?: Task | null;
  isOpen: boolean;
  onClose: () => void;
  defaultClientId?: string;
  defaultProjectId?: string;
  defaultStatus?: string;
}

const STATUSES: Record<string, { label: string; color: string }> = {
  todo: { label: 'To Do', color: 'bg-gray-100 text-gray-700' },
  inprogress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  review: { label: 'Review', color: 'bg-amber-100 text-amber-700' },
  done: { label: 'Done', color: 'bg-green-100 text-green-700' },
};

const PRIORITIES: Record<string, { label: string; color: string }> = {
  Urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700' },
  High: { label: 'High', color: 'bg-orange-100 text-orange-700' },
  Medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  Low: { label: 'Low', color: 'bg-gray-100 text-gray-700' },
};

export default function TaskDetailDrawer({
  task,
  isOpen,
  onClose,
  defaultClientId,
  defaultProjectId,
  defaultStatus = 'todo',
}: TaskDetailDrawerProps) {
  const { TEAM_MEMBERS = [], CLIENTS = [] } = useAppData();
  const [showEditModal, setShowEditModal] = useState(false);

  if (!task && !defaultClientId) {
    return null;
  }

  // If no task, show create form
  if (!task) {
    return (
      <TaskModal
        defaultClientId={defaultClientId}
        defaultProjectId={defaultProjectId}
        defaultStatus={defaultStatus}
        onClose={onClose}
      />
    );
  }

  const assignee = TEAM_MEMBERS.find(m => m.id === task.assigneeId);
  const client = CLIENTS.find(c => c.id === task.clientId);
  const statusConfig = STATUSES[task.status] || STATUSES.todo;
  const priorityConfig = PRIORITIES[task.priority] || PRIORITIES.Medium;

  return (
    <>
      <TaskModal task={task} onClose={() => setShowEditModal(false)} />
      <Drawer
        isOpen={isOpen && !showEditModal}
        onClose={onClose}
        title={task.title}
        variant="details"
      >
        <div className="space-y-6">
          {/* Edit Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-1.5 text-sm text-[#3B5BDB] hover:bg-[#EEF2FF] px-2 py-1 rounded transition-colors"
              title="Edit task"
            >
              <Edit2 size={14} />
              Edit
            </button>
          </div>

          {/* Status & Priority Badges */}
          <div className="flex gap-2">
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${priorityConfig.color}`}>
              {priorityConfig.label}
            </span>
          </div>

          {/* Client Info */}
          {client && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Client</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">{client.name}</p>
            </div>
          )}

          {/* Assignee */}
          {assignee && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <User size={14} className="text-gray-500" />
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned To</h4>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: assignee.color || '#3B5BDB' }}
                  title={assignee.name}
                >
                  {assignee.initials}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{assignee.name}</span>
              </div>
            </div>
          )}

          {/* Due Date */}
          {task.dueDate && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-gray-500" />
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Date</h4>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{task.dueDate}</p>
            </div>
          )}

          {/* Dates */}
          {(task.startDate || task.endDate) && (
            <div className="grid grid-cols-2 gap-4">
              {task.startDate && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Start Date</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{task.startDate}</p>
                </div>
              )}
              {task.endDate && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">End Date</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{task.endDate}</p>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {task.description && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* Comments Section */}
          <div>
            <TaskComments taskId={task.id} />
          </div>
        </div>
      </Drawer>
    </>
  );
}
