import { Suspense } from 'react';
import TopBar from '@/components/layout/TopBar';
import KanbanBoard from '@/components/kanban/KanbanBoard';

export default function KanbanPage() {
  return (
    <div className="pt-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopBar title="Kanban Board" subtitle="Drag and drop tasks to update status" />
      <div className="p-6">
        <Suspense fallback={<div className="text-gray-500">Loading board...</div>}>
          <KanbanBoard />
        </Suspense>
      </div>
    </div>
  );
}
