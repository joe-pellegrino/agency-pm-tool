'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const DocumentEditorContent = dynamic(
  () => import('./DocumentEditorContent'),
  {
    ssr: false,
    loading: () => (
      <div className="pt-16 min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-indigo-500" />
      </div>
    ),
  }
);

export default function DocumentEditorPage() {
  return <DocumentEditorContent />;
}
