'use client';

import { AppDataProvider } from '@/lib/contexts/AppDataContext';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <AppDataProvider>{children}</AppDataProvider>;
}
