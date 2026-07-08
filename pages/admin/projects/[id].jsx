import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowLeft, Loader2, RefreshCw, Users, MapPin, Box, Wrench, CreditCard, Flag, Info, Edit2, Trash2, Plus } from 'lucide-react'
import AdminLayout from '../../../components/admin/AdminLayout'
import { prisma } from '../../../lib/prisma'

const tabs = [
  ['information', 'Information'],
  ['timeline', 'Timeline'],
  ['documents', 'Documents'],
  ['payments', 'Payments'],
  ['labour', 'Labour'],
  ['materials', 'Materials'],
  ['progress', 'Progress'],
]

const statusStyles = {
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

export async function getServerSideProps({ params }) {
  const projectId = typeof params?.id === 'string' ? params.id : ''

  if (!projectId) {
    return { notFound: true }
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!project) {
    return { notFound: true }
  }

  let customer = null

  if (project.customerId) {
    customer = await prisma.customer.findUnique({
      where: { id: project.customerId },
    })
  }

  return {
    props: {
      initialProject: JSON.parse(JSON.stringify(project)),
      initialCustomer: customer ? JSON.parse(JSON.stringify(customer)) : null,
    },
  }
}

export default function ProjectDetailsPage({ initialProject, initialCustomer }) {
  const router = useRouter()
  const projectId = typeof router.query.id === 'string' ? router.query.id : ''
  const [project, setProject] = useState(initialProject || null)
  const [customer, setCustomer] = useState(initialCustomer || null)
  const [loading, setLoading] = useState(!initialProject)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('information')
  const [editNotice, setEditNotice] = useState('')
  const [timeline, setTimeline] = useState([])
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formType, setFormType] = useState('Update')
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [editingEventId, setEditingEventId] = useState(null)

  useEffect(() => {
    if (!projectId) return

    if (initialProject?.id === projectId) {
      setProject(initialProject)
      setCustomer(initialCustomer)
      setLoading(false)
      setError('')
      return
    }

    const loadProject = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await fetch(`/api/projects/${projectId}`)
        const result = await response.json()

        if (response.ok) {
          setProject(result)
        } else {
          setError(result?.error || 'Project could not be loaded.')
        }
      } catch (err) {
        console.error('Failed to load project', err)
        setError('Unable to load project details right now.')
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [initialProject, initialCustomer, projectId])

  // Timeline fetcher
  const fetchTimeline = async () => {
    if (!projectId) return
    try {
      setTimelineLoading(true)
      const resp = await fetch(`/api/projects/${projectId}/timeline`)
      if (resp.ok) {
        const data = await resp.json()
        setTimeline(Array.isArray(data) ? data : [])
      } else {
        setTimeline([])
      }
    } catch (err) {
      console.error('Failed to load timeline', err)
      setTimeline([])
    } finally {
      setTimelineLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'timeline') {
      fetchTimeline()
    }
  }, [activeTab, projectId])

  const infoItems = useMemo(() => {
    if (!project) return []

    return [
      { label: 'Project Name', value: project.title || project.projectName || '-' },
      { label: 'Customer', value: customer?.name || project.clientName || project.customerName || '-' },
      { label: 'Project Type', value: project.projectType || '-' },
      { label: 'Site Address', value: project.siteAddress || '-' },
      { label: 'Project Manager', value: project.projectManager || '-' },
      { label: 'Estimated Budget', value: project.estimatedBudget || '-' },
      { label: 'Start Date', value: formatDate(project.startDate || project.start_date) },
      { label: 'Expected Completion Date', value: formatDate(project.expectedCompletionDate || project.expectedEndDate || project.completionDate) },
      { label: 'Status', value: project.status || 'Planning' },
      { label: 'Created Date', value: formatDate(project.createdAt) },
      { label: 'Last Updated', value: formatDate(project.updatedAt || project.updated_at) },
    ]
  }, [customer, project])

  const projectName = project?.title || project?.projectName || 'Project Details'
  const projectType = project?.projectType || '-'
  const projectManager = project?.projectManager || '-'
  const customerName = customer?.name || project?.clientName || project?.customerName || '-'
  const customerPhone = customer?.phone || project?.customerPhone || '-'
  const statusKey = String(project?.status || 'Planning').toLowerCase().trim().replace(/\s+/g, ' ')
  const statusClass = statusStyles[statusKey] || statusStyles.default

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </AdminLayout>
    )
  }

  if (error || !project) {
    return (
      <AdminLayout>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="font-medium">{error || 'Project not found.'}</p>
          <Link href="/admin/projects" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800">
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Link>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <Link
              href={project.customerId ? `/admin/customers/${project.customerId}?tab=projects` : '/admin/customers'}
              className="inline-flex items-center gap-2 self-start rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Customer
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{projectName}</h1>
              <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-600">
                <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">Project Type: {projectType}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">Project Manager: {projectManager}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="font-medium text-gray-700">Customer: {customerName}</span>
                <span className="font-medium text-gray-700">Phone: {customerPhone}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${statusClass}`}>
              {project.status || 'Planning'}
            </span>
            <button
              type="button"
              onClick={() => router.push(`/admin/projects/edit/${project.id}`)}
              className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              Edit Project
            </button>
          </div>
        </div>

        {editNotice ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            {editNotice}
          </div>
        ) : null}

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
            ) : activeTab === 'timeline' ? (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Project Timeline</h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fetchTimeline()}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingEventId(null); setFormTitle(''); setFormDescription(''); setFormType('Update'); setIsModalOpen(true) }}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add Timeline Event
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {timelineLoading ? (
                    <div className="flex items-center justify-center p-6">
                      <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                    </div>
                  ) : timeline.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                      <p className="text-sm text-gray-600">No timeline events yet. Add one using the button above.</p>
                    </div>
                  ) : (
                    timeline.map((ev) => {
                      const type = ev.type || 'Other'
                      const icon = {
                        Update: <RefreshCw className="h-5 w-5 text-slate-600" />,
                        Meeting: <Users className="h-5 w-5 text-slate-600" />,
                        'Site Visit': <MapPin className="h-5 w-5 text-slate-600" />,
                        Material: <Box className="h-5 w-5 text-slate-600" />,
                        Labour: <Wrench className="h-5 w-5 text-slate-600" />,
                        Payment: <CreditCard className="h-5 w-5 text-slate-600" />,
                        Milestone: <Flag className="h-5 w-5 text-slate-600" />,
                        Other: <Info className="h-5 w-5 text-slate-600" />,
                      }[type] || <Info className="h-5 w-5 text-slate-600" />

                      return (
                        <div key={ev.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="rounded-lg bg-gray-50 p-2">{icon}</div>
                              <div>
                                <h3 className="text-sm font-semibold text-gray-900">{ev.title}</h3>
                                <p className="mt-1 text-sm text-gray-600">{ev.description}</p>
                                <p className="mt-2 text-xs text-gray-500">{new Date(ev.createdAt).toLocaleString()} • {ev.createdBy || 'Admin'}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingEventId(ev.id)
                                  setFormTitle(ev.title || '')
                                  setFormDescription(ev.description || '')
                                  setFormType(ev.type || 'Other')
                                  setIsModalOpen(true)
                                }}
                                className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Edit2 className="h-4 w-4" />
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={async () => {
                                  if (!confirm('Are you sure you want to delete this timeline event?')) return
                                  try {
                                    const resp = await fetch(`/api/projects/${project.id}/timeline?eventId=${ev.id}`, { method: 'DELETE' })
                                    if (resp.ok || resp.status === 204) {
                                      fetchTimeline()
                                    } else {
                                      alert('Failed to delete event')
                                    }
                                  } catch (err) {
                                    console.error(err)
                                    alert('Error deleting event')
                                  }
                                }}
                                className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-sm text-red-700 hover:bg-red-100"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {isModalOpen ? (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-lg rounded-lg bg-white p-6">
                      <h3 className="text-lg font-semibold text-gray-900">{editingEventId ? 'Edit Timeline Event' : 'Add Timeline Event'}</h3>

                      <div className="mt-4 grid gap-3">
                        <label className="text-sm font-medium text-gray-700">Event Type</label>
                        <select value={formType} onChange={(e) => setFormType(e.target.value)} className="rounded-md border border-gray-200 p-2">
                          <option>Update</option>
                          <option>Meeting</option>
                          <option>Site Visit</option>
                          <option>Material</option>
                          <option>Labour</option>
                          <option>Payment</option>
                          <option>Milestone</option>
                          <option>Other</option>
                        </select>

                        <label className="text-sm font-medium text-gray-700">Title</label>
                        <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="rounded-md border border-gray-200 p-2" />

                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} className="min-h-[100px] rounded-md border border-gray-200 p-2" />
                      </div>

                      <div className="mt-4 flex items-center justify-end gap-2">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">Cancel</button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!formTitle) { alert('Title is required'); return }
                            try {
                              if (editingEventId) {
                                const resp = await fetch(`/api/projects/${project.id}/timeline?eventId=${editingEventId}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ title: formTitle, description: formDescription, type: formType }),
                                })
                                if (!resp.ok) throw new Error('Failed to update')
                              } else {
                                const resp = await fetch(`/api/projects/${project.id}/timeline`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ title: formTitle, description: formDescription, type: formType, createdBy: 'Admin' }),
                                })
                                if (!resp.ok) throw new Error('Failed to create')
                              }
                              setIsModalOpen(false)
                              fetchTimeline()
                            } catch (err) {
                              console.error(err)
                              alert('Error saving event')
                            }
                          }}
                          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <p className="text-lg font-semibold text-gray-900">This module will be implemented in the next sprint.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
