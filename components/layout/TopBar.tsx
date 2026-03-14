'use client';

import { Bell, Search, Menu, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { useSidebar } from './SidebarContext';
import { useTheme } from '@/components/ThemeProvider';
import { useEffect } from 'react';

interface TopBarProps {
  title: string;
  subtitle?: string;
  breadcrumb?: string[];
  actions?: React.ReactNode;
}

const NOTIFICATIONS = [
  { id: 1, text: 'Marcus completed Facebook Ad Campaign review', time: '5m ago', unread: true },
  { id: 2, text: 'Sarah uploaded new content calendar', time: '1h ago', unread: true },
  { id: 3, text: 'The Refuge Grand Opening campaign is live', time: '3h ago', unread: false },
  { id: 4, text: 'Monthly analytics report ready for review', time: '1d ago', unread: false },
];

export default function TopBar({ title, subtitle, breadcrumb, actions }: TopBarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const { toggleMobile, toggleCollapsed, collapsed } = useSidebar();
  const { theme, toggle } = useTheme();
  const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length;
  const logoWidth = collapsed ? 60 : 240;

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '56px',
        backgroundColor: 'var(--color-white)',
        borderBottom: '1px solid var(--color-border)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: '12px',
      }}
    >
      {/* Hamburger — mobile only */}
      <button
        onClick={toggleMobile}
        className="lg:hidden icon-btn"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Hamburger — desktop (for collapse toggle) */}
      <button
        onClick={toggleCollapsed}
        className="hidden lg:flex icon-btn"
        aria-label="Toggle sidebar"
        title="Toggle sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Logo area — desktop */}
      <div className="hidden lg:flex items-center" style={{ width: `${logoWidth}px`, flexShrink: 0, gap: '8px', paddingLeft: '0', transition: 'width 0.2s ease', justifyContent: collapsed ? 'center' : 'flex-start', paddingRight: collapsed ? '0' : '16px' }}>
        {!collapsed && (
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
            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>RJ Media</span>
          </>
        )}
      </div>

      {/* Breadcrumb / Title */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.3 }}>
            {title}
          </h1>
          {breadcrumb && breadcrumb.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              {breadcrumb.map((crumb, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ color: 'var(--color-icon-muted)', fontSize: '12px' }}>&gt;</span>
                  <span style={{ color: i === breadcrumb.length - 1 ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>{crumb}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        {subtitle && (
          <p className="hidden md:block" style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.4 }}>{subtitle}</p>
        )}
      </div>

      {/* Actions slot */}
      {actions && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>{actions}</div>}

      {/* Search */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }} className="hidden md:flex">
        <Search size={16} style={{ position: 'absolute', left: '10px', color: 'var(--color-icon-muted)', pointerEvents: 'none' }} />
        <input
          type="text"
          placeholder="Search..."
          style={{
            height: '36px',
            paddingLeft: '34px',
            paddingRight: '12px',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            background: 'var(--color-input-bg)',
            fontSize: '14px',
            color: 'var(--color-text-primary)',
            outline: 'none',
            width: '200px',
            fontFamily: 'inherit',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          }}
          onFocus={e => {
            e.target.style.borderColor = 'var(--color-border-input-focus)';
            e.target.style.boxShadow = '0 0 0 3px rgba(59, 91, 219, 0.12)';
          }}
          onBlur={e => {
            e.target.style.borderColor = 'var(--color-border)';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggle}
        className="icon-btn"
        aria-label="Toggle theme"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Notifications */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="icon-btn"
          style={{ position: 'relative' }}
        >
          <Bell size={20} strokeWidth={1.5} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '16px',
                height: '16px',
                backgroundColor: '#E03131',
                color: 'var(--color-white)',
                fontSize: '10px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setNotifOpen(false)} />
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '44px',
                width: '320px',
                backgroundColor: 'var(--color-white)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-dropdown)',
                zIndex: 150,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>Notifications</span>
                <span style={{ fontSize: '12px', fontWeight: 500, cursor: 'pointer', color: 'var(--color-text-link)' }}>
                  Mark all read
                </span>
              </div>
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {NOTIFICATIONS.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '12px 16px',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                      cursor: 'pointer',
                      backgroundColor: n.unread ? 'var(--color-notif-unread-bg)' : 'transparent',
                      borderBottom: '1px solid var(--color-border)',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-hover-bg)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = n.unread ? 'var(--color-notif-unread-bg)' : 'transparent'; }}
                  >
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        marginTop: '6px',
                        flexShrink: 0,
                        backgroundColor: n.unread ? 'var(--color-primary)' : 'var(--color-border)',
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '13px', lineHeight: 1.4, color: 'var(--color-text-primary)', margin: 0 }}>{n.text}</p>
                      <p style={{ fontSize: '12px', marginTop: '2px', color: 'var(--color-text-muted)', margin: '2px 0 0 0' }}>{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* User avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0 }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-white)',
            fontSize: '12px',
            fontWeight: 700,
          }}
        >
          JP
        </div>
      </div>
    </header>
  );
}
