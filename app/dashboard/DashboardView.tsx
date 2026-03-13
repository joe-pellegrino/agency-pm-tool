'use client';

import { useState, useCallback, useEffect } from 'react';
import DashboardToggle from './DashboardToggle';
import type { ReactNode } from 'react';

export default function DashboardView({
  standardView,
  executiveView,
}: {
  standardView: ReactNode;
  executiveView: ReactNode;
}) {
  const [view, setView] = useState<'standard' | 'executive'>('standard');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('dashboard-view') as 'standard' | 'executive' | null;
    if (saved) setView(saved);
    setMounted(true);
  }, []);

  const handleChange = useCallback((v: 'standard' | 'executive') => {
    setView(v);
  }, []);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div />
        {mounted && <DashboardToggle onChange={handleChange} />}
      </div>
      {view === 'executive' ? executiveView : standardView}
    </>
  );
}
