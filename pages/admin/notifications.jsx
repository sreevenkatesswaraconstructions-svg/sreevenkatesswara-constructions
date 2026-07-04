import { useState, useEffect } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { Bell, CheckCheck, Trash2 } from 'lucide-react'

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

const getBadgeStyle = (type) => {
  switch (type) {
    case 'success':
      return 'bg-emerald-100 text-emerald-700'
    case 'warning':
      return 'bg-amber-100 text-amber-700'
    case 'error':
      return 'bg-rose-100 text-rose-700'
    default:
      return 'bg-sky-100 text-sky-700'
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/notifications')
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

  const markAllRead = async () => {
    try {
      const unreadIds = notifications.filter((item) => !item.isRead).map((item) => item.id)
      if (unreadIds.length === 0) return

      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: unreadIds, markAsRead: true })
      })
      fetchNotifications()
    } catch (error) {
      console.error('Failed to mark all read:', error)
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

  useEffect(() => {
    fetchNotifications()
  }, [])

  return (
    <AdminLayout>
      <div className="space-y-6 pb-10">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-slate-900">All Notifications</p>
            <p className="mt-1 text-sm text-slate-500">Load, manage, and clear notifications stored in the database.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>
            <button
              onClick={clearReadNotifications}
              className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
            >
              <Trash2 className="h-4 w-4" />
              Clear read notifications
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Unread</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{unreadCount}</p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Total</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{notifications.length}</p>
            </div>
          </div>

          <div className="divide-y divide-slate-200 px-4 py-4">
            {loading ? (
              <div className="py-10 text-center text-sm text-slate-500">Loading notifications…</div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500">No notifications found.</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group flex flex-col gap-3 rounded-[1.5rem] border p-4 transition ${
                    notification.isRead ? 'border-slate-200 bg-white hover:border-slate-300' : 'border-slate-300 bg-slate-50 shadow-sm hover:border-slate-400'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${getBadgeStyle(notification.type)} bg-opacity-25`}>
                        <Bell className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                        <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{notification.type}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{getRelativeTime(notification.createdAt)}</span>
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{notification.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
