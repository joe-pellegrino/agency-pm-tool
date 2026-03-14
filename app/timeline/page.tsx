import TopBar from '@/components/layout/TopBar';
import GanttChart from '@/components/timeline/GanttChart';

export default function TimelinePage() {
  return (
    <div style={{ backgroundColor: 'var(--color-bg-page)', minHeight: '100vh' }}>
      <TopBar title="Timeline" subtitle="Gantt view of all project tasks" />
      <div className="p-4 sm:p-6 overflow-x-auto">
        <GanttChart />
      </div>
    </div>
  );
}
