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
} from 'lucide-react'

const NAV_GROUPS = [
  {
    label: 'PAGES',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/clients', label: 'Clients', icon: Users },
      { href: '/services', label: 'Services', icon: Briefcase },
      { href: '/projects', label: 'Projects', icon: Layers },
      { href: '/kanban', label: 'Kanban Board', icon: Kanban },
      { href: '/timeline', label: 'Timeline', icon: GanttChart },
      { href: '/calendar', label: 'Calendar', icon: Calendar },
      { href: '/documents', label: 'Documents', icon: FileText },
      { href: '/knowledge-base', label: 'Knowledge Base', icon: BookOpen },
      { href: '/assets', label: 'Assets', icon: FolderOpen },
    ],
  },
  {
    label: 'CUSTOMIZE',
    items: [
      { href: '/templates', label: 'Workflow Templates', icon: LayoutTemplate },
      { href: '/automations', label: 'Automations', icon: Zap },
      { href: '/health', label: 'Client Health', icon: Activity },
      { href: '/strategy', label: 'Strategy', icon: Target },
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
function SidebarContent({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const pathname = usePathname()
  const { CLIENTS = [] } = useAppData()
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch logo from Supabase
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const { data, error } = await supabase
          .from('agency_settings')
          .select('value')
          .eq('key', 'logo_url')
          .single()

        if (!error && data?.value) {
          setLogoUrl(data.value)
        }
      } catch (err) {
        console.error('Failed to fetch logo:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchLogo()
  }, [])

  const navItemStyle = (active: boolean) => active
    ? {
        backgroundColor: 'var(--color-sidebar-active-bg)',
        color: 'var(--color-sidebar-text-active)',
        fontWeight: 500,
        borderRadius: '6px',
      }
    : {
        color: 'var(--color-sidebar-text)',
        borderRadius: '6px',
      }

  const iconColor = (active: boolean) => active ? '#FFFFFF' : '#8A94A6'

  return (
    <div className="flex flex-col h-full">
      {/* Logo area - only show when expanded */}
      {!isCollapsed && (
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid var(--color-sidebar-border)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
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
                  color: 'var(--color-white)',
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
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {/* Section label - hidden when collapsed */}
            {!isCollapsed && (
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--color-sidebar-section)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '20px 16px 8px 16px',
                }}
              >
                {group.label}
              </div>
            )}

            {/* Nav items */}
            <div style={{ paddingLeft: isCollapsed ? '0px' : '4px', paddingRight: isCollapsed ? '0px' : '4px' }}>
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
                        marginBottom: '2px',
                        marginLeft: isCollapsed ? '8px' : '0',
                        marginRight: isCollapsed ? '8px' : '0',
                        transition: 'all 0.15s ease',
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                      }}
                      onMouseEnter={e => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-sidebar-hover-bg)'
                          ;(e.currentTarget as HTMLElement).style.color = '#FFFFFF'
                        }
                      }}
                      onMouseLeave={e => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                          ;(e.currentTarget as HTMLElement).style.color = '#8A94A6'
                        }
                      }}
                    >
                      <Icon size={18} color={iconColor(active)} strokeWidth={1.5} style={{ flexShrink: 0 }} />
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

        {/* Clients section */}
        {CLIENTS.length > 0 && (
          <div>
            {!isCollapsed && (
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--color-sidebar-section)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '20px 16px 8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Building2 size={10} color="var(--color-sidebar-section)" />
                CLIENTS
              </div>
            )}
            <div style={{ paddingLeft: isCollapsed ? '0px' : '4px', paddingRight: isCollapsed ? '0px' : '4px' }}>
              {CLIENTS.map((client) => {
                const href = `/clients/${client.id}`
                const active = pathname === href || pathname.startsWith(href + '/')
                return (
                  <div key={client.id} style={{ position: 'relative' }}>
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
                        marginBottom: '2px',
                        marginLeft: isCollapsed ? '8px' : '0',
                        marginRight: isCollapsed ? '8px' : '0',
                        transition: 'all 0.15s ease',
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                      }}
                      onMouseEnter={e => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-sidebar-hover-bg)'
                          ;(e.currentTarget as HTMLElement).style.color = '#FFFFFF'
                        }
                      }}
                      onMouseLeave={e => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                          ;(e.currentTarget as HTMLElement).style.color = '#8A94A6'
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
                          backgroundColor: client.color + '30',
                          color: client.color,
                        }}
                      >
                        {client.logo}
                      </span>
                      {!isCollapsed && (
                        <>
                          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {client.name}
                          </span>
                          <ChevronRight size={12} color="#8A94A6" style={{ flexShrink: 0 }} />
                        </>
                      )}
                    </Link>
                    {isCollapsed && (
                      <Tooltip text={client.name}>
                        <div />
                      </Tooltip>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </nav>

      {/* User footer - only show when expanded */}
      {!isCollapsed && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-sidebar-border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              JP
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Joe Pellegrino
              </div>
              <div style={{ fontSize: '11px', color: '#8A94A6' }}>Owner</div>
            </div>
          </div>
        </div>
      )}
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
  }, [pathname, isMobileOpen, closeMobile])

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── only on lg+ screens ── */}
      <div
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 bg-gray-900 transition-all duration-200 ease-in-out ${
          isCollapsed ? 'w-16' : 'w-60'
        }`}
        style={{
          top: '56px',
          backgroundColor: 'var(--color-bg-sidebar)',
          borderRight: '1px solid var(--color-sidebar-border)',
        }}
      >
        <SidebarContent isCollapsed={isCollapsed} />
      </div>

      {/* ── MOBILE SIDEBAR ── Dialog overlay, only on < lg screens ── */}
      <Dialog
        open={isMobileOpen}
        onClose={closeMobile}
        className="relative z-50 lg:hidden"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-in-out data-closed:opacity-0"
        />
        <div className="fixed inset-0 flex">
          <DialogPanel
            transition
            className="relative flex w-60 flex-col bg-gray-900 transition duration-300 ease-in-out data-closed:-translate-x-full"
            style={{
              top: '56px',
              height: 'calc(100vh - 56px)',
              backgroundColor: 'var(--color-bg-sidebar)',
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
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF' }}>Menu</span>
              <button
                onClick={closeMobile}
                style={{ color: '#8A94A6', padding: '4px', cursor: 'pointer', background: 'none', border: 'none' }}
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            <SidebarContent isCollapsed={false} />
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}
