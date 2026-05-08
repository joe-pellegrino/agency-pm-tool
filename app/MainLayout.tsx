'use client'

import { useEffect } from 'react'
import { useSidebar } from '@/components/layout/SidebarContext'
import { usePathname } from 'next/navigation'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()
  const pathname = usePathname()
  const isLeadershipOverview = pathname.startsWith('/leadership-overview')

  useEffect(() => {
    if (!isLeadershipOverview) return

    const { body, documentElement } = document
    const previousBodyBackground = body.style.backgroundColor
    const previousHtmlBackground = documentElement.style.backgroundColor

    body.style.backgroundColor = '#08101b'
    documentElement.style.backgroundColor = '#08101b'

    return () => {
      body.style.backgroundColor = previousBodyBackground
      documentElement.style.backgroundColor = previousHtmlBackground
    }
  }, [isLeadershipOverview])

  if (isLeadershipOverview) {
    return (
      <main
        style={{
          minHeight: '100dvh',
          backgroundColor: '#08101b',
          overflow: 'hidden',
        }}
      >
        {children}
      </main>
    )
  }

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
