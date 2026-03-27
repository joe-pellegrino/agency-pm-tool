'use client';

import { Handle, Position } from '@xyflow/react';
import type { ClientGoal, Outcome, Project } from '@/lib/data';

interface GoalNodeData {
  goal: ClientGoal;
  linkedOutcomes?: Outcome[];
  linkedInitiatives?: Project[];
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-amber-100 text-amber-700',
  achieved: 'bg-green-100 text-green-700',
  archived: 'bg-gray-100 text-gray-500',
};

export function GoalNode({ data }: { data: GoalNodeData }) {
  const { goal, linkedOutcomes = [], linkedInitiatives = [] } = data;

  // Calculate progress:
  // 1. If linked outcomes with metric_value exist, compute completion from those
  // 2. Otherwise fall back to average progress of linked initiatives
  // 3. Otherwise show 0%
  let progress = 0;
  const outcomesWithMetrics = linkedOutcomes.filter(o => o.metricValue);
  if (outcomesWithMetrics.length > 0) {
    // Try to parse metric values as percentages or numbers
    const parsed = outcomesWithMetrics
      .map(o => {
        const num = parseInt(o.metricValue || '0', 10);
        return isNaN(num) ? 0 : Math.min(num, 100); // Cap at 100%
      })
      .filter(n => n >= 0 && n <= 100);
    if (parsed.length > 0) {
      progress = Math.round(parsed.reduce((a, b) => a + b, 0) / parsed.length);
    }
  } else if (linkedInitiatives.length > 0) {
    const avgProgress = linkedInitiatives.reduce((sum, p) => sum + (p.progress ?? 0), 0) / linkedInitiatives.length;
    progress = Math.round(avgProgress);
  }

  return (
    <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 min-w-[170px] shadow-sm select-none">
      {/* LEFT handle — target from strategy's left handle */}
      <Handle type="target" position={Position.Left} id="target-left" className="!w-3 !h-3 !bg-amber-400" />

      <div className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider mb-0.5 text-center">Goal</div>
      <div className="font-semibold text-sm text-amber-900 leading-tight text-center">{goal.title}</div>
      {goal.targetMetric && (
        <div className="text-[10px] text-amber-600 mt-1 text-center truncate">{goal.targetMetric}</div>
      )}

      {/* Progress bar */}
      <div className="mt-2 w-full bg-amber-200 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-amber-500 h-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-[9px] font-semibold text-amber-700 mt-0.5 text-center">{progress}%</div>

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
