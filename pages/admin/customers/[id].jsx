import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ArrowLeft, Loader2, Plus, RefreshCw, Info, MapPin, Box, Wrench, CreditCard, Flag, Users } from 'lucide-react'
import AdminLayout from '../../../components/admin/AdminLayout'

const tabs = [
  ['information', 'Information'],
  ['timeline', 'Timeline'],
  ['projects', 'Projects'],
  ['quotations', 'Quotations'],
  ['invoices', 'Invoices'],
  ['payments', 'Payments'],
  ['documents', 'Documents'],
  ['notes', 'Notes'],
]

const emptyStateMessages = {
  timeline: 'No timeline events available.',
  projects: 'No projects created yet.',
  quotations: 'No quotations available.',
  invoices: 'No invoices available.',
  payments: 'No payments available.',
  documents: 'No documents uploaded.',
  notes: 'No notes added.',
}

const statusStyles = {
  active: 'bg-emerald-50 text-emerald-700',
  projectongoing: 'bg-sky-50 text-sky-700',
  completed: 'bg-violet-50 text-violet-700',
  inactive: 'bg-rose-50 text-rose-700',
  default: 'bg-slate-50 text-slate-700',
}

const projectStatusStyles = {
  planning: 'bg-slate-100 text-slate-700',
  ongoing: 'bg-sky-100 text-sky-700',
  'on hold': 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  default: 'bg-gray-100 text-gray-700',
}

function formatDate(value) {
  if (!value) return '-'

  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value))
  } catch {
    return '-'
  }
}

