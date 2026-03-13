'use client';

import { useState, useEffect } from 'react';
import { BarChart3, LayoutDashboard } from 'lucide-react';

export default function DashboardToggle({ onChange }: { onChange: (view: 'standard' | 'executive') => void }) {
  const [view, setView] = useState<'standard' | 'executive'>('standard');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('dashboard-view') as 'standard' | 'executive' | null;
    if (saved) {
      setView(saved);
      onChange(saved);
    }
    setMounted(true);
  }, [onChange]);

  const toggle = (v: 'standard' | 'executive') => {
    setView(v);
    localStorage.setItem('dashboard-view', v);
    onChange(v);
  };

  if (!mounted) return null;

  return (
    <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700">
      <button
        onClick={() => toggle('standard')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          view === 'standard'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
        }`}
      >
        <LayoutDashboard size={13} />
        Standard
      </button>
      <button
        onClick={() => toggle('executive')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          view === 'executive'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
        }`}
      >
        <BarChart3 size={13} />
        Executive
      </button>
    </div>
  );
}
