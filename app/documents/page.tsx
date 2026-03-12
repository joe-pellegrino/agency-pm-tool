import TopBar from '@/components/layout/TopBar';
import DocumentViewer from '@/components/documents/DocumentViewer';

export default function DocumentsPage() {
  return (
    <div className="pt-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopBar title="Documents" subtitle="Marketing strategies, briefs, and brand guidelines" />
      <div className="p-4 sm:p-6">
        <DocumentViewer />
      </div>
    </div>
  );
}
