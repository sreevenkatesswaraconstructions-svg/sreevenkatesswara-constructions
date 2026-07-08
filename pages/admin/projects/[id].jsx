import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowLeft, Loader2, RefreshCw, Users, MapPin, Box, Wrench, CreditCard, Flag, Info, Edit2, Trash2, Plus, FileText, FileImage, FileVideo, Eye, Play, Download, X, UploadCloud } from 'lucide-react'
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

function formatFileSize(value) {
  if (!Number.isFinite(Number(value)) || Number(value) <= 0) {
    return '-'
  }

  const bytes = Number(value)
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  let size = bytes
  let index = 0

  while (size >= 1024 && index < sizes.length - 1) {
    size /= 1024
    index += 1
  }

  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${sizes[index]}`
}

function getDocumentKind(doc) {
  const fileType = String(doc?.fileType || '').toLowerCase()
  const fileName = String(doc?.originalName || doc?.fileName || '').toLowerCase()

  if (fileType.includes('pdf') || fileName.endsWith('.pdf')) return 'pdf'
  if (fileType.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.bmp'].some((ext) => fileName.endsWith(ext))) return 'image'
  if (fileType.startsWith('video/') || ['.mp4', '.mov', '.webm', '.avi', '.mkv'].some((ext) => fileName.endsWith(ext))) return 'video'

  return 'document'
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
  const [documents, setDocuments] = useState([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [documentsNotice, setDocumentsNotice] = useState('')
  const [payments, setPayments] = useState([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [paymentsNotice, setPaymentsNotice] = useState('')
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [editingPaymentId, setEditingPaymentId] = useState(null)
  const [savingPayment, setSavingPayment] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    paymentDate: '',
    amount: '',
    paymentMode: 'Cash',
    paymentType: 'Other',
    referenceNumber: '',
    notes: '',
  })
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [selectedDocumentFile, setSelectedDocumentFile] = useState(null)
  const [selectedDocumentCategory, setSelectedDocumentCategory] = useState('Other')
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [previewDocument, setPreviewDocument] = useState(null)
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

  const fetchDocuments = async () => {
    if (!projectId) return
    try {
      setDocumentsLoading(true)
      setDocumentsNotice('')
      const resp = await fetch(`/api/projects/${projectId}/documents`)
      if (resp.ok) {
        const data = await resp.json()
        setDocuments(Array.isArray(data) ? data : [])
      } else {
        setDocuments([])
        const result = await resp.json().catch(() => ({}))
        setDocumentsNotice(result?.error || 'Unable to load project documents.')
      }
    } catch (err) {
      console.error('Failed to load documents', err)
      setDocuments([])
      setDocumentsNotice('Unable to load project documents right now.')
    } finally {
      setDocumentsLoading(false)
    }
  }

  const fetchPayments = async () => {
    if (!projectId) return
    try {
      setPaymentsLoading(true)
      setPaymentsNotice('')
      const resp = await fetch(`/api/projects/${projectId}/payments`)
      if (resp.ok) {
        const data = await resp.json()
        setPayments(Array.isArray(data) ? data : [])
      } else {
        setPayments([])
        const result = await resp.json().catch(() => ({}))
        setPaymentsNotice(result?.error || 'Unable to load project payments.')
      }
    } catch (err) {
      console.error('Failed to load project payments', err)
      setPayments([])
      setPaymentsNotice('Unable to load project payments right now.')
    } finally {
      setPaymentsLoading(false)
    }
  }

  const handleUploadDocument = async (event) => {
    event.preventDefault()

    if (!selectedDocumentFile) {
      setDocumentsNotice('Please choose a file to upload.')
      return
    }

    try {
      setUploadingDocument(true)
      setDocumentsNotice('')

      const formData = new FormData()
      formData.append('file', selectedDocumentFile)

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const uploadResult = await uploadResponse.json()
      if (!uploadResponse.ok || !uploadResult?.success) {
        throw new Error(uploadResult?.error || 'Upload failed')
      }

      const createDocumentResponse = await fetch(`/api/projects/${projectId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: uploadResult?.media?.fileName || selectedDocumentFile.name,
          originalName: selectedDocumentFile.name,
          fileUrl: uploadResult?.media?.fileUrl,
          fileType: selectedDocumentFile.type || uploadResult?.media?.mimeType || 'application/octet-stream',
          fileSize: selectedDocumentFile.size || uploadResult?.media?.fileSize || 0,
          uploadedBy: 'Admin',
          category: selectedDocumentCategory,
        }),
      })

      const createDocumentResult = await createDocumentResponse.json().catch(() => ({}))
      if (!createDocumentResponse.ok) {
        throw new Error(createDocumentResult?.error || 'Unable to save document record.')
      }

      setSelectedDocumentFile(null)
      setSelectedDocumentCategory('Other')
      setUploadModalOpen(false)
      setDocumentsNotice('Document uploaded successfully.')
      fetchDocuments()
    } catch (err) {
      console.error('Upload document failed', err)
      setDocumentsNotice(err?.message || 'Unable to upload document right now.')
    } finally {
      setUploadingDocument(false)
    }
  }

  const handleDeleteDocument = async (documentId) => {
    if (!confirm('Delete this document?')) return

    try {
      const resp = await fetch(`/api/projects/${projectId}/documents?documentId=${documentId}`, { method: 'DELETE' })
      if (resp.ok) {
        fetchDocuments()
      } else {
        const result = await resp.json().catch(() => ({}))
        setDocumentsNotice(result?.error || 'Unable to delete document.')
      }
    } catch (err) {
      console.error('Failed to delete document', err)
      setDocumentsNotice('Unable to delete document right now.')
    }
  }

  const handleViewDocument = (doc) => {
    const documentKind = getDocumentKind(doc)
    const fileUrl = doc?.fileUrl

    if (!fileUrl) {
      setDocumentsNotice('No preview link is available for this document.')
      return
    }

    if (documentKind === 'image' || documentKind === 'video') {
      setPreviewDocument({ doc, kind: documentKind })
      return
    }

    window.open(fileUrl, '_blank', 'noopener,noreferrer')
  }

  const handleDownloadDocument = (doc) => {
    const fileUrl = doc?.fileUrl

    if (!fileUrl) {
      setDocumentsNotice('No download link is available for this document.')
      return
    }

    const downloadLink = document.createElement('a')
    downloadLink.href = fileUrl
    downloadLink.target = '_blank'
    downloadLink.rel = 'noopener noreferrer'
    downloadLink.download = doc?.originalName || doc?.fileName || 'document'
    document.body.appendChild(downloadLink)
    downloadLink.click()
    downloadLink.remove()
  }

  useEffect(() => {
    if (activeTab === 'timeline') {
      fetchTimeline()
    }

    if (activeTab === 'documents') {
      fetchDocuments()
    }

    if (activeTab === 'payments') {
      fetchPayments()
    }
  }, [activeTab, projectId])

  const parseCurrencyValue = (value) => {
    if (value === null || value === undefined || value === '') return 0
    const numeric = Number(String(value).replace(/[^\d.-]/g, ''))
    return Number.isFinite(numeric) ? numeric : 0
  }

  const formatCurrency = (value) => {
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) return '-'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(numeric)
  }

  const totalProjectValue = useMemo(() => parseCurrencyValue(project?.estimatedBudget), [project?.estimatedBudget])
  const amountReceived = useMemo(() => payments.reduce((total, payment) => total + Number(payment?.amount || 0), 0), [payments])
  const outstandingBalance = useMemo(() => totalProjectValue - amountReceived, [amountReceived, totalProjectValue])

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

  const openPaymentModal = (payment = null) => {
    if (payment) {
      setEditingPaymentId(payment.id)
      setPaymentForm({
        paymentDate: payment.paymentDate ? new Date(payment.paymentDate).toISOString().split('T')[0] : '',
        amount: payment.amount != null ? String(payment.amount) : '',
        paymentMode: payment.paymentMode || 'Cash',
        paymentType: payment.paymentType || 'Other',
        referenceNumber: payment.referenceNumber || '',
        notes: payment.notes || '',
      })
    } else {
      setEditingPaymentId(null)
      setPaymentForm({
        paymentDate: '',
        amount: '',
        paymentMode: 'Cash',
        paymentType: 'Other',
        referenceNumber: '',
        notes: '',
      })
    }
    setPaymentModalOpen(true)
  }

  const handleSavePayment = async (event) => {
    event.preventDefault()

    if (!paymentForm.paymentDate || !paymentForm.amount || !paymentForm.paymentMode) {
      setPaymentsNotice('Please fill the payment date, amount, and payment mode.')
      return
    }

    try {
      setSavingPayment(true)
      setPaymentsNotice('')
      const payload = {
        paymentDate: paymentForm.paymentDate,
        amount: paymentForm.amount,
        paymentMode: paymentForm.paymentMode,
        paymentType: paymentForm.paymentType,
        referenceNumber: paymentForm.referenceNumber,
        notes: paymentForm.notes,
      }

      const resp = editingPaymentId
        ? await fetch(`/api/projects/${projectId}/payments/${editingPaymentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/projects/${projectId}/payments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })

      const result = await resp.json().catch(() => ({}))
      if (!resp.ok) {
        throw new Error(result?.error || 'Unable to save payment.')
      }

      setPaymentModalOpen(false)
      setEditingPaymentId(null)
      setPaymentForm({ paymentDate: '', amount: '', paymentMode: 'Cash', paymentType: 'Other', referenceNumber: '', notes: '' })
      fetchPayments()
    } catch (err) {
      console.error('Failed to save payment', err)
      setPaymentsNotice(err?.message || 'Unable to save payment right now.')
    } finally {
      setSavingPayment(false)
    }
  }

  const handleDeletePayment = async (paymentId) => {
    if (!confirm('Delete this payment entry?')) return
    try {
      const resp = await fetch(`/api/projects/${projectId}/payments/${paymentId}`, { method: 'DELETE' })
      if (!resp.ok) {
        const result = await resp.json().catch(() => ({}))
        throw new Error(result?.error || 'Unable to delete payment.')
      }
      fetchPayments()
    } catch (err) {
      console.error('Failed to delete payment', err)
      setPaymentsNotice(err?.message || 'Unable to delete payment right now.')
    }
  }
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
            ) : activeTab === 'documents' ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Project Documents</h2>
                    <p className="text-sm text-gray-600">Upload and manage project files.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => fetchDocuments()}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDocumentsNotice('')
                        setSelectedDocumentFile(null)
                        setSelectedDocumentCategory('Other')
                        setUploadModalOpen(true)
                      }}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      <UploadCloud className="h-4 w-4" />
                      Upload Document
                    </button>
                  </div>
                </div>

                {documentsNotice ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                    {documentsNotice}
                  </div>
                ) : null}

                {documentsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  </div>
                ) : documents.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                    <p className="text-sm font-medium text-gray-900">No documents uploaded yet.</p>
                    <p className="mt-2 text-sm text-gray-600">Upload your first project document.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => {
                      const documentName = doc.originalName || doc.fileName || 'Untitled document'
                      const documentType = doc.fileType || 'Unknown'
                      const uploadedBy = doc.uploadedBy || 'Admin'
                      const uploadedAt = formatDate(doc.createdAt || doc.uploadedAt)
                      const documentKind = getDocumentKind(doc)
                      const viewLabel = documentKind === 'video' ? 'Play' : 'View'

                      return (
                        <div key={doc.id} className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
                          <div className="flex items-start gap-3">
                            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                              {documentKind === 'image' ? <FileImage className="h-5 w-5" /> : documentKind === 'video' ? <FileVideo className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900">{documentName}</h3>
                              <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
                                <span>Type: {documentType}</span>
                                <span>Size: {formatFileSize(doc.fileSize)}</span>
                                <span>Uploaded: {uploadedAt}</span>
                                <span>By: {uploadedBy}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewDocument(doc)}
                              className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                            >
                              {documentKind === 'video' ? <Play className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              {viewLabel}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadDocument(doc)}
                              className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {previewDocument ? (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreviewDocument(null)}>
                    <div className="w-full max-w-4xl rounded-2xl bg-white p-4 shadow-xl" onClick={(event) => event.stopPropagation()}>
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{previewDocument.doc.originalName || previewDocument.doc.fileName || 'Document Preview'}</h3>
                          <p className="mt-1 text-sm text-gray-600">{previewDocument.kind === 'image' ? 'Image preview' : 'Video preview'}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewDocument(null)}
                          className="rounded-md border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-50"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {previewDocument.kind === 'image' ? (
                        <img src={previewDocument.doc.fileUrl} alt={previewDocument.doc.originalName || previewDocument.doc.fileName || 'Document preview'} className="max-h-[70vh] w-full rounded-xl object-contain" />
                      ) : (
                        <video src={previewDocument.doc.fileUrl} controls playsInline className="max-h-[70vh] w-full rounded-xl bg-black" />
                      )}
                    </div>
                  </div>
                ) : null}

                {uploadModalOpen ? (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Upload Project Document</h3>
                          <p className="mt-1 text-sm text-gray-600">Choose a file and category before uploading.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setUploadModalOpen(false)
                            setSelectedDocumentFile(null)
                            setSelectedDocumentCategory('Other')
                          }}
                          className="rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-600 hover:bg-gray-50"
                        >
                          Close
                        </button>
                      </div>

                      <form onSubmit={handleUploadDocument} className="mt-5 space-y-4">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">Select File</label>
                          <input
                            type="file"
                            accept=".doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.mp4,.mov"
                            onChange={(event) => setSelectedDocumentFile(event.target.files?.[0] || null)}
                            className="block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 file:mr-3 file:rounded file:border-0 file:bg-emerald-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">Category</label>
                          <select
                            value={selectedDocumentCategory}
                            onChange={(event) => setSelectedDocumentCategory(event.target.value)}
                            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                          >
                            <option value="Agreement">Agreement</option>
                            <option value="Drawing">Drawing</option>
                            <option value="BOQ">BOQ</option>
                            <option value="Site Photo">Site Photo</option>
                            <option value="Site Video">Site Video</option>
                            <option value="Invoice">Invoice</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setUploadModalOpen(false)
                              setSelectedDocumentFile(null)
                              setSelectedDocumentCategory('Other')
                            }}
                            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={uploadingDocument}
                            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                          >
                            {uploadingDocument ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <UploadCloud className="h-4 w-4" />
                                Upload
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : activeTab === 'payments' ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Project Payments</h2>
                    <p className="text-sm text-gray-600">Track project value, received payments, and the outstanding balance.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => fetchPayments()}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </button>
                    <button
                      type="button"
                      onClick={() => openPaymentModal()}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add Payment
                    </button>
                  </div>
                </div>

                {paymentsNotice ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                    {paymentsNotice}
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Project Value</p>
                    <p className="mt-2 text-xl font-semibold text-gray-900">{formatCurrency(totalProjectValue)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Amount Received</p>
                    <p className="mt-2 text-xl font-semibold text-gray-900">{formatCurrency(amountReceived)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Outstanding Balance</p>
                    <p className="mt-2 text-xl font-semibold text-gray-900">{formatCurrency(outstandingBalance)}</p>
                  </div>
                </div>

                {paymentsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  </div>
                ) : payments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                    <p className="text-sm font-medium text-gray-900">No payments added yet.</p>
                    <p className="mt-2 text-sm text-gray-600">Add the first payment to start tracking project collections.</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Amount</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Type</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Mode</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Reference</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Notes</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {payments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-700">{formatDate(payment.paymentDate)}</td>
                            <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(payment.amount)}</td>
                            <td className="px-4 py-3 text-gray-700">
                              <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                                {payment.paymentType === 'FirstInstallment' ? '1st Installment' : payment.paymentType === 'SecondInstallment' ? '2nd Installment' : payment.paymentType === 'ThirdInstallment' ? '3rd Installment' : payment.paymentType === 'FinalPayment' ? 'Final Payment' : payment.paymentType === 'ExtraWork' ? 'Extra Work' : payment.paymentType || 'Other'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-700">{payment.paymentMode || '-'}</td>
                            <td className="px-4 py-3 text-gray-700">{payment.referenceNumber || '-'}</td>
                            <td className="px-4 py-3 text-gray-700">{payment.notes || '-'}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => openPaymentModal(payment)}
                                  className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <Edit2 className="h-4 w-4" />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePayment(payment.id)}
                                  className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-sm text-red-700 hover:bg-red-100"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {paymentModalOpen ? (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{editingPaymentId ? 'Edit Payment' : 'Add Payment'}</h3>
                          <p className="mt-1 text-sm text-gray-600">Record a customer payment against this project.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentModalOpen(false)
                            setEditingPaymentId(null)
                            setPaymentForm({ paymentDate: '', amount: '', paymentMode: 'Cash', referenceNumber: '', notes: '' })
                          }}
                          className="rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-600 hover:bg-gray-50"
                        >
                          Close
                        </button>
                      </div>

                      <form onSubmit={handleSavePayment} className="mt-5 space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Payment Date</label>
                            <input
                              type="date"
                              value={paymentForm.paymentDate}
                              onChange={(event) => setPaymentForm((prev) => ({ ...prev, paymentDate: event.target.value }))}
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700"
                              required
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Amount</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={paymentForm.amount}
                              onChange={(event) => setPaymentForm((prev) => ({ ...prev, amount: event.target.value }))}
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">Payment Mode</label>
                          <select
                            value={paymentForm.paymentMode}
                            onChange={(event) => setPaymentForm((prev) => ({ ...prev, paymentMode: event.target.value }))}
                            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                            required
                          >
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cheque">Cheque</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">Payment Type</label>
                          <select
                            value={paymentForm.paymentType}
                            onChange={(event) => setPaymentForm((prev) => ({ ...prev, paymentType: event.target.value }))}
                            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                            required
                          >
                            <option value="Advance">Advance</option>
                            <option value="FirstInstallment">First Installment</option>
                            <option value="SecondInstallment">Second Installment</option>
                            <option value="ThirdInstallment">Third Installment</option>
                            <option value="FinalPayment">Final Payment</option>
                            <option value="ExtraWork">Extra Work</option>
                            <option value="Refund">Refund</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">Reference Number</label>
                          <input
                            type="text"
                            value={paymentForm.referenceNumber}
                            onChange={(event) => setPaymentForm((prev) => ({ ...prev, referenceNumber: event.target.value }))}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700"
                            placeholder="Optional"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">Notes</label>
                          <textarea
                            value={paymentForm.notes}
                            onChange={(event) => setPaymentForm((prev) => ({ ...prev, notes: event.target.value }))}
                            className="min-h-[100px] w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700"
                            placeholder="Optional"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentModalOpen(false)
                              setEditingPaymentId(null)
                              setPaymentForm({ paymentDate: '', amount: '', paymentMode: 'Cash', referenceNumber: '', notes: '' })
                            }}
                            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={savingPayment}
                            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                          >
                            {savingPayment ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              editingPaymentId ? 'Update Payment' : 'Save Payment'
                            )}
                          </button>
                        </div>
                      </form>
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
