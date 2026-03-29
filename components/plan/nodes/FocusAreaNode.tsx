'use client';

import { Handle, Position } from '@xyflow/react';
import type { FocusArea } from '@/lib/data';

interface FocusAreaNodeData {
  focusArea: FocusArea;
}

export function FocusAreaNode({ data }: { data: FocusAreaNodeData }) {
  const { focusArea } = data;
  return (
    <div className="px-4 py-2.5 rounded-xl bg-teal-50 border border-teal-200 min-w-[160px] text-center shadow-sm select-none">
      <Handle type="target" position={Position.Top} id="target" className="!w-3 !h-3 !bg-teal-300" />
      <div className="font-medium text-sm text-teal-800 leading-tight">{focusArea.name}</div>
      <div className="mt-1">
        <span
          className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
            focusArea.status === 'active'
              ? 'bg-teal-100 text-teal-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {focusArea.status}
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} id="source" className="!w-3 !h-3 !bg-teal-300" />
    </div>
  );
}
