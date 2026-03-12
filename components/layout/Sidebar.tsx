'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CLIENTS } from '@/lib/data';
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

  const sidebarContent = (
    <aside
      className={`
        fixed left-0 top-0 h-full w-64 bg-gray-950 text-white flex flex-col z-40
        transform transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:z-30
      `}
    >
      {/* Logo / Header */}
      <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">
            RJ
          </div>
          <div>
            <div className="font-semibold text-sm leading-tight">RJ Media</div>
            <div className="text-xs text-gray-400">Agency Dashboard</div>
          </div>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={closeMobile}
          className="lg:hidden p-1 text-gray-400 hover:text-white transition-colors"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <div className="px-3 mb-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
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
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors min-h-[44px] ${
                      active
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Clients */}
        <div className="mt-1">
          <div className="px-3 mb-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
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
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group min-h-[44px] ${
                    active ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
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
      <div className="px-4 py-4 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
            JP
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">Joe Pellegrino</div>
            <div className="text-xs text-gray-400">Owner</div>
          </div>
          <Link
            href="/settings"
            onClick={closeMobile}
            className="text-gray-500 hover:text-gray-300 transition-colors p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
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
