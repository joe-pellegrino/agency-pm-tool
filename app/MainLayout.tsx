'use client'

import { useSidebar } from '@/components/layout/SidebarContext'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()

  return (
    <main
      style={{
        marginTop: '56px',
        minHeight: 'calc(100vh - 56px)',
        backgroundColor: 'var(--color-bg-page)',
      }}
    >
      {/* Mobile: no padding, no sidebar space */}
      <div className="lg:hidden">{children}</div>

      {/* Desktop: add padding for sidebar, adjust for collapsed state */}
      <div
        className={`hidden lg:block transition-all duration-200 ${
          isCollapsed ? 'pl-16' : 'pl-60'
        }`}
      >
        {children}
      </div>
    </main>
  )
}
