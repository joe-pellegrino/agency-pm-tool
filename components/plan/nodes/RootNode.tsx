'use client';

import { Handle, Position } from '@xyflow/react';

interface RootNodeData {
  label: string;
  year: number;
}

export function RootNode({ data }: { data: RootNodeData }) {
  return (
    <div className="px-5 py-3 rounded-2xl bg-gray-900 text-white shadow-xl border border-gray-700 min-w-[200px] text-center select-none">
      <div className="font-bold text-base leading-tight tracking-tight">{data.label}</div>
      <div className="text-xs text-gray-400 mt-0.5 font-medium">{data.year}</div>
      <Handle type="source" position={Position.Bottom} id="source" className="!w-3 !h-3 !bg-gray-500 !border-gray-600" />
    </div>
  );
}
