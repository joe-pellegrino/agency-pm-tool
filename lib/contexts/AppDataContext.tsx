'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AppData } from '@/lib/supabase/queries';

interface AppDataContextValue extends Partial<AppData> {
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const AppDataContext = createContext<AppDataContextValue>({
  loading: true,
  error: null,
  refresh: () => {},
});

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/data')
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch data: ${res.status}`);
        return res.json();
      })
      .then((json: AppData) => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error('AppDataContext error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <AppDataContext.Provider value={{ loading, error, refresh: load, ...data }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  return useContext(AppDataContext);
}
