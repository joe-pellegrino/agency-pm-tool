'use client';

import { Bell, Search, Menu } from 'lucide-react';
import { useState } from 'react';
import { useSidebar } from './SidebarContext';

interface TopBarProps {
  title: string;
  subtitle?: string;
}

const NOTIFICATIONS = [
  { id: 1, text: 'Marcus completed Facebook Ad Campaign review', time: '5m ago', unread: true },
  { id: 2, text: 'Sarah uploaded new content calendar', time: '1h ago', unread: true },
  { id: 3, text: 'The Refuge Grand Opening campaign is live', time: '3h ago', unread: false },
  { id: 4, text: 'Monthly analytics report ready for review', time: '1d ago', unread: false },
];

export default function TopBar({ title, subtitle }: TopBarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const { toggleMobile } = useSidebar();
  const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <header
      className="fixed top-0 left-0 right-0 lg:left-64 h-16 flex items-center px-4 gap-3 z-20"
      style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E8ECF1' }}
    >
      {/* Hamburger — mobile only */}
      <button
        onClick={toggleMobile}
        className="lg:hidden p-2 rounded-lg transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
        style={{ color: '#4A5568' }}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold truncate" style={{ color: '#1E2A3A' }}>{title}</h1>
        {subtitle && <p className="text-xs hidden sm:block" style={{ color: '#8B95A5' }}>{subtitle}</p>}
      </div>

      {/* Search */}
      <div className="relative hidden md:block">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#B0B8C9' }} />
        <input
          type="text"
          placeholder="Search tasks, docs, clients..."
          className="ds-input pl-8 pr-4 py-2 w-64"
          style={{ height: '36px' }}
        />
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          style={{ color: '#8B95A5' }}
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
            <div
              className="absolute right-0 top-10 w-72 sm:w-80 rounded-xl shadow-xl z-20 overflow-hidden"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8ECF1' }}
            >
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ borderBottom: '1px solid #E8ECF1' }}
              >
                <span className="font-semibold text-sm" style={{ color: '#1E2A3A' }}>Notifications</span>
                <span className="text-xs font-medium cursor-pointer hover:underline" style={{ color: '#4F6AE8' }}>
                  Mark all read
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {NOTIFICATIONS.map((n) => (
                  <div
                    key={n.id}
                    className="px-4 py-3 flex gap-3 items-start cursor-pointer transition-colors hover:bg-gray-50"
                    style={n.unread ? { backgroundColor: 'rgba(79,106,232,0.04)' } : {}}
                  >
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: n.unread ? '#4F6AE8' : '#D0D5DD' }}
                    />
                    <div className="flex-1">
                      <p className="text-sm leading-snug" style={{ color: '#1E2A3A' }}>{n.text}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#8B95A5' }}>{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* User avatar */}
      <div className="flex items-center gap-2 cursor-pointer flex-shrink-0">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: '#4F6AE8' }}
        >
          JP
        </div>
      </div>
    </header>
  );
}
