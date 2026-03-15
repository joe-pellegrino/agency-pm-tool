import TopBar from '@/components/layout/TopBar';
import GanttChart from '@/components/timeline/GanttChart';

export default function TimelinePage() {
  return (
    <div style={{ backgroundColor: 'var(--color-bg-page)', minHeight: '100vh' }}>
      <TopBar />
      <div className="p-4 sm:p-6 overflow-x-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Timeline</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gantt view of all initiative tasks</p>
        </div>
        <GanttChart />
      </div>
    </div>
  );
}
