'use client';

import { useSidebar } from '@/components/layout/SidebarContext';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  const marginLeft = collapsed ? 60 : 240;

  return (
    <main
      className="hidden lg:block"
      style={{
        marginLeft: `${marginLeft}px`,
        marginTop: '56px',
        minHeight: 'calc(100vh - 56px)',
        backgroundColor: 'var(--color-bg-page)',
        transition: 'margin-left 0.2s ease',
      }}
    >
      {children}
    </main>
  );
}
