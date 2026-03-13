'use client';

import { Bell, Search, Menu } from 'lucide-react';
import { useState } from 'react';
import { useSidebar } from './SidebarContext';

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
  const { toggleMobile } = useSidebar();
  const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '56px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E6EE',
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
        className="lg:hidden"
        style={{
          padding: '8px',
          color: '#5A6A7E',
          cursor: 'pointer',
          background: 'none',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          minWidth: '36px',
          minHeight: '36px',
        }}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Logo area — desktop (matches sidebar brand, visible in top bar on left) */}
      <div className="hidden lg:flex items-center" style={{ width: '240px', flexShrink: 0, gap: '8px', paddingLeft: '0' }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            backgroundColor: '#3B5BDB',
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
        <span style={{ fontSize: '18px', fontWeight: 700, color: '#1E2A3A' }}>RJ Media</span>
      </div>

      {/* Breadcrumb / Title */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1E2A3A', margin: 0, lineHeight: 1.3 }}>
            {title}
          </h1>
          {breadcrumb && breadcrumb.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#8896A6' }}>
              {breadcrumb.map((crumb, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ color: '#A0AAB8', fontSize: '12px' }}>&gt;</span>
                  <span style={{ color: i === breadcrumb.length - 1 ? '#1E2A3A' : '#8896A6' }}>{crumb}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        {subtitle && (
          <p style={{ fontSize: '12px', color: '#8896A6', margin: 0, lineHeight: 1.4 }}>{subtitle}</p>
        )}
      </div>

      {/* Actions slot */}
      {actions && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>{actions}</div>}

      {/* Search */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }} className="hidden md:flex">
        <Search size={16} style={{ position: 'absolute', left: '10px', color: '#A0AAB8', pointerEvents: 'none' }} />
        <input
          type="text"
          placeholder="Search..."
          style={{
            height: '36px',
            paddingLeft: '34px',
            paddingRight: '12px',
            border: '1px solid #E2E6EE',
            borderRadius: '4px',
            background: '#FFFFFF',
            fontSize: '14px',
            color: '#1E2A3A',
            outline: 'none',
            width: '200px',
            fontFamily: 'inherit',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          }}
          onFocus={e => {
            e.target.style.borderColor = '#3B5BDB';
            e.target.style.boxShadow = '0 0 0 3px rgba(59, 91, 219, 0.12)';
          }}
          onBlur={e => {
            e.target.style.borderColor = '#E2E6EE';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Notifications */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          style={{
            position: 'relative',
            padding: '8px',
            color: '#A0AAB8',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '36px',
            minHeight: '36px',
          }}
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
                color: '#FFFFFF',
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
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E6EE',
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
                  borderBottom: '1px solid #E2E6EE',
                }}
              >
                <span style={{ fontWeight: 600, fontSize: '14px', color: '#1E2A3A' }}>Notifications</span>
                <span style={{ fontSize: '12px', fontWeight: 500, cursor: 'pointer', color: '#3B5BDB' }}>
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
                      backgroundColor: n.unread ? 'rgba(59, 91, 219, 0.04)' : 'transparent',
                      borderBottom: '1px solid #E2E6EE',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F7FA'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = n.unread ? 'rgba(59, 91, 219, 0.04)' : 'transparent'; }}
                  >
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        marginTop: '6px',
                        flexShrink: 0,
                        backgroundColor: n.unread ? '#3B5BDB' : '#D0D6E0',
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '13px', lineHeight: 1.4, color: '#1E2A3A', margin: 0 }}>{n.text}</p>
                      <p style={{ fontSize: '12px', marginTop: '2px', color: '#8896A6', margin: '2px 0 0 0' }}>{n.time}</p>
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
            backgroundColor: '#3B5BDB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
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
