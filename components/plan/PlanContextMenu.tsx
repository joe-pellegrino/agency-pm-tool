'use client';

import { useEffect, useRef } from 'react';
import { Plus, Link } from 'lucide-react';

export type PlanAction =
  | 'new-strategy'
  | 'new-goal'
  | 'add-pillar'
  | 'new-focus-area'
  | 'new-initiative'
  | 'new-kpi'
  | 'new-task'
  | 'new-outcome';

interface PlanContextMenuProps {
  position: { x: number; y: number };
  sourceNodeId: string;
  sourceNodeType: string;
  onSelect: (action: PlanAction, sourceNodeId: string) => void;
  onClose: () => void;
}

const MENU_ITEMS: Record<string, Array<{ action: PlanAction; label: string; icon: 'plus' | 'link' }>> = {
  planRoot: [
    { action: 'new-strategy', label: 'New Strategy', icon: 'plus' },
    { action: 'new-goal', label: 'New Goal', icon: 'plus' },
  ],
  planStrategy: [
    { action: 'add-pillar', label: 'Add Pillar', icon: 'link' },
  ],
  planPillar: [
    { action: 'new-focus-area', label: 'New Focus Area', icon: 'plus' },
    { action: 'new-initiative', label: 'New Initiative', icon: 'plus' },
    { action: 'new-kpi', label: 'New KPI', icon: 'plus' },
  ],
  planInitiative: [
    { action: 'new-task', label: 'New Task', icon: 'plus' },
  ],
  planGoal: [
    { action: 'new-outcome', label: 'New Outcome', icon: 'plus' },
  ],
};

export function PlanContextMenu({
  position,
  sourceNodeId,
  sourceNodeType,
  onSelect,
  onClose,
}: PlanContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const items = MENU_ITEMS[sourceNodeType] ?? [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (items.length === 0) return null;

  return (
    <div
      ref={ref}
      className="fixed z-[500] bg-white rounded-xl shadow-2xl border border-gray-200 py-1.5 min-w-[180px]"
      style={{ left: position.x, top: position.y }}
    >
      <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 mb-1">
        Add to node
      </div>
      {items.map(item => (
        <button
          key={item.action}
          onClick={() => {
            onSelect(item.action, sourceNodeId);
            onClose();
          }}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-left"
        >
          {item.icon === 'plus' ? (
            <Plus size={14} className="text-indigo-400 flex-shrink-0" />
          ) : (
            <Link size={14} className="text-indigo-400 flex-shrink-0" />
          )}
          {item.label}
        </button>
      ))}
    </div>
  );
}
