'use client';

import { useSidebar } from '@/components/layout/SidebarContext';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  const desktopMargin = collapsed ? 60 : 240;

  return (
    <main
      style={{
        marginTop: '56px',
        minHeight: 'calc(100vh - 56px)',
        backgroundColor: 'var(--color-bg-page)',
      }}
    >
      {/* Mobile: no margin, no sidebar space */}
      <div className="lg:hidden" style={{ marginTop: 0 }}>
        {children}
      </div>

      {/* Desktop: add margin for sidebar, adjust for collapsed state */}
      <div
        className="hidden lg:block"
        style={{
          marginLeft: `${desktopMargin}px`,
          transition: 'margin-left 0.2s ease',
        }}
      >
        {children}
      </div>
    </main>
  );
}
