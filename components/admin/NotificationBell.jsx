import { useState, useEffect } from 'react'
import { Bell, CheckCircle2, Info, AlertTriangle, XCircle, Check, CheckCheck, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=10')
      const data = await res.json()
      if (data.success) {
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id], markAsRead: true })
      })
      fetchNotifications()
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id)
      if (unreadIds.length > 0) {
        await fetch('/api/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: unreadIds, markAsRead: true })
        })
        fetchNotifications()
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const clearReadNotifications = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearRead: true })
      })
      fetchNotifications()
    } catch (error) {
      console.error('Failed to clear read notifications:', error)
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-rose-500" />
      default:
        return <Info className="w-5 h-5 text-sky-500" />
    }
  }

  const getRelativeTime = (date) => {
    const now = new Date()
    const diff = now - new Date(date)
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes === 1) return '1 min ago'
    if (minutes < 60) return `${minutes} min ago`
    if (hours === 1) return '1 hour ago'
    if (hours < 24) return `${hours} hours ago`
    if (days === 1) return 'Yesterday'
    return `${days} days ago`
  }

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id)
    if (notification.link) {
      window.location.href = notification.link
    }
    setIsOpen(false)
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 20000) // Refresh every 20 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-semibold text-white shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, translateY: -12 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 z-50 mt-3 w-[min(26rem,calc(100vw-1.5rem))] rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-200 dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Latest activity from the admin system</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark all read
                </button>
                <button
                  type="button"
                  onClick={clearReadNotifications}
                  className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear read
                </button>
              </div>
            </div>

            <div className="max-h-[28rem] overflow-y-auto px-1 pb-2">
              {loading ? (
                <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">Loading notifications…</div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">No notifications yet.</div>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={`group mb-2 w-full rounded-[1.5rem] border p-4 text-left transition duration-200 ${
                      notification.isRead
                        ? 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600 dark:hover:bg-slate-900'
                        : 'border-slate-300 bg-slate-50 shadow-sm hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900/80 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {getIcon(notification.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className={`text-sm font-semibold ${notification.isRead ? 'text-slate-900 dark:text-slate-100' : 'text-slate-950 dark:text-white'}`}>
                            {notification.title}
                          </p>
                          <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            {notification.type}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-600 dark:text-slate-300">
                          {notification.message}
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span>{getRelativeTime(notification.createdAt)}</span>
                          {!notification.isRead && (
                            <span className="rounded-full bg-sky-100 px-2 py-1 text-sky-700 dark:bg-sky-900/80 dark:text-sky-300">Unread</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="grid gap-3 border-t border-slate-200 p-4 dark:border-slate-700 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/admin/notifications'
                  setIsOpen(false)
                }}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-900"
              >
                View All
              </button>
              <button
                type="button"
                onClick={markAllAsRead}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Mark All Read
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
