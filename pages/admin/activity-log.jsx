import { useMemo } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '../../components/admin/AdminLayout'
import { Download, Search, Filter, Calendar, X } from 'lucide-react'
import { prisma } from '../../lib/prisma'

const moduleOptions = [
  { value: 'all', label: 'All Modules' },
  { value: 'Authentication', label: 'Authentication' },
  { value: 'Blog', label: 'Blog' },
  { value: 'Service', label: 'Service' },
  { value: 'Upload', label: 'Upload' },
  { value: 'Settings', label: 'Settings' },
]

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const createCsvContent = (logs) => {
  const headers = ['Time', 'Admin Name', 'Action', 'Module', 'IP Address', 'Browser']
  const rows = logs.map((log) => [
    formatDate(log.createdAt),
    log.adminName,
    log.action,
    log.module,
    log.ipAddress,
    log.browser,
  ])

  const escapeValue = (value) => {
    if (value == null) {
      return ''
    }
    const escaped = String(value).replace(/"/g, '""')
    return `"${escaped}"`
  }

  return [headers, ...rows].map((row) => row.map(escapeValue).join(',')).join('\n')
}

export default function ActivityLogPage({ logs, search, moduleFilter, startDate, endDate }) {
  const router = useRouter()
  const hasLogs = logs && logs.length > 0

  const summaryText = useMemo(() => {
    if (!hasLogs) return 'No records found.'
    return `Showing ${logs.length} ${logs.length === 1 ? 'record' : 'records'}`
  }, [hasLogs, logs])

  const exportCsv = () => {
    const csv = createCsvContent(logs)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', 'admin-activity-log.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const clearFilters = () => {
    router.push('/admin/activity-log')
  }

  return (
    <AdminLayout>
      <div className="space-y-6 pb-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Activity Log</h1>
            <p className="mt-2 text-sm text-slate-600">Review admin actions, filter by module and date, and export activity data.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-2 rounded-full border border-transparent bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </button>
          </div>
        </div>

        <form method="get" className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Search</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="search"
                defaultValue={search}
                placeholder="Action, admin name, browser, IP"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </div>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Module</span>
            <select
              name="module"
              defaultValue={moduleFilter}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
            >
              {moduleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">From</span>
            <input
              type="date"
              name="startDate"
              defaultValue={startDate}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">To</span>
            <input
              type="date"
              name="endDate"
              defaultValue={endDate}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </label>

          <div className="md:col-span-4 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Filter className="mr-2 h-4 w-4" />
              Apply Filters
            </button>
            <p className="text-sm text-slate-500">{summaryText}</p>
          </div>
        </form>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-500">Time</th>
                <th className="px-4 py-3 font-medium text-slate-500">Admin</th>
                <th className="px-4 py-3 font-medium text-slate-500">Action</th>
                <th className="px-4 py-3 font-medium text-slate-500">Module</th>
                <th className="px-4 py-3 font-medium text-slate-500">IP Address</th>
                <th className="px-4 py-3 font-medium text-slate-500">Browser</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {hasLogs ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 text-slate-700">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-4 text-slate-700">{log.adminName}</td>
                    <td className="px-4 py-4 text-slate-700">{log.action}</td>
                    <td className="px-4 py-4 text-slate-700">{log.module}</td>
                    <td className="px-4 py-4 text-slate-700">{log.ipAddress || '-'}</td>
                    <td className="px-4 py-4 text-slate-700 break-all">{log.browser || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    No activity log records match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}

export async function getServerSideProps({ query }) {
  const { search = '', module: moduleFilter = 'all', startDate = '', endDate = '' } = query

  const where = {}

  if (search) {
    where.OR = [
      { adminName: { contains: String(search), mode: 'insensitive' } },
      { action: { contains: String(search), mode: 'insensitive' } },
      { module: { contains: String(search), mode: 'insensitive' } },
      { ipAddress: { contains: String(search), mode: 'insensitive' } },
      { browser: { contains: String(search), mode: 'insensitive' } },
    ]
  }

  if (moduleFilter && moduleFilter !== 'all') {
    where.module = String(moduleFilter)
  }

  if (startDate || endDate) {
    const createdAtFilter = {}
    if (startDate) {
      createdAtFilter.gte = new Date(String(startDate))
    }
    if (endDate) {
      const end = new Date(String(endDate))
      end.setHours(23, 59, 59, 999)
      createdAtFilter.lte = end
    }
    where.createdAt = createdAtFilter
  }

  const logs = await prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return {
    props: {
      logs: logs.map((log) => ({ ...log, createdAt: log.createdAt.toISOString() })),
      search: String(search),
      moduleFilter: String(moduleFilter),
      startDate: String(startDate),
      endDate: String(endDate),
    },
  }
}
