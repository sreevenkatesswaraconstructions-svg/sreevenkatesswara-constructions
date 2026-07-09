import { useEffect, useMemo, useState } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ArrowLeft, Loader2, Plus, RefreshCw, Info, MapPin, Box, Wrench, CreditCard, Flag, Users, Phone, MessageSquare, Mail, ReceiptText, FileText, CalendarDays } from 'lucide-react'
import AdminLayout from '../../../components/admin/AdminLayout'
import DashboardCard from '../../../components/admin/DashboardCard'

const tabs = [
  ['information', 'Information'],
  ['timeline', 'Timeline'],
  ['contact-history', 'Contact History'],
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

function formatCurrency(value) {
  const numeric = Number(value || 0)
  if (!Number.isFinite(numeric)) return '₹0'

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(numeric)
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
  const [quotations, setQuotations] = useState([])
  const [invoices, setInvoices] = useState([])
  const [invoicesLoading, setInvoicesLoading] = useState(false)
  const [invoicesError, setInvoicesError] = useState('')
  const [quotationsLoading, setQuotationsLoading] = useState(false)
  const [quotationsError, setQuotationsError] = useState('')
  const [paymentsSummary, setPaymentsSummary] = useState(null)
  const [paymentsSummaryLoading, setPaymentsSummaryLoading] = useState(false)
  const [paymentsSummaryError, setPaymentsSummaryError] = useState('')

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

  const loadProjects = async () => {
    if (!customerId || activeTab !== 'projects') return

    try {
      setProjectsLoading(true)
      setProjectsError('')
      const response = await fetch(`/api/customers/${customerId}/projects`)
      const result = await response.json()
      if (Array.isArray(result)) {
        setProjects(result)
      } else {
        setProjectsError(result?.message || 'Unable to load projects right now.')
      }
    } catch (err) {
      console.error('Failed to load customer projects', err)
      setProjectsError('Unable to load projects right now.')
    } finally {
      setProjectsLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [activeTab, customerId])

  const loadQuotations = async () => {
    if (!customerId || activeTab !== 'quotations') return

    try {
      setQuotationsLoading(true)
      setQuotationsError('')
      const response = await fetch(`/api/customers/${customerId}/quotations`)
      const result = await response.json()
      if (Array.isArray(result)) {
        setQuotations(result)
      } else {
        setQuotationsError(result?.message || 'Unable to load quotations right now.')
      }
    } catch (err) {
      console.error('Failed to load customer quotations', err)
      setQuotationsError('Unable to load quotations right now.')
    } finally {
      setQuotationsLoading(false)
    }
  }

  useEffect(() => {
    loadQuotations()
  }, [activeTab, customerId])

  const loadInvoices = async () => {
    if (!customerId || !['invoices', 'payments'].includes(activeTab)) return

    try {
      setInvoicesLoading(true)
      setInvoicesError('')
      const response = await fetch(`/api/customers/${customerId}/invoices`)
      const result = await response.json()
      if (Array.isArray(result)) {
        setInvoices(result)
      } else {
        setInvoicesError(result?.message || 'Unable to load invoices right now.')
      }
    } catch (err) {
      console.error('Failed to load customer invoices', err)
      setInvoicesError('Unable to load invoices right now.')
    } finally {
      setInvoicesLoading(false)
    }
  }

  useEffect(() => {
    loadInvoices()
  }, [activeTab, customerId])

  useEffect(() => {
    if (!customerId || activeTab !== 'payments') {
      setPaymentsSummary(null)
      setPaymentsSummaryError('')
      return
    }

    const loadPaymentsSummary = async () => {
      try {
        setPaymentsSummaryLoading(true)
        setPaymentsSummaryError('')
        const response = await fetch(`/api/customers/${customerId}/payments`)
        const result = await response.json()
        if (result?.success) {
          setPaymentsSummary(result.data || null)
        } else {
          setPaymentsSummaryError(result?.message || 'Unable to load payment summary right now.')
        }
      } catch (err) {
        console.error('Failed to load customer payment summary', err)
        setPaymentsSummaryError('Unable to load payment summary right now.')
      } finally {
        setPaymentsSummaryLoading(false)
      }
    }

    loadPaymentsSummary()
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

  // Load contact history when tab is active
  useEffect(() => {
    if (!customerId || activeTab !== 'contact-history') return

    const loadContactHistory = async () => {
      try {
        setContactLoading(true)
        setContactError('')
        const response = await fetch(`/api/customers/${customerId}/contact-history`)
        const result = await response.json()
        if (Array.isArray(result)) {
          setContactHistory(result)
        } else if (result?.success && Array.isArray(result.data)) {
          setContactHistory(result.data)
        } else {
          setContactHistory([])
          setContactError(result?.message || 'Unable to load contact history right now.')
        }
      } catch (err) {
        console.error('Failed to load contact history', err)
        setContactError('Unable to load contact history right now.')
      } finally {
        setContactLoading(false)
      }
    }

    loadContactHistory()
  }, [activeTab, customerId])

  const submitContactNote = async () => {
    if (!customerId) return
    setAddingContact(true)
    try {
      const body = {
        type: newContactType,
        title: newContactTitle || `${newContactType}`,
        description: newContactDescription || '',
      }
      const res = await fetch(`/api/customers/${customerId}/contact-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const result = await res.json()
      if (res.ok) {
        setNewContactTitle('')
        setNewContactDescription('')
        setShowAddContactForm(false)
        // reload
        setContactHistory((prev) => [result, ...prev])
      } else {
        console.error('Failed to add contact note', result)
        alert(result?.message || 'Failed to add contact note')
      }
    } catch (err) {
      console.error('Failed to add contact note', err)
      alert('Failed to add contact note')
    } finally {
      setAddingContact(false)
    }
  }

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

  const phoneAvailable = Boolean(customer?.phone)
  const emailAvailable = Boolean(customer?.email)
  const phoneDigits = phoneAvailable ? String(customer.phone).replace(/\D/g, '') : ''
  const [contactHistory, setContactHistory] = useState([])
  const [contactLoading, setContactLoading] = useState(false)
  const [contactError, setContactError] = useState('')
  const [showAddContactForm, setShowAddContactForm] = useState(false)
  const [newContactType, setNewContactType] = useState('Phone Call')
  const [newContactTitle, setNewContactTitle] = useState('')
  const [newContactDescription, setNewContactDescription] = useState('')
  const [addingContact, setAddingContact] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [paymentForm, setPaymentForm] = useState({ paymentDate: '', amountPaid: '', method: 'Cash', referenceNumber: '', notes: '' })
  const [paymentSubmitting, setPaymentSubmitting] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [paymentAmountError, setPaymentAmountError] = useState('')
  const [invoiceRemaining, setInvoiceRemaining] = useState(null)

  const getProjectStatusClass = (value) => {
    const normalized = String(value || 'Planning').toLowerCase().trim()
    return projectStatusStyles[normalized] || projectStatusStyles.default
  }

  const handlePaymentSave = async () => {
    if (!selectedInvoice) return
    // prevent duplicate submissions
    if (paymentSubmitting) return

    setPaymentError('')
    setPaymentSubmitting(true)
    try {
      // final validation before submit
      const amountNum = Number(paymentForm.amountPaid) || 0
      if (!paymentForm.paymentDate) {
        setPaymentError('Payment date is required')
        setPaymentSubmitting(false)
        return
      }
      if (amountNum <= 0) {
        setPaymentError('Amount must be greater than zero')
        setPaymentSubmitting(false)
        return
      }
      if (invoiceRemaining != null && amountNum > Number(invoiceRemaining)) {
        setPaymentError('Amount exceeds remaining invoice balance')
        setPaymentSubmitting(false)
        return
      }
      const body = {
        paymentDate: paymentForm.paymentDate,
        amountPaid: Number(paymentForm.amountPaid) || 0,
        method: paymentForm.method,
        referenceNumber: paymentForm.referenceNumber,
        notes: paymentForm.notes,
      }
      const res = await fetch(`/api/invoices/${selectedInvoice.id}/record-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const result = await res.json()
      if (!res.ok) {
        setPaymentError(result?.message || 'Failed to record payment')
        toast.error(result?.message || 'Failed to record payment')
      } else {
        setShowPaymentModal(false)
        setSelectedInvoice(null)
        // reload invoices and payment summary (always fetch fresh invoices)
        try {
          const invResp = await fetch(`/api/customers/${customerId}/invoices`)
          const invJson = await invResp.json()
          if (Array.isArray(invJson)) setInvoices(invJson)
        } catch (e) {
          // ignore
        }
        try {
          const response = await fetch(`/api/customers/${customerId}/payments`)
          const json = await response.json()
          if (json?.success) setPaymentsSummary(json.data || null)
        } catch (e) {
          // ignore
        }
        toast.success('Payment recorded successfully.')
      }
    } catch (err) {
      console.error('Failed to save payment', err)
      setPaymentError('Failed to save payment')
      toast.error('Failed to record payment')
    } finally {
      setPaymentSubmitting(false)
    }
  }

  const computeInvoiceRemaining = async (invoice) => {
    if (!invoice || !customerId) return null
    try {
      const resp = await fetch(`/api/customers/${customerId}/timeline`)
      const json = await resp.json()
      if (!json?.success) return Number(invoice.totalAmount || 0)
      const entries = Array.isArray(json.data) ? json.data : []
      let paid = 0
      for (const t of entries) {
        if (t.eventType !== 'Payment') continue
        try {
          const d = JSON.parse(t.description || '{}')
          if (d && d.invoiceId === invoice.id) paid += Number(d.amount || 0)
        } catch (e) {
          // ignore
        }
      }
      const remaining = Math.max(0, Number(invoice.totalAmount || 0) - paid)
      return remaining
    } catch (e) {
      return Number(invoice.totalAmount || 0)
    }
  }

  const paymentSummaryCards = useMemo(() => {
    const totalPaid = Number(paymentsSummary?.totalPaid || 0)
    const outstandingBalance = Number(paymentsSummary?.outstandingBalance || 0)
    const totalInvoices = Number(paymentsSummary?.totalInvoices || 0)
    const lastPaymentDate = paymentsSummary?.lastPaymentDate ? formatDate(paymentsSummary.lastPaymentDate) : '-'

    return [
      {
        title: 'Total Paid',
        value: formatCurrency(totalPaid),
        icon: CreditCard,
        color: 'green',
      },
      {
        title: 'Outstanding Balance',
        value: formatCurrency(outstandingBalance),
        icon: ReceiptText,
        color: 'orange',
      },
      {
        title: 'Total Invoices',
        value: totalInvoices.toLocaleString('en-IN'),
        icon: FileText,
        color: 'blue',
      },
      {
        title: 'Last Payment Date',
        value: lastPaymentDate,
        icon: CalendarDays,
        color: 'purple',
      },
    ]
  }, [paymentsSummary])

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

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {phoneAvailable ? (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await fetch(`/api/customers/${customerId}/contact-history`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ type: 'Phone Call', title: 'Phone call initiated', description: '' }),
                        })
                      } catch (e) {
                        console.error('Failed to log call', e)
                      }
                      window.location.href = `tel:${customer.phone}`
                    }}
                    aria-label="Call customer"
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <Phone className="h-4 w-4 text-gray-600" />
                    <span>Call</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    aria-label="Phone number not available"
                    title="Phone number not available"
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm font-semibold text-gray-700 opacity-50 cursor-not-allowed"
                  >
                    <Phone className="h-4 w-4 text-gray-600" />
                    <span>Call</span>
                  </button>
                )}

                {phoneAvailable ? (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await fetch(`/api/customers/${customerId}/contact-history`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ type: 'WhatsApp', title: 'WhatsApp opened', description: '' }),
                        })
                      } catch (e) {
                        console.error('Failed to log whatsapp', e)
                      }
                      window.open(`https://wa.me/${phoneDigits}`, '_blank')
                    }}
                    aria-label="Open WhatsApp chat"
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <MessageSquare className="h-4 w-4 text-gray-600" />
                    <span>WhatsApp</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    aria-label="Phone number not available"
                    title="Phone number not available"
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm font-semibold text-gray-700 opacity-50 cursor-not-allowed"
                  >
                    <MessageSquare className="h-4 w-4 text-gray-600" />
                    <span>WhatsApp</span>
                  </button>
                )}

                {emailAvailable ? (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await fetch(`/api/customers/${customerId}/contact-history`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ type: 'Email', title: 'Email started', description: '' }),
                        })
                      } catch (e) {
                        console.error('Failed to log email', e)
                      }
                      window.location.href = `mailto:${customer.email}`
                    }}
                    aria-label="Email customer"
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <Mail className="h-4 w-4 text-gray-600" />
                    <span>Email</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    aria-label="Email not available"
                    title="Email not available"
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm font-semibold text-gray-700 opacity-50 cursor-not-allowed"
                  >
                    <Mail className="h-4 w-4 text-gray-600" />
                    <span>Email</span>
                  </button>
                )}
              </div>
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
            ) : activeTab === 'contact-history' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Contact History</h2>
                    <p className="text-sm text-gray-600">Chronological history of communications and important interactions.</p>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowAddContactForm((s) => !s)}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add Contact Note
                    </button>
                  </div>
                </div>

                {showAddContactForm && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="grid gap-3 md:grid-cols-3">
                      <select value={newContactType} onChange={(e) => setNewContactType(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                        <option>Phone Call</option>
                        <option>WhatsApp</option>
                        <option>Email</option>
                        <option>Enquiry Created</option>
                        <option>Quotation Created</option>
                        <option>Invoice Created</option>
                        <option>Payment Recorded</option>
                        <option>Manual Note</option>
                      </select>
                      <input value={newContactTitle} onChange={(e) => setNewContactTitle(e.target.value)} placeholder="Title" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
                      <div className="flex items-center justify-end gap-2">
                        <button type="button" onClick={() => { setShowAddContactForm(false); setNewContactTitle(''); setNewContactDescription('') }} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700">Cancel</button>
                        <button type="button" onClick={submitContactNote} disabled={addingContact} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">{addingContact ? 'Saving…' : 'Save'}</button>
                      </div>
                    </div>
                    <div className="mt-3">
                      <textarea value={newContactDescription} onChange={(e) => setNewContactDescription(e.target.value)} placeholder="Description" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" rows={4} />
                    </div>
                  </div>
                )}

                {contactLoading ? (
                  <div className="flex items-center gap-2 text-gray-600"><Loader2 className="h-5 w-5 animate-spin text-emerald-600" /> Loading contact history...</div>
                ) : contactError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{contactError}</div>
                ) : contactHistory.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">No contact history available.</div>
                ) : (
                  <div className="space-y-4">
                    {contactHistory.map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {entry.type === 'Phone Call' && <Phone className="h-5 w-5 text-gray-600" />}
                            {entry.type === 'WhatsApp' && <MessageSquare className="h-5 w-5 text-gray-600" />}
                            {entry.type === 'Email' && <Mail className="h-5 w-5 text-gray-600" />}
                            {!['Phone Call','WhatsApp','Email'].includes(entry.type) && <Info className="h-5 w-5 text-gray-600" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-semibold text-gray-900">{entry.title || entry.type}</div>
                              <div className="text-xs text-gray-500">{new Date(entry.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                            {entry.description ? <p className="mt-2 text-sm text-gray-700">{entry.description}</p> : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === 'projects' ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Projects</h2>
                    <p className="text-sm text-gray-600">Projects linked to this customer.</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={() => router.push(`/admin/projects/create?customerId=${customerId}`)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add Project
                    </button>
                    <button
                      type="button"
                      onClick={() => loadProjects()}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </button>
                  </div>
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
                    <p className="text-lg font-semibold text-gray-900">No projects assigned to this customer.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {projects.map((project) => (
                      <div key={project.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{project.title || 'Untitled Project'}</h3>
                            <p className="mt-1 text-sm text-gray-600">{project.projectType || 'Project'}</p>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getProjectStatusClass(project.status)}`}>
                            {project.status || 'Planning'}
                          </span>
                        </div>
                        <div className="mt-4 space-y-2 text-sm text-gray-600">
                          <p><span className="font-medium text-gray-700">Start Date:</span> {formatDate(project.startDate)}</p>
                          <p><span className="font-medium text-gray-700">Estimated Budget:</span> {project.estimatedBudget || '-'}</p>
                        </div>
                        <div className="mt-5 flex items-center justify-end">
                          <Link href={`/admin/projects/${project.id}`} className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                            Open Project
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === 'quotations' ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Quotations</h2>
                    <p className="text-sm text-gray-600">Quotations linked to this customer.</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={() => router.push(`/admin/quotations/create?customerId=${customerId}`)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4" />
                      Create Quotation
                    </button>
                    <button
                      type="button"
                      onClick={() => loadQuotations()}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </button>
                  </div>
                </div>

                {quotationsLoading ? (
                  <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                      Loading quotations...
                    </div>
                  </div>
                ) : quotationsError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{quotationsError}</div>
                ) : quotations.length === 0 ? (
                  <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                    <p className="text-lg font-semibold text-gray-900">No quotations available for this customer.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {quotations.map((quotation) => (
                      <div key={quotation.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{quotation.quotationNumber || 'Untitled Quotation'}</h3>
                            <p className="mt-1 text-sm text-gray-600">{quotation.projectName || 'Quotation'}</p>
                          </div>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {quotation.status || 'Saved'}
                          </span>
                        </div>
                        <div className="mt-4 space-y-2 text-sm text-gray-600">
                          <p><span className="font-medium text-gray-700">Total Amount:</span> {quotation.grandTotal ? `₹${Number(quotation.grandTotal).toLocaleString('en-IN')}` : '-'}</p>
                          <p><span className="font-medium text-gray-700">Created Date:</span> {formatDate(quotation.createdAt)}</p>
                        </div>
                        <div className="mt-5 flex items-center justify-end">
                          <Link href={`/admin/quotations/${quotation.id}`} className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                            Open Quotation
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === 'invoices' ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Invoices</h2>
                    <p className="text-sm text-gray-600">Invoices linked to this customer.</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={() => router.push(`/admin/invoices/create?customerId=${customerId}`)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4" />
                      Create Invoice
                    </button>
                    <button
                      type="button"
                      onClick={() => loadInvoices()}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </button>
                  </div>
                </div>

                {invoicesLoading ? (
                  <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                      Loading invoices...
                    </div>
                  </div>
                ) : invoicesError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{invoicesError}</div>
                ) : invoices.length === 0 ? (
                  <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                    <p className="text-lg font-semibold text-gray-900">No invoices available for this customer.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {invoices.map((invoice) => (
                      <div key={invoice.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{invoice.invoiceNumber || 'Untitled Invoice'}</h3>
                            <p className="mt-1 text-sm text-gray-600">{invoice.status || 'Saved'}</p>
                          </div>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {invoice.status || 'Saved'}
                          </span>
                        </div>
                        <div className="mt-4 space-y-2 text-sm text-gray-600">
                          <p><span className="font-medium text-gray-700">Total Amount:</span> {invoice.totalAmount ? `₹${Number(invoice.totalAmount).toLocaleString('en-IN')}` : '-'}</p>
                          <p><span className="font-medium text-gray-700">Due Date:</span> {formatDate(invoice.dueDate)}</p>
                          <p><span className="font-medium text-gray-700">Created Date:</span> {formatDate(invoice.createdAt)}</p>
                        </div>
                        <div className="mt-5 flex items-center justify-end">
                          <Link href={`/admin/invoices/${invoice.id}`} className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                            Open Invoice
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === 'payments' ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Payment Summary</h2>
                  <p className="text-sm text-gray-600">A quick snapshot of invoices and payments for this customer.</p>
                </div>

                {paymentsSummaryLoading ? (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                    Loading payment summary...
                  </div>
                ) : paymentsSummaryError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{paymentsSummaryError}</div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {paymentSummaryCards.map((card) => (
                      <DashboardCard
                        key={card.title}
                        title={card.title}
                        value={card.value}
                        icon={card.icon}
                        color={card.color}
                      />
                    ))}
                  </div>
                )}

                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Customer Invoices</h3>
                      <p className="text-sm text-gray-600">All invoices for this customer.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => loadInvoices()}
                      className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Refresh
                    </button>
                  </div>

                  {invoicesLoading ? (
                    <div className="flex min-h-[160px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                        Loading invoices...
                      </div>
                    </div>
                  ) : invoicesError ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{invoicesError}</div>
                  ) : invoices.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                      <p className="text-sm font-semibold text-gray-900">No invoices found for this customer.</p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-gray-200">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Invoice Number</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Issue Date</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Due Date</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Total Amount</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {invoices.map((invoice) => (
                              <tr key={invoice.id}>
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{invoice.invoiceNumber || '-'}</td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{formatDate(invoice.createdAt)}</td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{formatDate(invoice.dueDate)}</td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{formatCurrency(invoice.totalAmount)}</td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{invoice.status || '-'}</td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                    <Link href={`/admin/invoices/${invoice.id}`} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                                      View Invoice
                                    </Link>
                                    <a
                                      href={`/api/invoices/${invoice.id}/pdf?download=1`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                                    >
                                      Download PDF
                                    </a>
                                    {invoice.status === 'Paid' ? (
                                      <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">Already Paid</span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          setSelectedInvoice(invoice)
                                          // compute remaining
                                          const remaining = await computeInvoiceRemaining(invoice)
                                          setInvoiceRemaining(remaining)
                                          setPaymentForm({
                                            paymentDate: new Date().toISOString().slice(0, 10),
                                            amountPaid: String(remaining > 0 ? remaining : invoice.totalAmount || 0),
                                            method: 'Cash',
                                            referenceNumber: '',
                                            notes: '',
                                          })
                                          setPaymentAmountError('')
                                          setPaymentError('')
                                          setShowPaymentModal(true)
                                        }}
                                        className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                                      >
                                        Record Payment
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
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
      {/* Payment modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowPaymentModal(false)} />
          <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">Record Payment</h3>
            <p className="mt-1 text-sm text-gray-600">Invoice: {selectedInvoice?.invoiceNumber || '-'}</p>
            <div className="mt-4 grid gap-3">
              <label className="text-sm text-gray-700">Payment Date</label>
              <input type="date" value={paymentForm.paymentDate} onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentDate: e.target.value }))} className="rounded-lg border border-gray-200 px-3 py-2" />

              <label className="text-sm text-gray-700">Amount Paid</label>
              <input
                type="number"
                value={paymentForm.amountPaid}
                onChange={(e) => {
                  const val = e.target.value
                  setPaymentForm(prev => ({ ...prev, amountPaid: val }))
                  // validate
                  const num = Number(val || 0)
                  if (Number.isNaN(num) || num <= 0) {
                    setPaymentAmountError('Amount must be greater than 0')
                  } else if (invoiceRemaining != null && num > Number(invoiceRemaining)) {
                    setPaymentAmountError('Amount cannot exceed remaining invoice balance')
                  } else {
                    setPaymentAmountError('')
                  }
                }}
                className="rounded-lg border border-gray-200 px-3 py-2"
              />
              {invoiceRemaining != null && (
                <div className="text-sm text-gray-600">Remaining balance: {formatCurrency(invoiceRemaining)}</div>
              )}
              {paymentAmountError ? <div className="text-sm text-red-600">{paymentAmountError}</div> : null}

              <label className="text-sm text-gray-700">Payment Method</label>
              <select value={paymentForm.method} onChange={(e) => setPaymentForm(prev => ({ ...prev, method: e.target.value }))} className="rounded-lg border border-gray-200 px-3 py-2">
                <option>Cash</option>
                <option>UPI</option>
                <option>Bank Transfer</option>
                <option>Cheque</option>
              </select>

              <label className="text-sm text-gray-700">Reference Number (optional)</label>
              <input type="text" value={paymentForm.referenceNumber} onChange={(e) => setPaymentForm(prev => ({ ...prev, referenceNumber: e.target.value }))} className="rounded-lg border border-gray-200 px-3 py-2" />

              <label className="text-sm text-gray-700">Notes (optional)</label>
              <textarea value={paymentForm.notes} onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))} className="rounded-lg border border-gray-200 px-3 py-2" rows={3} />

              {paymentError ? <div className="text-sm text-red-600">{paymentError}</div> : null}

              <div className="mt-2 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700">Cancel</button>
                <button
                  type="button"
                  onClick={handlePaymentSave}
                  disabled={paymentSubmitting || Boolean(paymentAmountError) || !paymentForm.paymentDate}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold text-white ${paymentSubmitting ? 'bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                >
                  {paymentSubmitting ? <Loader2 className="inline-block h-4 w-4 animate-spin" /> : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toaster />

    </AdminLayout>
  )
}

