'use client';

import { Handle, Position } from '@xyflow/react';
import type { ClientPillar } from '@/lib/data';

interface PillarNodeData {
  pillar: ClientPillar;
  kpiCount: number;
  focusAreaCount: number;
  dimmed?: boolean;
}

export function PillarNode({ data }: { data: PillarNodeData }) {
  const { pillar, kpiCount, focusAreaCount, dimmed } = data;
  return (
    <div
      className={`rounded-xl bg-white shadow-md border border-gray-200 min-w-[180px] text-center overflow-hidden select-none transition-opacity ${dimmed ? 'opacity-50' : ''}`}
      style={{ borderLeft: `4px solid ${pillar.color}` }}
    >
      <Handle type="target" position={Position.Top} id="target" className="!w-3 !h-3 !bg-gray-300" />
      <div className="px-4 py-3">
        <div className="font-semibold text-sm text-gray-900 leading-tight">{pillar.name}</div>
        <div className="flex items-center justify-center gap-2 mt-1.5 flex-wrap">
          {kpiCount > 0 && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600">
              {kpiCount} KPI{kpiCount !== 1 ? 's' : ''}
            </span>
          )}
          {focusAreaCount > 0 && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-teal-50 text-teal-600">
              {focusAreaCount} focus area{focusAreaCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} id="source" className="!w-3 !h-3 !bg-gray-300" />
    </div>
  );
}
