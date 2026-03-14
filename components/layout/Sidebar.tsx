'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dialog, DialogPanel, DialogBackdrop } from '@headlessui/react';
import { useAppData } from '@/lib/contexts/AppDataContext';
import { useSidebar } from './SidebarContext';
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
} from 'lucide-react';

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
];

export default function Sidebar() {
  const pathname = usePathname();
  const { mobileOpen, closeMobile } = useSidebar();
  const { CLIENTS = [] } = useAppData();

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
      };

  const iconColor = (active: boolean) => active ? '#FFFFFF' : '#8A94A6';

  const sidebarContent = (
    <aside
      style={{
        position: 'fixed',
        left: 0,
        top: '56px',
        width: '240px',
        height: 'calc(100vh - 56px)',
        backgroundColor: 'var(--color-bg-sidebar)',
        borderRight: '1px solid var(--color-sidebar-border)',
        zIndex: 50,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
      className="hidden lg:flex"
    >
      {/* Mobile close button — only on mobile */}
      <div
        className="lg:hidden"
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

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {/* Section label */}
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

            {/* Nav items */}
            <div style={{ paddingLeft: '4px', paddingRight: '4px' }}>
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeMobile}
                    className="flex items-center gap-3"
                    style={{
                      ...navItemStyle(active),
                      height: '40px',
                      padding: '0 12px',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      textDecoration: 'none',
                      marginBottom: '2px',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-sidebar-hover-bg)';
                        (e.currentTarget as HTMLElement).style.color = '#FFFFFF';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = '#8A94A6';
                      }
                    }}
                  >
                    <Icon size={18} color={iconColor(active)} strokeWidth={1.5} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Clients section */}
        {CLIENTS.length > 0 && (
          <div>
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
            <div style={{ paddingLeft: '4px', paddingRight: '4px' }}>
              {CLIENTS.map((client) => {
                const href = `/clients/${client.id}`;
                const active = pathname === href || pathname.startsWith(href + '/');
                return (
                  <Link
                    key={client.id}
                    href={href}
                    onClick={closeMobile}
                    style={{
                      ...navItemStyle(active),
                      height: '40px',
                      padding: '0 12px',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      textDecoration: 'none',
                      marginBottom: '2px',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-sidebar-hover-bg)';
                        (e.currentTarget as HTMLElement).style.color = '#FFFFFF';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = '#8A94A6';
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
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {client.name}
                    </span>
                    <ChevronRight size={12} color="#8A94A6" style={{ flexShrink: 0 }} />
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* User footer */}
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
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar - always visible */}
      {sidebarContent}

      {/* Mobile sidebar - Dialog with slide-in animation */}
      <Dialog open={mobileOpen} onClose={closeMobile} className="relative z-50 lg:hidden">
        {/* Backdrop with fade transition */}
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/20 transition duration-300 ease-in-out data-closed:opacity-0"
        />

        {/* Sidebar positioning container */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 left-0 flex pr-10">
              {/* Panel with slide-in from left animation */}
              <DialogPanel
                transition
                className="pointer-events-auto relative flex flex-col transform transition duration-300 ease-in-out data-closed:-translate-x-full bg-gray-900"
                style={{
                  backgroundColor: 'var(--color-bg-sidebar)',
                  width: '240px',
                  top: '56px',
                  height: 'calc(100vh - 56px)',
                }}
              >
                {/* Mobile close button — only on mobile */}
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

                {/* Nav */}
                <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
                  {NAV_GROUPS.map((group) => (
                    <div key={group.label}>
                      {/* Section label */}
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

                      {/* Nav items */}
                      <div style={{ paddingLeft: '4px', paddingRight: '4px' }}>
                        {group.items.map(({ href, label, icon: Icon }) => {
                          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
                          return (
                            <Link
                              key={href}
                              href={href}
                              onClick={closeMobile}
                              className="flex items-center gap-3"
                              style={{
                                ...navItemStyle(active),
                                height: '40px',
                                padding: '0 12px',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                textDecoration: 'none',
                                marginBottom: '2px',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={e => {
                                if (!active) {
                                  (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-sidebar-hover-bg)';
                                  (e.currentTarget as HTMLElement).style.color = '#FFFFFF';
                                }
                              }}
                              onMouseLeave={e => {
                                if (!active) {
                                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                                  (e.currentTarget as HTMLElement).style.color = '#8A94A6';
                                }
                              }}
                            >
                              <Icon size={18} color={iconColor(active)} strokeWidth={1.5} style={{ flexShrink: 0 }} />
                              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {label}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Clients section */}
                  {CLIENTS.length > 0 && (
                    <div>
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
                      <div style={{ paddingLeft: '4px', paddingRight: '4px' }}>
                        {CLIENTS.map((client) => {
                          const href = `/clients/${client.id}`;
                          const active = pathname === href || pathname.startsWith(href + '/');
                          return (
                            <Link
                              key={client.id}
                              href={href}
                              onClick={closeMobile}
                              style={{
                                ...navItemStyle(active),
                                height: '40px',
                                padding: '0 12px',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                textDecoration: 'none',
                                marginBottom: '2px',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={e => {
                                if (!active) {
                                  (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-sidebar-hover-bg)';
                                  (e.currentTarget as HTMLElement).style.color = '#FFFFFF';
                                }
                              }}
                              onMouseLeave={e => {
                                if (!active) {
                                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                                  (e.currentTarget as HTMLElement).style.color = '#8A94A6';
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
                              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {client.name}
                              </span>
                              <ChevronRight size={12} color="#8A94A6" style={{ flexShrink: 0 }} />
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </nav>

                {/* User footer */}
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
              </DialogPanel>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}
