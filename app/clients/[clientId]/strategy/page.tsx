'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/**
 * Client-specific strategy page.
 * This page redirects to the main strategy page with the clientId pre-selected
 * as a query parameter to streamline the view.
 */
export default function ClientStrategyPage() {
  const router = useRouter();
  const params = useParams<{ clientId: string }>();
  const { clientId } = params;

  useEffect(() => {
    if (clientId) {
      router.push(`/strategy?clientId=${clientId}`);
    }
  }, [clientId, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#3B5BDB] border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading strategy...</p>
      </div>
    </div>
  );
}
