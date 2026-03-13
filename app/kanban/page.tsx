import { Suspense } from 'react';
import TopBar from '@/components/layout/TopBar';
import KanbanBoard from '@/components/kanban/KanbanBoard';

export default function KanbanPage() {
  return (
    <div className="pt-16 min-h-screen" style={{ backgroundColor: '#F0F3F8' }}>
      <TopBar title="Kanban Board" subtitle="Drag and drop tasks to update status" />
      <div className="p-4 sm:p-6">
        <Suspense fallback={<div className="text-gray-500">Loading board...</div>}>
          <KanbanBoard />
        </Suspense>
      </div>
    </div>
  );
}
