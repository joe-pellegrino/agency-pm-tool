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
} from 'lucide-react';

const NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/clients', label: 'Clients', icon: Users },
      { href: '/services', label: 'Services', icon: Briefcase },
      { href: '/projects', label: 'Projects', icon: Layers },
      { href: '/kanban', label: 'Kanban Board', icon: Kanban },
      { href: '/timeline', label: 'Timeline', icon: GanttChart },
      { href: '/calendar', label: 'Calendar', icon: Calendar },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/documents', label: 'Documents', icon: FileText },
      { href: '/knowledge-base', label: 'Knowledge Base', icon: BookOpen },
      { href: '/assets', label: 'Assets', icon: FolderOpen },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/templates', label: 'Workflow Templates', icon: LayoutTemplate },
      { href: '/automations', label: 'Automations', icon: Zap },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/health', label: 'Client Health', icon: Activity },
      { href: '/strategy', label: 'Strategy', icon: Target },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { mobileOpen, closeMobile } = useSidebar();
  const { CLIENTS = [] } = useAppData();

  const sidebarContent = (
    <aside
      className={`
        fixed left-0 top-0 h-full w-64 flex flex-col z-40
        transform transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:z-30
      `}
      style={{ backgroundColor: '#1E2A3A', color: '#8B95A5' }}
    >
      {/* Logo / Header */}
      <div
        className="px-6 py-5 flex items-center justify-between"
        style={{ borderBottom: '1px solid #2F3447' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 text-white"
            style={{ backgroundColor: '#4F6AE8' }}
          >
            RJ
          </div>
          <div>
            <div className="font-semibold text-sm leading-tight text-white">RJ Media</div>
            <div className="text-xs" style={{ color: '#8B95A5' }}>Agency Dashboard</div>
          </div>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={closeMobile}
          className="lg:hidden p-1 transition-colors"
          style={{ color: '#8B95A5' }}
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <div
              className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: '#6B7385', letterSpacing: '0.05em', paddingTop: '8px' }}
            >
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeMobile}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all min-h-[40px]"
                    style={
                      active
                        ? { backgroundColor: 'rgba(255,255,255,0.10)', color: '#FFFFFF', borderRadius: '6px' }
                        : { color: '#8B95A5' }
                    }
                    onMouseEnter={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.06)';
                        (e.currentTarget as HTMLElement).style.color = '#FFFFFF';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = '#8B95A5';
                      }
                    }}
                  >
                    <Icon size={18} />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Clients */}
        <div className="mt-1">
          <div
            className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1"
            style={{ color: '#6B7385', letterSpacing: '0.05em' }}
          >
            <Building2 size={10} />
            Clients
          </div>
          <div className="space-y-0.5">
            {CLIENTS.map((client) => {
              const href = `/clients/${client.id}`;
              const active = pathname === `/clients/${client.id}` || pathname.startsWith(`/clients/${client.id}`);
              return (
                <Link
                  key={client.id}
                  href={href}
                  onClick={closeMobile}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all group min-h-[40px]"
                  style={
                    active
                      ? { backgroundColor: 'rgba(255,255,255,0.10)', color: '#FFFFFF', borderRadius: '6px' }
                      : { color: '#8B95A5' }
                  }
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.06)';
                      (e.currentTarget as HTMLElement).style.color = '#FFFFFF';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                      (e.currentTarget as HTMLElement).style.color = '#8B95A5';
                    }
                  }}
                >
                  <span
                    className="w-5 h-5 rounded text-xs font-bold flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: client.color + '30', color: client.color }}
                  >
                    {client.logo}
                  </span>
                  <span className="truncate flex-1">{client.name}</span>
                  <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* User */}
      <div className="px-4 py-4" style={{ borderTop: '1px solid #2F3447' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
            style={{ backgroundColor: '#4F6AE8' }}
          >
            JP
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate text-white">Joe Pellegrino</div>
            <div className="text-xs" style={{ color: '#8B95A5' }}>Owner</div>
          </div>
          <Link
            href="/settings"
            onClick={closeMobile}
            className="transition-colors p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            style={{ color: '#8B95A5' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#FFFFFF'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#8B95A5'; }}
          >
            <Settings size={14} />
          </Link>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={closeMobile}
        />
      )}
      {sidebarContent}
    </>
  );
}
