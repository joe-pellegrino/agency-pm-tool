'use client';

import { Handle, Position } from '@xyflow/react';
import type { Task } from '@/lib/data';

interface TaskNodeData {
  task: Task;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  todo: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
  inprogress: { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200' },
  review: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  done: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200' },
};

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  inprogress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

export function TaskNode({ data }: { data: TaskNodeData }) {
  const { task } = data;
  const styles = STATUS_COLORS[task.status] ?? STATUS_COLORS.todo;
  return (
    <div
      className={`px-3 py-2 rounded-lg border min-w-[155px] shadow-sm select-none ${styles.bg} ${styles.border}`}
    >
      <Handle type="target" position={Position.Top} id="target" className="!w-2.5 !h-2.5 !bg-gray-300" />
      <div className={`font-medium text-xs leading-tight truncate max-w-[150px] ${styles.text}`}>
        {task.title}
      </div>
      <div className="mt-1">
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-white/60 border ${styles.border} ${styles.text}`}>
          {STATUS_LABELS[task.status] ?? task.status}
        </span>
      </div>
    </div>
  );
}
