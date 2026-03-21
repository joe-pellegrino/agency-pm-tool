'use client'

import { Bell, Search, Menu, Sun, Moon, Settings, CheckCheck, ExternalLink } from 'lucide-react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useSidebar } from './SidebarContext'
import { useTheme } from '@/components/ThemeProvider'
import { Menu as HeadlessMenu, MenuButton, MenuItems, MenuItem } from '@headlessui/react'
import { supabase } from '@/lib/supabase/client'
import { markAsRead, markAllAsRead } from '@/app/actions/notifications'
import type { NotificationRow } from '@/app/actions/notifications'
import { useRouter } from 'next/navigation'

// ─── Hardcoded current user ID ────────────────────────────────────────────────
// TODO: replace with real session/auth when auth is added
const CURRENT_USER_ID = 'default-user'

interface TopBarProps {
  breadcrumb?: string[]
  actions?: React.ReactNode
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function notifIcon(type: string): string {
  if (type.includes('task_assigned')) return '📋'
  if (type.includes('status_changed')) return '🔄'
  if (type.includes('comment')) return '💬'
  if (type.includes('approval')) return '✅'
  if (type.includes('dependency')) return '🔓'
  if (type.includes('due_soon')) return '⏰'
  if (type.includes('overdue')) return '🚨'
  if (type.includes('milestone')) return '🎯'
  if (type.includes('kpi')) return '📊'
  if (type.includes('document')) return '📄'
  if (type.includes('strategy')) return '🗺️'
  if (type.includes('initiative')) return '🚀'
  if (type.includes('adhoc')) return '⚡'
  if (type.includes('recurring')) return '🔁'
  return '🔔'
}

export default function TopBar({ breadcrumb, actions }: TopBarProps) {
  const [notifOpen, setNotifOpen] = useState(false)
  const { toggleCollapsed, openMobile, closeMobile, isMobileOpen, isCollapsed } = useSidebar()
  const { theme, toggle } = useTheme()
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()

  // ─── Notification state ──────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const realtimeRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', CURRENT_USER_ID)
        .order('created_at', { ascending: false })
        .limit(20)
      const rows = (data ?? []) as NotificationRow[]
      setNotifications(rows)
      setUnreadCount(rows.filter((n) => !n.read).length)
    } catch (err) {
      console.error('fetchNotifications error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Subscribe to Supabase Realtime for live updates
  useEffect(() => {
    fetchNotifications()

    const channel = supabase
      .channel(`notifications:${CURRENT_USER_ID}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${CURRENT_USER_ID}`,
        },
        (payload) => {
          const newNotif = payload.new as NotificationRow
          setNotifications((prev) => [newNotif, ...prev.slice(0, 19)])
          setUnreadCount((prev) => prev + 1)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${CURRENT_USER_ID}`,
        },
        () => {
          // Re-fetch on any update (mark-read etc.)
          fetchNotifications()
        }
      )
      .subscribe()

    realtimeRef.current = channel

    return () => {
      if (realtimeRef.current) {
        supabase.removeChannel(realtimeRef.current)
      }
    }
  }, [fetchNotifications])

  // Mobile check
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const handleNotifClick = async (notif: NotificationRow) => {
    if (!notif.read) {
      await markAsRead(notif.id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
    setNotifOpen(false)
    if (notif.link) router.push(notif.link)
  }

  const handleMarkAllRead = async () => {
    await markAllAsRead(CURRENT_USER_ID)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const logoWidth = isCollapsed ? 60 : 240

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
        gap: '16px',
      }}
    >
      {/* Hamburger */}
      <button
        onClick={() => (isMobile ? (isMobileOpen ? closeMobile() : openMobile()) : toggleCollapsed())}
        className="icon-btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--color-icon-muted)',
        }}
        aria-label="Toggle menu"
        title="Toggle menu"
      >
        <Menu size={20} strokeWidth={1.5} />
      </button>

      {/* Logo area — desktop */}
      <div
        className="hidden lg:flex items-center"
        style={{
          width: `${logoWidth}px`,
          flexShrink: 0,
          gap: '12px',
          paddingLeft: '0',
          transition: 'width 0.2s ease',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          paddingRight: isCollapsed ? '0' : '16px',
        }}
      >
        {!isCollapsed && (
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

      {/* Breadcrumb */}
      <div style={{ flex: 1, minWidth: 0 }}>
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
            e.target.style.borderColor = 'var(--color-border-input-focus)'
            e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)'
          }}
          onBlur={e => {
            e.target.style.borderColor = 'var(--color-border)'
            e.target.style.boxShadow = 'none'
          }}
        />
      </div>

      {/* ─── Notifications Bell ──────────────────────────────────────────── */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="icon-btn"
          style={{ position: 'relative', color: 'var(--color-icon-muted)' }}
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={20} strokeWidth={1.5} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                minWidth: '16px',
                height: '16px',
                backgroundColor: 'var(--color-danger)',
                color: 'var(--color-white)',
                fontSize: '10px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                padding: '0 3px',
                lineHeight: 1,
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
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
                width: '360px',
                backgroundColor: 'var(--color-white)',
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                boxShadow: 'var(--shadow-dropdown)',
                zIndex: 150,
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        background: 'var(--color-primary)',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: '10px',
                        padding: '1px 7px',
                      }}
                    >
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      color: 'var(--color-text-link)',
                      background: 'none',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-hover-bg)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <CheckCheck size={13} />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Body */}
              <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                {loading && notifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                    Loading…
                  </div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔔</div>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
                      You&apos;re all caught up!
                    </p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      style={{
                        padding: '11px 16px',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start',
                        cursor: n.link ? 'pointer' : 'default',
                        backgroundColor: !n.read ? 'var(--color-notif-unread-bg, rgba(79,70,229,0.06))' : 'transparent',
                        borderBottom: '1px solid var(--color-border)',
                        transition: 'background 0.12s ease',
                        position: 'relative',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-hover-bg)'
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = !n.read
                          ? 'var(--color-notif-unread-bg, rgba(79,70,229,0.06))'
                          : 'transparent'
                      }}
                    >
                      {/* Unread dot */}
                      <div
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          marginTop: '7px',
                          flexShrink: 0,
                          backgroundColor: !n.read ? 'var(--color-primary)' : 'transparent',
                          border: !n.read ? 'none' : '1.5px solid var(--color-border)',
                          transition: 'background 0.15s',
                        }}
                      />

                      {/* Icon */}
                      <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '2px' }}>
                        {notifIcon(n.type)}
                      </span>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: '13px',
                            lineHeight: 1.45,
                            color: 'var(--color-text-primary)',
                            margin: 0,
                            fontWeight: !n.read ? 500 : 400,
                          }}
                        >
                          {n.title}
                        </p>
                        <p
                          style={{
                            fontSize: '12px',
                            color: 'var(--color-text-muted)',
                            margin: '2px 0 0 0',
                            lineHeight: 1.4,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {n.message}
                        </p>
                        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '4px 0 0 0', opacity: 0.7 }}>
                          {timeAgo(n.created_at)}
                        </p>
                      </div>

                      {/* External link icon */}
                      {n.link && (
                        <ExternalLink
                          size={12}
                          style={{ color: 'var(--color-text-muted)', flexShrink: 0, marginTop: '6px', opacity: 0.5 }}
                        />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div
                  style={{
                    padding: '10px 16px',
                    borderTop: '1px solid var(--color-border)',
                    textAlign: 'center',
                  }}
                >
                  <a
                    href="/settings?tab=notifications"
                    style={{
                      fontSize: '12px',
                      color: 'var(--color-text-link)',
                      textDecoration: 'none',
                      fontWeight: 500,
                    }}
                    onClick={() => setNotifOpen(false)}
                  >
                    Notification Settings
                  </a>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* User avatar dropdown */}
      <HeadlessMenu as="div" className="relative" style={{ flexShrink: 0 }}>
        <MenuButton
          className="icon-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          title="User menu"
        >
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
        </MenuButton>

        <MenuItems
          className="absolute right-0 mt-2 w-48 origin-top-right rounded-lg shadow-lg ring-1 focus:outline-none z-50"
          style={{
            backgroundColor: 'var(--color-white)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-dropdown)',
            border: '1px solid var(--color-border)',
          }}
        >
          <MenuItem>
            <div
              className="px-4 py-3 border-b"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)', margin: 0 }}>
                Joe Pellegrino
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)', margin: '2px 0 0 0' }}>
                Owner
              </p>
            </div>
          </MenuItem>

          <MenuItem>
            {({ focus }) => (
              <button
                onClick={toggle}
                className="flex w-full items-center gap-3 px-4 py-2 text-sm"
                style={{
                  color: 'var(--color-text-secondary)',
                  backgroundColor: focus ? 'var(--color-hover-bg)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  textAlign: 'left',
                  transition: 'background-color 0.15s ease',
                }}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
            )}
          </MenuItem>

          <MenuItem>
            {({ focus }) => (
              <a
                href="/settings"
                className="flex items-center gap-3 px-4 py-2 text-sm"
                style={{
                  color: 'var(--color-text-secondary)',
                  backgroundColor: focus ? 'var(--color-hover-bg)' : 'transparent',
                  textDecoration: 'none',
                  display: 'flex',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <Settings size={16} />
                Settings
              </a>
            )}
          </MenuItem>
        </MenuItems>
      </HeadlessMenu>
    </header>
  )
}
