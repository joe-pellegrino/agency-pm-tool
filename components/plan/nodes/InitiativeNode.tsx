'use client';

import { Handle, Position } from '@xyflow/react';
import type { Project } from '@/lib/data';

interface InitiativeNodeData {
  project: Project;
  taskCount: number;
  hasGoalLink?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-blue-100 text-blue-700',
  planning: 'bg-gray-100 text-gray-600',
  complete: 'bg-green-100 text-green-700',
  'on-hold': 'bg-amber-100 text-amber-700',
};

export function InitiativeNode({ data }: { data: InitiativeNodeData }) {
  const { project, taskCount, hasGoalLink } = data;
  const progress = project.progress ?? 0;
  return (
    <div className="px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 min-w-[180px] shadow-sm select-none">
      {/* TOP handle — target from pillar (vertical tree) */}
      <Handle type="target" position={Position.Top} id="target-top" className="!w-3 !h-3 !bg-blue-300" />

      {/* LEFT handle — optional target from goal right handle (cross-reference) */}
      {hasGoalLink && (
        <Handle type="target" position={Position.Left} id="target-left" className="!w-3 !h-3 !bg-amber-400" />
      )}

      <div className="font-semibold text-sm text-blue-900 leading-tight text-center">{project.name}</div>
      <div className="flex items-center justify-center gap-1.5 mt-1.5">
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${STATUS_STYLES[project.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {project.status}
        </span>
        {taskCount > 0 && (
          <span className="text-[10px] text-blue-500">{taskCount} tasks</span>
        )}
      </div>
      {/* Progress bar */}
      <div className="mt-2 w-full bg-blue-100 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-1.5 rounded-full bg-blue-500 transition-all"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <div className="text-[10px] text-blue-400 text-right mt-0.5">{progress}%</div>

      {/* BOTTOM handle — source to tasks */}
      <Handle type="source" position={Position.Bottom} id="source-bottom" className="!w-3 !h-3 !bg-blue-300" />
    </div>
  );
}
