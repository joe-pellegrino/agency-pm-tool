'use client';

import { Map } from 'lucide-react';

interface PlanModeButtonProps {
  onClick: () => void;
}

export function PlanModeButton({ onClick }: PlanModeButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200"
      title="Open Plan Mode"
    >
      <Map className="w-4 h-4" />
      Plan Mode
    </button>
  );
}
