'use client';

import { Handle, Position } from '@xyflow/react';
import type { Outcome } from '@/lib/data';

interface OutcomeNodeData {
  outcome: Outcome;
}

export function OutcomeNode({ data }: { data: OutcomeNodeData }) {
  const { outcome } = data;
  return (
    <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 min-w-[170px] shadow-sm select-none">
      <Handle type="target" position={Position.Top} id="target" className="!w-3 !h-3 !bg-emerald-300" />
      <div className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-0.5 text-center">Outcome</div>
      <div className="font-semibold text-sm text-emerald-900 leading-tight text-center">{outcome.title}</div>
      {outcome.metricValue && (
        <div className="text-[10px] text-emerald-600 mt-1 text-center">{outcome.metricValue}</div>
      )}
      {outcome.period && (
        <div className="text-[10px] text-emerald-400 text-center">{outcome.period}</div>
      )}
    </div>
  );
}
