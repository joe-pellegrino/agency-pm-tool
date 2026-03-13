'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AppData } from '@/lib/supabase/queries';

// Provide the same constants as lib/data.ts exports
interface AppDataContextValue extends Partial<AppData> {
  loading: boolean;
  error: string | null;
}

const AppDataContext = createContext<AppDataContextValue>({
  loading: true,
  error: null,
});

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

  return (
    <AppDataContext.Provider value={{ loading, error, ...data }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  return useContext(AppDataContext);
}
