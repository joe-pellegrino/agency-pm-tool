'use client';

import { Handle, Position } from '@xyflow/react';
import type { Strategy } from '@/lib/data';

interface StrategyNodeData {
  strategy: Strategy;
  dimmed?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-600',
  queued: 'bg-blue-100 text-blue-600',
  complete: 'bg-indigo-100 text-indigo-600',
};

export function StrategyNode({ data }: { data: StrategyNodeData }) {
  const { strategy, dimmed } = data;
  const isActive = strategy.status === 'active';

  return (
    <div
      className={`px-4 py-3 rounded-xl border min-w-[180px] text-center shadow-md select-none transition-opacity ${
        dimmed ? 'opacity-50 bg-indigo-900/60' : 'bg-indigo-950'
      } ${isActive ? 'ring-2 ring-green-400 ring-offset-1 border-indigo-800' : 'border-indigo-800'}`}
    >
      <Handle type="target" position={Position.Top} id="target" className="!w-3 !h-3 !bg-indigo-700" />

      {isActive && (
        <div className="flex justify-center mb-1">
          <span className="text-[9px] font-bold text-green-400 uppercase tracking-widest">● Active</span>
        </div>
      )}

      <div className={`font-semibold text-sm leading-tight ${dimmed ? 'text-indigo-300' : 'text-white'}`}>
        {strategy.name}
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-1.5">
        <span className={`text-[10px] font-medium ${dimmed ? 'text-indigo-500' : 'text-indigo-300'}`}>
          {strategy.quarter}
        </span>
        <span
          className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${STATUS_STYLES[strategy.status] ?? 'bg-gray-100 text-gray-600'} ${dimmed ? 'opacity-70' : ''}`}
        >
          {strategy.status}
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} id="source" className="!w-3 !h-3 !bg-indigo-700" />
    </div>
  );
}
