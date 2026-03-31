'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import type { AppData } from '@/lib/supabase/queries';

interface AppDataContextValue extends Partial<AppData> {
  loading: boolean;
  error: string | null;
  refresh: () => void;
  optimisticUpdate: (updater: (prev: AppData) => AppData) => void;
}

const AppDataContext = createContext<AppDataContextValue>({
  loading: true,
  error: null,
  refresh: () => {},
  optimisticUpdate: () => {},
});

// Map routes to their scoped endpoints
function getEndpointForPath(pathname: string): string {
  if (pathname.startsWith('/kanban')) return '/api/data/kanban';
  if (pathname.startsWith('/documents')) return '/api/data/documents';
  if (pathname.startsWith('/strategy')) return '/api/data/strategies';
  if (pathname.startsWith('/services')) return '/api/data/services';
  if (pathname.startsWith('/assets')) return '/api/data/assets';
  if (pathname.startsWith('/settings')) return '/api/data/settings';
  if (pathname.startsWith('/knowledge-base')) return '/api/data/kb';
  if (pathname.startsWith('/dashboard')) return '/api/data/dashboard';
  if (pathname.startsWith('/campaigns')) return '/api/data/campaigns';
  
  // Client detail pages use scoped endpoint: /clients/[clientId]
  const clientIdMatch = pathname.match(/^\/clients\/([^/?]+)/);
  if (clientIdMatch) {
    return `/api/data/clients/${clientIdMatch[1]}`;
  }
  
  // Default: fall back to full mega-fetch for pages not yet migrated
  // (projects, automations, templates, timeline, calendar, etc.)
  return '/api/data';
}

// In-memory cache keyed by endpoint
const cache = new Map<string, { data: AppData; fetchedAt: number }>();
const STALE_MS = 10_000; // 10 seconds (reduced from 30s for faster background revalidation)

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentEndpoint = useRef<string>('');

  const load = useCallback((endpoint: string, background = false) => {
    if (!background) setLoading(true);

    fetch(endpoint)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch data: ${res.status}`);
        return res.json();
      })
      .then((json: AppData) => {
        cache.set(endpoint, { data: json, fetchedAt: Date.now() });
        setData(json);
        setLoading(false);
        setError(null);
      })
      .catch(err => {
        console.error('AppDataContext error:', err);
        if (!background) {
          setError(err.message);
          setLoading(false);
        }
      });
  }, []);

  useEffect(() => {
    const endpoint = getEndpointForPath(pathname);
    currentEndpoint.current = endpoint;

    // Check cache
    const cached = cache.get(endpoint);
    const now = Date.now();

    if (cached) {
      // Show cached data immediately
      setData(cached.data);
      setLoading(false);
      setError(null);

      // If cache is stale, revalidate in background
      if (now - cached.fetchedAt > STALE_MS) {
        load(endpoint, true);
      }
    } else {
      // No cache — fetch fresh
      load(endpoint);
    }
  }, [pathname, load]);

  const refresh = useCallback(() => {
    const endpoint = currentEndpoint.current || getEndpointForPath(pathname);
    cache.delete(endpoint); // invalidate cache
    load(endpoint);
  }, [pathname, load]);

  const optimisticUpdate = useCallback((updater: (prev: AppData) => AppData) => {
    setData(prev => {
      if (!prev) return prev;
      const updated = updater(prev);
      // Also update the cache so navigating away and back doesn't flash stale data
      const endpoint = currentEndpoint.current || getEndpointForPath(pathname);
      cache.set(endpoint, { data: updated, fetchedAt: Date.now() });
      return updated;
    });
  }, [pathname]);

  return (
    <AppDataContext.Provider value={{ loading, error, refresh, optimisticUpdate, ...data }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  return useContext(AppDataContext);
}
