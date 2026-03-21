'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dialog, DialogPanel, DialogBackdrop } from '@headlessui/react'
import { useAppData } from '@/lib/contexts/AppDataContext'
import { useSidebar } from './SidebarContext'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Kanban,
  GanttChart,
  FileText,
  Settings,
  ChevronRight,
  ChevronDown,
  Building2,
  Calendar,
  FolderOpen,
  LayoutTemplate,
  Zap,
  Activity,
  X,
  Layers,
  Target,
  Briefcase,
  Users,
  BookOpen,
  TrendingUp,
} from 'lucide-react'

const NAV_GROUPS = [
  {
    label: 'TOOLS',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/initiatives', label: 'Initiatives', icon: Layers },
      { href: '/kanban', label: 'Kanban Board', icon: Kanban },
      { href: '/timeline', label: 'Timeline', icon: GanttChart },
      { href: '/calendar', label: 'Calendar', icon: Calendar },
      { href: '/knowledge-base', label: 'Knowledge Base', icon: BookOpen },
      { href: '/health', label: 'Client Health', icon: Activity },
    ],
  },
  {
    label: 'CUSTOMIZE',
    items: [
      { href: '/templates', label: 'Workflow Templates', icon: LayoutTemplate },
      { href: '/automations', label: 'Automations', icon: Zap },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

// Tooltip component for collapsed state
function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {children && (
        <>
          {children}
          {show && (
            <div
              style={{
                position: 'absolute',
                left: '100%',
                top: '50%',
                transform: 'translateY(-50%)',
                marginLeft: '8px',
                backgroundColor: '#1F2937',
                color: '#FFFFFF',
                padding: '6px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                zIndex: 1000,
                pointerEvents: 'none',
              }}
            >
              {text}
            </div>
          )}
        </>
      )}
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{ position: 'absolute', inset: 0 }}
      />
    </div>
  )
}

