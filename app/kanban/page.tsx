import { Suspense } from 'react';
import TopBar from '@/components/layout/TopBar';
import KanbanBoard from '@/components/kanban/KanbanBoard';

export default function KanbanPage() {
  return (
    <div style={{ backgroundColor: 'var(--color-bg-page)', minHeight: '100vh' }}>
      <TopBar />
      <div style={{ padding: '24px 32px' }}>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Kanban Board</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Drag and drop tasks to update status</p>
        </div>
        <Suspense fallback={<div style={{ color: 'var(--color-text-muted)' }}>Loading board...</div>}>
          <KanbanBoard />
        </Suspense>
      </div>
    </div>
  );
}
