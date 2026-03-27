'use client';

import { X, ExternalLink } from 'lucide-react';
import type { Node } from '@xyflow/react';

interface PlanDetailPanelProps {
  node: Node;
  onClose: () => void;
}

function DetailRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="mb-3">
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-sm text-gray-800">{value}</div>
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${color}`}>
      {label}
    </span>
  );
}

export function PlanDetailPanel({ node, onClose }: PlanDetailPanelProps) {
  const data = node.data as Record<string, any>;

  function renderContent() {
    switch (node.type) {
      case 'planRoot':
        return (
          <>
            <div className="text-lg font-bold text-gray-900 mb-1">{data.label}</div>
            <div className="text-sm text-gray-500">{data.year}</div>
          </>
        );

      case 'planPillar': {
        const { pillar, kpiCount, focusAreaCount } = data;
        return (
          <>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: pillar.color }} />
              <div className="text-base font-bold text-gray-900">{pillar.name}</div>
            </div>
            {pillar.description && <DetailRow label="Description" value={pillar.description} />}
            <div className="flex gap-2 flex-wrap mt-2">
              <Badge label={`${kpiCount} KPIs`} color="bg-indigo-50 text-indigo-600" />
              <Badge label={`${focusAreaCount} Focus Areas`} color="bg-teal-50 text-teal-600" />
            </div>
          </>
        );
      }

      case 'planFocusArea': {
        const { focusArea } = data;
        return (
          <>
            <div className="text-base font-bold text-gray-900 mb-2">{focusArea.name}</div>
            {focusArea.description && <DetailRow label="Description" value={focusArea.description} />}
            <Badge
              label={focusArea.status}
              color={focusArea.status === 'active' ? 'bg-teal-50 text-teal-700' : 'bg-gray-100 text-gray-500'}
            />
          </>
        );
      }

      case 'planStrategy': {
        const { strategy } = data;
        const statusColors: Record<string, string> = {
          active: 'bg-green-50 text-green-700',
          draft: 'bg-gray-100 text-gray-600',
          queued: 'bg-blue-50 text-blue-700',
          complete: 'bg-indigo-50 text-indigo-700',
        };
        return (
          <>
            <div className="text-base font-bold text-gray-900 mb-1">{strategy.name}</div>
            <div className="text-sm text-gray-500 mb-3">{strategy.quarter}</div>
            {strategy.description && <DetailRow label="Description" value={strategy.description} />}
            <DetailRow label="Period" value={`${strategy.startDate} → ${strategy.endDate}`} />
            <Badge label={strategy.status} color={statusColors[strategy.status] ?? 'bg-gray-100 text-gray-600'} />
          </>
        );
      }

      case 'planInitiative': {
        const { project, taskCount } = data;
        const statusColors: Record<string, string> = {
          active: 'bg-blue-50 text-blue-700',
          planning: 'bg-gray-100 text-gray-600',
          complete: 'bg-green-50 text-green-700',
          'on-hold': 'bg-amber-50 text-amber-700',
        };
        return (
          <>
            <div className="text-base font-bold text-gray-900 mb-1">{project.name}</div>
            {project.description && <DetailRow label="Description" value={project.description} />}
            <DetailRow label="Period" value={`${project.startDate} → ${project.endDate}`} />
            <DetailRow label="Progress" value={`${project.progress ?? 0}%`} />
            <DetailRow label="Tasks" value={taskCount} />
            <div className="w-full bg-gray-100 rounded-full h-2 mt-2 mb-3 overflow-hidden">
              <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${Math.min(project.progress ?? 0, 100)}%` }} />
            </div>
            <Badge label={project.status} color={statusColors[project.status] ?? 'bg-gray-100 text-gray-600'} />
          </>
        );
      }

      case 'planTask': {
        const { task } = data;
        const statusColors: Record<string, string> = {
          todo: 'bg-gray-100 text-gray-600',
          inprogress: 'bg-yellow-50 text-yellow-700',
          review: 'bg-purple-50 text-purple-700',
          done: 'bg-green-50 text-green-700',
        };
        const statusLabels: Record<string, string> = {
          todo: 'To Do',
          inprogress: 'In Progress',
          review: 'Review',
          done: 'Done',
        };
        return (
          <>
            <div className="text-base font-bold text-gray-900 mb-1">{task.title}</div>
            {task.description && <DetailRow label="Description" value={task.description} />}
            {task.dueDate && <DetailRow label="Due Date" value={task.dueDate} />}
            <Badge label={statusLabels[task.status] ?? task.status} color={statusColors[task.status] ?? 'bg-gray-100 text-gray-600'} />
          </>
        );
      }

      case 'planGoal': {
        const { goal } = data;
        const statusColors: Record<string, string> = {
          active: 'bg-amber-50 text-amber-700',
          achieved: 'bg-green-50 text-green-700',
          archived: 'bg-gray-100 text-gray-500',
        };
        return (
          <>
            <div className="text-base font-bold text-gray-900 mb-1">{goal.title}</div>
            {goal.description && <DetailRow label="Description" value={goal.description} />}
            {goal.targetMetric && <DetailRow label="Target Metric" value={goal.targetMetric} />}
            <Badge label={goal.status} color={statusColors[goal.status] ?? 'bg-gray-100 text-gray-600'} />
          </>
        );
      }

      case 'planOutcome': {
        const { outcome } = data;
        return (
          <>
            <div className="text-base font-bold text-gray-900 mb-1">{outcome.title}</div>
            {outcome.description && <DetailRow label="Description" value={outcome.description} />}
            {outcome.metricValue && <DetailRow label="Metric Value" value={outcome.metricValue} />}
            {outcome.period && <DetailRow label="Period" value={outcome.period} />}
            {outcome.evidenceUrl && (
              <a
                href={outcome.evidenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 mt-2"
              >
                <ExternalLink size={12} />
                Evidence
              </a>
            )}
          </>
        );
      }

      default:
        return <div className="text-sm text-gray-500">Select a node to view details.</div>;
    }
  }

  return (
    <div className="w-80 flex-shrink-0 bg-white border-l border-gray-200 h-full overflow-y-auto flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Node Details</div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
        >
          <X size={15} />
        </button>
      </div>
      <div className="px-4 py-4 flex-1">{renderContent()}</div>
    </div>
  );
}