// Extract nav content into a shared component
function SidebarContent({ isCollapsed = false, showLogo = true }: { isCollapsed?: boolean; showLogo?: boolean }) {
  const pathname = usePathname()
  const { CLIENTS = [] } = useAppData()
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null)

  // Auto-expand the active client based on pathname
  useEffect(() => {
    const match = pathname.match(/^\/clients\/([^\/]+)/)
    if (match) setExpandedClientId(match[1])
  }, [pathname])

  // Define sub-nav items for each client
  const clientSubNav = (clientId: string) => [
    { label: 'Overview', href: `/clients/${clientId}`, icon: Briefcase },
    { label: 'Strategy', href: `/strategy?clientId=${clientId}`, icon: TrendingUp },
    { label: 'Pillars', href: `/clients/${clientId}/pillars`, icon: Target },
    { label: 'Initiatives', href: `/clients/${clientId}?tab=projects`, icon: Layers },
    { label: 'Kanban', href: `/kanban?clientId=${clientId}`, icon: Kanban },
    { label: 'Documents', href: `/clients/${clientId}?tab=documents`, icon: FileText },
    { label: 'Assets', href: `/clients/${clientId}?tab=assets`, icon: FolderOpen },
    { label: 'Health', href: `/health?clientId=${clientId}`, icon: Activity },
  ]

  // Fetch logos from Supabase
  // The sidebar is always dark-themed (#111827), so always use the dark logo
  useEffect(() => {
    const fetchLogos = async () => {
      try {
        const { data, error } = await supabase
          .from('agency_settings')
          .select('key, value')
          .eq('key', 'logo_dark_url')

        if (!error && data && data.length > 0) {
          const darkLogo = data[0].value
          if (darkLogo) {
            setLogoUrl(darkLogo)
          }
        }
      } catch (err) {
        console.error('Failed to fetch logos:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchLogos()
  }, [])

  const navItemStyle = (active: boolean) => active
    ? {
        backgroundColor: 'rgba(255,255,255,0.1)',
        color: '#FFFFFF',
        fontWeight: 500,
        borderRadius: '6px',
      }
    : {
        color: '#9CA3AF',
        borderRadius: '6px',
      }

  const getIconColor = (active: boolean) => {
    if (active) {
      return '#FFFFFF'
    }
    return 'var(--color-text-muted)'
  }

  const getHoverTextColor = () => '#FFFFFF'

  return (
    <div className="flex flex-col h-full" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Logo area - only show on mobile */}
      {!isCollapsed && showLogo && (
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--color-sidebar-border)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Agency Logo"
              style={{
                height: '32px',
                maxWidth: '100%',
                objectFit: 'contain',
              }}
            />
          ) : (
            <>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  backgroundColor: 'var(--color-primary)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                ▲
              </div>
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>RJ Media</span>
            </>
          )}
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Clients section - FIRST */}
        {CLIENTS.length > 0 && (
          <div>
            {!isCollapsed && (
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#6B7280',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '16px 24px 8px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Building2 size={10} color="#6B7280" />
                CLIENTS
              </div>
            )}
            <div style={{ paddingLeft: isCollapsed ? '8px' : '12px', paddingRight: isCollapsed ? '8px' : '12px' }}>
              {CLIENTS.map((client) => {
                const href = `/clients/${client.id}`
                const active = pathname === href || pathname.startsWith(href + '/')
                const isExpanded = expandedClientId === client.id
                const subItems = clientSubNav(client.id)

                return (
                  <div key={client.id}>
                    {/* Client row with expand toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                      <Link
                        href={href}
                        style={{
                          ...navItemStyle(active),
                          height: '40px',
                          padding: isCollapsed ? '0 8px' : '0 12px',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: isCollapsed ? '0' : '12px',
                          textDecoration: 'none',
                          marginBottom: '4px',
                          transition: 'all 0.15s ease',
                          justifyContent: isCollapsed ? 'center' : 'flex-start',
                          flex: 1,
                        }}
                        onMouseEnter={e => {
                          if (!active) {
                            (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.07)'
                            ;(e.currentTarget as HTMLElement).style.color = getHoverTextColor()
                          }
                        }}
                        onMouseLeave={e => {
                          if (!active) {
                            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                            ;(e.currentTarget as HTMLElement).style.color = '#9CA3AF'
                          }
                        }}
                      >
                        <span
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            backgroundColor: '#000000',
                            color: '#FFFFFF',
                          }}
                        >
                          {client.logo}
                        </span>
                        {!isCollapsed && (
                          <>
                            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {client.name}
                            </span>
                          </>
                        )}
                      </Link>
                      {!isCollapsed && (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            setExpandedClientId(isExpanded ? null : client.id)
                          }}
                          style={{
                            padding: '4px',
                            color: '#9CA3AF',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            marginRight: '4px',
                          }}
                        >
                          <ChevronDown
                            size={12}
                            style={{
                              transform: isExpanded ? 'rotate(180deg)' : 'none',
                              transition: 'transform 0.2s',
                            }}
                          />
                        </button>
                      )}
                    </div>

                    {/* Sub-nav items */}
                    {isExpanded && !isCollapsed && (
                      <div style={{ paddingLeft: '16px', marginBottom: '4px' }}>
                        {subItems.map((item) => {
                          const subActive = pathname === item.href || (pathname + (typeof window !== 'undefined' ? window.location.search : '')) === item.href
                          const SubIcon = item.icon
                          return (
                            <Link
                              key={item.label}
                              href={item.href}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                textDecoration: 'none',
                                fontSize: '12px',
                                color: subActive ? '#FFFFFF' : '#9CA3AF',
                                backgroundColor: subActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                                marginBottom: '2px',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                if (!subActive) {
                                  (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.07)'
                                  ;(e.currentTarget as HTMLElement).style.color = '#E5E7EB'
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!subActive) {
                                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                                  ;(e.currentTarget as HTMLElement).style.color = '#9CA3AF'
                                }
                              }}
                            >
                              <SubIcon size={12} />
                              {item.label}
                            </Link>
                          )
                        })}
                      </div>
                    )}

                    {isCollapsed && (
                      <Tooltip text={client.name}>
                        <div />
                      </Tooltip>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Visual separator between CLIENTS and TOOLS */}
            <div style={{ margin: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }} />
          </div>
        )}

        {/* TOOLS section */}
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {/* Section label - hidden when collapsed */}
            {!isCollapsed && (
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#6B7280',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '16px 24px 8px 24px',
                }}
              >
                {group.label}
              </div>
            )}

            {/* Nav items */}
            <div style={{ paddingLeft: isCollapsed ? '8px' : '12px', paddingRight: isCollapsed ? '8px' : '12px' }}>
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                return (
                  <div key={href} style={{ position: 'relative' }}>
                    <Link
                      href={href}
                      className="flex items-center"
                      style={{
                        ...navItemStyle(active),
                        height: '40px',
                        padding: isCollapsed ? '0 8px' : '0 12px',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: isCollapsed ? '0' : '12px',
                        textDecoration: 'none',
                        marginBottom: '4px',
                        transition: 'all 0.15s ease',
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                      }}
                      onMouseEnter={e => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.07)'
                          ;(e.currentTarget as HTMLElement).style.color = getHoverTextColor()
                        }
                      }}
                      onMouseLeave={e => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                          ;(e.currentTarget as HTMLElement).style.color = '#9CA3AF'
                        }
                      }}
                    >
                      <Icon size={18} color={getIconColor(active)} strokeWidth={1.5} style={{ flexShrink: 0 }} />
                      {!isCollapsed && (
                        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {label}
                        </span>
                      )}
                    </Link>
                    {isCollapsed && (
                      <Tooltip text={label}>
                        <div />
                      </Tooltip>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

    </div>
  )
}

export default function Sidebar() {
  const { isCollapsed, isMobileOpen, closeMobile } = useSidebar()
  const pathname = usePathname()

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (isMobileOpen) {
      closeMobile()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── only on lg+ screens ── */}
      <div
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 transition-all duration-200 ease-in-out ${
          isCollapsed ? 'w-16' : 'w-60'
        }`}
        style={{
          top: '56px',
          backgroundColor: '#111827',
          borderRight: '1px solid var(--color-sidebar-border)',
        }}
      >
        <SidebarContent isCollapsed={isCollapsed} showLogo={true} />
      </div>

      {/* ── MOBILE SIDEBAR ── Dialog overlay, only on < lg screens ── */}
      <Dialog
        open={isMobileOpen}
        onClose={closeMobile}
        className="relative z-50 lg:hidden"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 transition-opacity duration-300 ease-in-out data-closed:opacity-0"
          style={{
            backgroundColor: 'var(--color-overlay)',
          }}
        />
        <div className="fixed inset-0 flex">
          <DialogPanel
            transition
            className="relative flex w-60 flex-col transition duration-300 ease-in-out data-closed:-translate-x-full"
            style={{
              top: '56px',
              height: 'calc(100vh - 56px)',
              backgroundColor: '#111827',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Mobile close button */}
            <div
              style={{
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--color-sidebar-border)',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Menu</span>
              <button
                onClick={closeMobile}
                style={{ color: 'var(--color-text-muted)', padding: '4px', cursor: 'pointer', background: 'none', border: 'none' }}
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              <SidebarContent isCollapsed={false} />
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}