export default function CustomerDetailsPage() {
  const router = useRouter()
  const customerId = typeof router.query.id === 'string' ? router.query.id : ''
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('information')
  const [projects, setProjects] = useState([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [projectsError, setProjectsError] = useState('')
  const [timeline, setTimeline] = useState([])
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [timelineError, setTimelineError] = useState('')

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await fetch('/api/customers')
        const result = await response.json()
        if (result?.success) {
          setCustomers(result.data || [])
        } else {
          setError(result?.message || 'Failed to load customers')
        }
      } catch (err) {
        console.error('Failed to load customers', err)
        setError('Unable to load customers right now.')
      } finally {
        setLoading(false)
      }
    }

    loadCustomers()
  }, [])

  useEffect(() => {
    if (typeof router.query.tab === 'string' && tabs.some(([key]) => key === router.query.tab)) {
      setActiveTab(router.query.tab)
    } else {
      setActiveTab('information')
    }
  }, [router.query.tab])

  useEffect(() => {
    if (!customerId || activeTab !== 'projects') return

    const loadProjects = async () => {
      try {
        setProjectsLoading(true)
        setProjectsError('')
        const response = await fetch(`/api/projects?customerId=${customerId}`)
        const result = await response.json()
        if (Array.isArray(result)) {
          setProjects(result)
        } else {
          setProjectsError('Unable to load projects right now.')
        }
      } catch (err) {
        console.error('Failed to load customer projects', err)
        setProjectsError('Unable to load projects right now.')
      } finally {
        setProjectsLoading(false)
      }
    }

    loadProjects()
  }, [activeTab, customerId])

  useEffect(() => {
    if (!customerId || activeTab !== 'timeline') return

    const loadTimeline = async () => {
      try {
        setTimelineLoading(true)
        setTimelineError('')
        const response = await fetch(`/api/customers/${customerId}/timeline`)
        const result = await response.json()
        if (result?.success) {
          setTimeline(result.data || [])
        } else {
          setTimelineError(result?.message || 'Unable to load timeline right now.')
        }
      } catch (err) {
        console.error('Failed to load customer timeline', err)
        setTimelineError('Unable to load timeline right now.')
      } finally {
        setTimelineLoading(false)
      }
    }

    loadTimeline()
  }, [activeTab, customerId])

  const customer = useMemo(() => {
    if (!customerId) return null
    return customers.find((item) => String(item.id) === String(customerId)) || null
  }, [customers, customerId])

  const infoItems = useMemo(() => {
    if (!customer) return []

    const locationParts = String(customer.location || '')
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)

    const address = locationParts[0] || '-'
    const city = locationParts[1] || '-'
    const state = locationParts[2] || '-'
    const pincode = locationParts[3] || '-'

    return [
      { label: 'Customer ID', value: customer.id || '-' },
      { label: 'Customer Name', value: customer.name || '-' },
      { label: 'Phone', value: customer.phone || '-' },
      { label: 'Email', value: customer.email || '-' },
      { label: 'Address', value: address },
      { label: 'City', value: city },
      { label: 'State', value: state },
      { label: 'Pincode', value: pincode },
      { label: 'Lead Source', value: '-' },
      { label: 'Customer Since', value: formatDate(customer.createdAt) },
      { label: 'Customer Status', value: customer.status || 'Active' },
    ]
  }, [customer])

  const statusKey = String(customer?.status || 'Active').toLowerCase().replace(/\s+/g, '')
  const statusClass = statusStyles[statusKey] || statusStyles.default

  const getProjectStatusClass = (value) => {
    const normalized = String(value || 'Planning').toLowerCase().trim()
    return projectStatusStyles[normalized] || projectStatusStyles.default
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="font-medium">{error}</p>
        </div>
      </AdminLayout>
    )
  }

  if (!customer) {
    return (
      <AdminLayout>
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <h2 className="text-lg font-semibold text-gray-900">Customer not found</h2>
          <p className="mt-2 text-sm text-gray-600">The requested customer could not be located.</p>
          <Link href="/admin/customers" className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <ArrowLeft className="h-4 w-4" />
            Back to Customers
          </Link>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/admin/customers" className="inline-flex items-center gap-2 self-start rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50">
              <ArrowLeft className="h-4 w-4" />
              Back to Customers
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
              <p className="mt-1 text-sm text-gray-600">Customer profile and overview</p>
            </div>
          </div>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${statusClass}`}>
            {customer.status || 'Active'}
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap gap-2 border-b border-gray-200 bg-gray-50 p-3 sm:p-4">
            {tabs.map(([key, label]) => {
              const isActive = activeTab === key
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === 'information' ? (
              <div className="grid gap-4 md:grid-cols-2">
                {infoItems.map((item) => (
                  <div key={item.label} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{item.label}</p>
                    <p className="mt-2 text-sm font-medium text-gray-900">{item.value}</p>
                  </div>
                ))}
              </div>
            ) : activeTab === 'projects' ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Projects</h2>
                    <p className="text-sm text-gray-600">Manage this customer&apos;s construction projects.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push(`/admin/projects/create?customerId=${customerId}`)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <Plus className="h-4 w-4" />
                    Create Project
                  </button>
                </div>

                {projectsLoading ? (
                  <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                      Loading projects...
                    </div>
                  </div>
                ) : projectsError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{projectsError}</div>
                ) : projects.length === 0 ? (
                  <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                    <p className="text-lg font-semibold text-gray-900">No projects have been created yet.</p>
                    <p className="mt-2 text-sm text-gray-600">Add the first project for this customer to get started.</p>
                    <button
                      type="button"
                      onClick={() => router.push(`/admin/projects/create?customerId=${customerId}`)}
                      className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4" />
                      Create Project
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {projects.map((project) => (
                      <div key={project.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{project.title || project.projectName || 'Untitled Project'}</h3>
                            <p className="mt-1 text-sm text-gray-600">{project.projectType || 'Project'}</p>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getProjectStatusClass(project.status)}`}>
                            {project.status || 'Planning'}
                          </span>
                        </div>
                        <div className="mt-4 space-y-2 text-sm text-gray-600">
                          <p><span className="font-medium text-gray-700">Start Date:</span> {formatDate(project.startDate)}</p>
                        </div>
                        <div className="mt-5">
                          <Link href={`/admin/projects/${project.id}`} className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                            View Project
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === 'timeline' ? (
              <div className="space-y-4">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Customer Timeline</h2>
                  <button
                    type="button"
                    onClick={() => {
                      setTimeline([])
                      setTimelineLoading(true)
                      fetch(`/api/customers/${customerId}/timeline`)
                        .then(r => r.json())
                        .then(d => {
                          if (d.success) {
                            setTimeline(d.data || [])
                          }
                          setTimelineLoading(false)
                        })
                        .catch(() => setTimelineLoading(false))
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </button>
                </div>

                {timelineLoading ? (
                  <div className="flex items-center justify-center p-6">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  </div>
                ) : timelineError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{timelineError}</div>
                ) : timeline.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                    <p className="text-sm text-gray-600">No timeline events yet.</p>
                  </div>
                ) : (
                  timeline.map((event) => {
                    const eventType = event.eventType || 'Other'
                    const icon = {
                      'Status Update': <RefreshCw className="h-5 w-5 text-slate-600" />,
                      'Meeting': <Users className="h-5 w-5 text-slate-600" />,
                      'Site Visit': <MapPin className="h-5 w-5 text-slate-600" />,
                      'Material Order': <Box className="h-5 w-5 text-slate-600" />,
                      'Labour Assigned': <Wrench className="h-5 w-5 text-slate-600" />,
                      'Payment': <CreditCard className="h-5 w-5 text-slate-600" />,
                      'Milestone': <Flag className="h-5 w-5 text-slate-600" />,
                      'Other': <Info className="h-5 w-5 text-slate-600" />,
                    }[eventType] || <Info className="h-5 w-5 text-slate-600" />

                    const sourceStyles = {
                      'SYSTEM': 'bg-blue-50 text-blue-700',
                      'MANUAL': 'bg-amber-50 text-amber-700',
                    }
                    const sourceBadgeClass = sourceStyles[event.source] || 'bg-gray-50 text-gray-700'

                    return (
                      <div key={event.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="rounded-lg bg-gray-50 p-2">{icon}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-gray-900">{event.title}</h3>
                                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${sourceBadgeClass}`}>
                                  {event.source || 'SYSTEM'}
                                </span>
                              </div>
                              {event.description && (
                                <p className="mt-1 text-sm text-gray-600">{event.description}</p>
                              )}
                              <p className="mt-2 text-xs text-gray-500">
                                {new Date(event.createdAt).toLocaleString()} {event.createdBy ? `• ${event.createdBy}` : ''}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            ) : (
              <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <p className="text-lg font-semibold text-gray-900">{emptyStateMessages[activeTab] || 'No data available.'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
