'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const DocumentEditorContent = dynamic(
  () => import('./DocumentEditorContent'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#EDF0F5' }}>
        <Loader2 size={24} className="animate-spin text-[#3B5BDB]" />
      </div>
    ),
  }
);

export default function DocumentEditorPage() {
  return <DocumentEditorContent />;
}
