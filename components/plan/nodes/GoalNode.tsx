'use client';

import { Handle, Position } from '@xyflow/react';
import type { ClientGoal } from '@/lib/data';

interface GoalNodeData {
  goal: ClientGoal;
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-amber-100 text-amber-700',
  achieved: 'bg-green-100 text-green-700',
  archived: 'bg-gray-100 text-gray-500',
};

export function GoalNode({ data }: { data: GoalNodeData }) {
  const { goal } = data;
  return (
    <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 min-w-[170px] shadow-sm select-none">
      {/* LEFT handle — target from strategy's left handle */}
      <Handle type="target" position={Position.Left} id="target-left" className="!w-3 !h-3 !bg-amber-400" />

      <div className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider mb-0.5 text-center">Goal</div>
      <div className="font-semibold text-sm text-amber-900 leading-tight text-center">{goal.title}</div>
      {goal.targetMetric && (
        <div className="text-[10px] text-amber-600 mt-1 text-center truncate">{goal.targetMetric}</div>
      )}
      <div className="flex justify-center mt-1.5">
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${STATUS_STYLES[goal.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {goal.status}
        </span>
      </div>

      {/* RIGHT handle — source to initiatives (cross-reference dashed edges) */}
      <Handle type="source" position={Position.Right} id="source-right" className="!w-3 !h-3 !bg-amber-400" />
    </div>
  );
}
