import { Suspense } from 'react';
import TopBar from '@/components/layout/TopBar';
import KanbanBoard from '@/components/kanban/KanbanBoard';

export default function KanbanPage() {
  return (
    <div style={{ backgroundColor: '#EDF0F5', minHeight: '100vh' }}>
      <TopBar title="Kanban Board" subtitle="Drag and drop tasks to update status" />
      <div style={{ padding: '24px 32px' }}>
        <Suspense fallback={<div style={{ color: '#8896A6' }}>Loading board...</div>}>
          <KanbanBoard />
        </Suspense>
      </div>
    </div>
  );
}
