'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const DocumentEditorContent = dynamic(
  () => import('./DocumentEditorContent'),
  {
    ssr: false,
    loading: () => (
      <div className="pt-16 min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F0F3F8' }}>
        <Loader2 size={24} className="animate-spin text-[#4F6AE8]" />
      </div>
    ),
  }
);

export default function DocumentEditorPage() {
  return <DocumentEditorContent />;
}
