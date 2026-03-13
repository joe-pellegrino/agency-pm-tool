'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Menu,
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
        backgroundColor: '#E8EDFF',
        color: '#3B5BDB',
        fontWeight: 500,
        borderRadius: '6px',
      }
    : {
        color: '#5A6A7E',
        borderRadius: '6px',
      };

  const iconColor = (active: boolean) => active ? '#3B5BDB' : '#A0AAB8';

  const sidebarContent = (
    <aside
      style={{
        position: 'fixed',
        left: 0,
        top: '56px',
        width: '240px',
        height: 'calc(100vh - 56px)',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #E2E6EE',
        zIndex: 50,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        transform: mobileOpen ? 'translateX(0)' : undefined,
        transition: 'transform 0.3s ease',
      }}
      className={`${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
    >
      {/* Mobile close button — only on mobile */}
      <div
        className="lg:hidden"
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #E2E6EE',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#1E2A3A' }}>Menu</span>
        <button
          onClick={closeMobile}
          style={{ color: '#A0AAB8', padding: '4px', cursor: 'pointer', background: 'none', border: 'none' }}
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
                color: '#8896A6',
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
                        (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F7FA';
                        (e.currentTarget as HTMLElement).style.color = '#1E2A3A';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = '#5A6A7E';
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
                color: '#8896A6',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '20px 16px 8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Building2 size={10} color="#8896A6" />
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
                        (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F7FA';
                        (e.currentTarget as HTMLElement).style.color = '#1E2A3A';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = '#5A6A7E';
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
                    <ChevronRight size={12} color="#A0AAB8" style={{ flexShrink: 0 }} />
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* User footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #E2E6EE', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#3B5BDB',
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
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E2A3A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Joe Pellegrino
            </div>
            <div style={{ fontSize: '11px', color: '#8896A6' }}>Owner</div>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
            backgroundColor: 'rgba(30, 42, 58, 0.45)',
          }}
          className="lg:hidden"
          onClick={closeMobile}
        />
      )}
      {sidebarContent}
    </>
  );
}
