'use client';

import { useEffect } from 'react';

export default function DocumentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Document editor error:', error);
  }, [error]);

  return (
    <div className="pt-16 min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-8">
      <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-red-200 dark:border-red-800">
        <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Document Editor Error</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          {error?.message || 'Unknown error'}
        </p>
        {error?.stack && (
          <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded overflow-x-auto text-gray-500 dark:text-gray-400 max-h-48 overflow-y-auto mb-4">
            {error.stack}
          </pre>
        )}
        {error?.digest && (
          <p className="text-xs text-gray-400 mb-4">Digest: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
