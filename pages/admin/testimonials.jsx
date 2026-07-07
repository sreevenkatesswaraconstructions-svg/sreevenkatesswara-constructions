import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { toast, Toaster } from 'react-hot-toast'
import AdminLayout from '../../components/admin/AdminLayout'
import Modal from '../../components/admin/Modal'
import {
  Plus,
  Search,
  Filter,
  Loader2,
  MessageSquare,
  Sparkles,
  Clock3,
  Star,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  Pin,
  PinOff,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const emptyForm = {
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  customerLocation: '',
  customerRole: '',
  reviewMessage: '',
  rating: '',
  customerPhoto: '',
  displayOrder: '',
  status: 'Pending',
  isFeatured: false
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTestimonial, setEditingTestimonial] = useState(null)
  const [formValues, setFormValues] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const pageSize = 8

  useEffect(() => {
    fetchTestimonials()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter])

  const fetchTestimonials = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/testimonials')
      const result = await response.json()

      if (result.success) {
        setTestimonials(result.data || [])
      } else {
        setError(result.message || 'Failed to fetch testimonials')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('[TESTIMONIALS] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingTestimonial(null)
    setFormValues(emptyForm)
    setFormErrors({})
    setIsModalOpen(true)
  }

  const openEditModal = (testimonial) => {
    setEditingTestimonial(testimonial)
    setFormValues({
      customerName: testimonial.customerName || '',
      customerEmail: testimonial.customerEmail || '',
      customerPhone: testimonial.customerPhone || '',
      customerLocation: testimonial.customerLocation || '',
      customerRole: testimonial.customerRole || '',
      reviewMessage: testimonial.reviewMessage || '',
      rating: testimonial.rating?.toString() || '',
      customerPhoto: testimonial.customerPhoto || '',
      displayOrder: testimonial.displayOrder?.toString() || '',
      status: testimonial.status || 'Pending',
      isFeatured: Boolean(testimonial.isFeatured)
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target

    setFormValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!formValues.customerName.trim()) {
      errors.customerName = 'Customer name is required'
    }

    if (!formValues.customerLocation.trim()) {
      errors.customerLocation = 'Location is required'
    }

    if (!formValues.customerRole.trim()) {
      errors.customerRole = 'Role is required'
    }

    if (!formValues.reviewMessage.trim()) {
      errors.reviewMessage = 'Review message is required'
    }

    if (!formValues.rating) {
      errors.rating = 'Rating is required'
    } else {
      const ratingValue = Number(formValues.rating)
      if (Number.isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
        errors.rating = 'Rating must be between 1 and 5'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setSubmitting(true)

    try {
      const payload = {
        ...formValues,
        rating: Number(formValues.rating) || 0,
        displayOrder: Number(formValues.displayOrder) || 0,
        isFeatured: Boolean(formValues.isFeatured)
      }

      const url = editingTestimonial ? `/api/testimonials/${editingTestimonial.id}` : '/api/testimonials'
      const method = editingTestimonial ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to save testimonial')
      }

      toast.success(editingTestimonial ? 'Testimonial updated' : 'Testimonial created')
      setIsModalOpen(false)
      setEditingTestimonial(null)
      setFormValues(emptyForm)
      await fetchTestimonials()
    } catch (err) {
      toast.error(err.message || 'Unable to save testimonial')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (testimonial) => {
    if (!window.confirm(`Delete testimonial from ${testimonial.customerName}?`)) return

    try {
      const response = await fetch(`/api/testimonials/${testimonial.id}`, { method: 'DELETE' })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to delete testimonial')
      }

      toast.success('Testimonial deleted')
      await fetchTestimonials()
    } catch (err) {
      toast.error(err.message || 'Unable to delete testimonial')
    }
  }

  const updateStatus = async (testimonial, newStatus) => {
    try {
      const response = await fetch(`/api/testimonials/${testimonial.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to update testimonial')
      }

      toast.success(`Testimonial ${newStatus.toLowerCase()}`)
      await fetchTestimonials()
    } catch (err) {
      toast.error(err.message || 'Unable to update testimonial')
    }
  }

  const toggleFeatured = async (testimonial) => {
    try {
      const response = await fetch(`/api/testimonials/${testimonial.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !testimonial.isFeatured })
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to update featured status')
      }

      toast.success(testimonial.isFeatured ? 'Featured removed' : 'Marked as featured')
      await fetchTestimonials()
    } catch (err) {
      toast.error(err.message || 'Unable to update featured status')
    }
  }

  const filteredTestimonials = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()

    return testimonials.filter((testimonial) => {
      const matchesSearch = !query || [
        testimonial.customerName,
        testimonial.customerLocation,
        testimonial.customerRole
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)

      const matchesFilter = statusFilter === 'all'
        ? true
        : statusFilter === 'Featured'
          ? testimonial.isFeatured
          : testimonial.status === statusFilter

      return matchesSearch && matchesFilter
    })
  }, [searchQuery, statusFilter, testimonials])

  const totalPages = Math.max(1, Math.ceil(filteredTestimonials.length / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const paginatedTestimonials = filteredTestimonials.slice(startIndex, startIndex + pageSize)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchTestimonials} className="px-4 py-2 bg-emerald-600 text-white rounded-lg">
            Retry
          </button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Testimonials</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage customer reviews and testimonial visibility from here.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openCreateModal}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Testimonial
          </motion.button>
        </div>

        <div className="flex flex-wrap gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex-1 min-w-[220px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, location or role"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Featured">Featured</option>
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-4">
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">Management panel</span>
          </div>

          {filteredTestimonials.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-full">
                  <Sparkles className="w-8 h-8 text-emerald-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No testimonials match your filters</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Try a new search term or add a fresh testimonial from the button above.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">Photo</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">Customer Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">Rating</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">Featured</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">Created Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedTestimonials.map((testimonial) => (
                      <tr key={testimonial.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                        <td className="px-4 py-4 whitespace-nowrap">
                          {testimonial.customerPhoto ? (
                            <img
                              src={testimonial.customerPhoto}
                              alt={testimonial.customerName}
                              className="h-12 w-12 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                              <ImageIcon className="h-5 w-5" />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {testimonial.customerName}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {testimonial.customerRole}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {testimonial.customerLocation}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, index) => (
                              <Star
                                key={index}
                                className={`h-4 w-4 ${index < testimonial.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                              />
                            ))}
                            <span className="ml-1">{testimonial.rating}/5</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            testimonial.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                              : testimonial.status === 'Rejected'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                          }`}>
                            {testimonial.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          {testimonial.isFeatured ? (
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                              Yes
                            </span>
                          ) : (
                            <span className="text-gray-500">No</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center gap-2">
                            <Clock3 className="h-4 w-4" />
                            {new Date(testimonial.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => openEditModal(testimonial)}
                              className="rounded-lg border border-gray-200 p-2 text-gray-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-emerald-900/20"
                              title="Edit"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(testimonial)}
                              className="rounded-lg border border-gray-200 p-2 text-gray-600 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-rose-900/20"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            {testimonial.status !== 'Approved' && (
                              <button
                                onClick={() => updateStatus(testimonial, 'Approved')}
                                className="rounded-lg border border-gray-200 p-2 text-gray-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-emerald-900/20"
                                title="Approve"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                            )}
                            {testimonial.status !== 'Rejected' && (
                              <button
                                onClick={() => updateStatus(testimonial, 'Rejected')}
                                className="rounded-lg border border-gray-200 p-2 text-gray-600 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-rose-900/20"
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => toggleFeatured(testimonial)}
                              className="rounded-lg border border-gray-200 p-2 text-gray-600 transition-colors hover:bg-amber-50 hover:text-amber-700 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-amber-900/20"
                              title={testimonial.isFeatured ? 'Remove Featured' : 'Mark as Featured'}
                            >
                              {testimonial.isFeatured ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredTestimonials.length > pageSize && (
                <div className="mt-6 flex flex-col gap-3 border-t border-gray-200 pt-4 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300 sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredTestimonials.length)} of {filteredTestimonials.length} testimonials
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
                      disabled={currentPage === 1}
                      className="rounded-lg border border-gray-300 p-2 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`rounded-lg px-3 py-2 transition-colors ${
                          currentPage === page
                            ? 'bg-emerald-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-lg border border-gray-300 p-2 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTestimonial ? 'Edit Testimonial' : 'Add Testimonial'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customerName"
                value={formValues.customerName}
                onChange={handleInputChange}
                className={`w-full rounded-lg border px-4 py-3 ${formErrors.customerName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              />
              {formErrors.customerName && <p className="mt-1 text-sm text-red-500">{formErrors.customerName}</p>}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Customer Email</label>
              <input
                type="email"
                name="customerEmail"
                value={formValues.customerEmail}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Customer Phone</label>
              <input
                type="tel"
                name="customerPhone"
                value={formValues.customerPhone}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Customer Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customerLocation"
                value={formValues.customerLocation}
                onChange={handleInputChange}
                className={`w-full rounded-lg border px-4 py-3 ${formErrors.customerLocation ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              />
              {formErrors.customerLocation && <p className="mt-1 text-sm text-red-500">{formErrors.customerLocation}</p>}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Customer Role <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customerRole"
                value={formValues.customerRole}
                onChange={handleInputChange}
                className={`w-full rounded-lg border px-4 py-3 ${formErrors.customerRole ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              />
              {formErrors.customerRole && <p className="mt-1 text-sm text-red-500">{formErrors.customerRole}</p>}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Rating <span className="text-red-500">*</span>
              </label>
              <select
                name="rating"
                value={formValues.rating}
                onChange={handleInputChange}
                className={`w-full rounded-lg border px-4 py-3 ${formErrors.rating ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              >
                <option value="">Select rating</option>
                <option value="1">1 Star</option>
                <option value="2">2 Stars</option>
                <option value="3">3 Stars</option>
                <option value="4">4 Stars</option>
                <option value="5">5 Stars</option>
              </select>
              {formErrors.rating && <p className="mt-1 text-sm text-red-500">{formErrors.rating}</p>}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Customer Photo</label>
              <input
                type="text"
                name="customerPhoto"
                value={formValues.customerPhoto}
                onChange={handleInputChange}
                placeholder="https://example.com/photo.jpg"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Display Order</label>
              <input
                type="number"
                name="displayOrder"
                value={formValues.displayOrder}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <select
                name="status"
                value={formValues.status}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Featured</label>
              <select
                name="isFeatured"
                value={formValues.isFeatured ? 'yes' : 'no'}
                onChange={(e) => setFormValues((prev) => ({ ...prev, isFeatured: e.target.value === 'yes' }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Review Message <span className="text-red-500">*</span>
            </label>
            <textarea
              name="reviewMessage"
              value={formValues.reviewMessage}
              onChange={handleInputChange}
              rows={5}
              className={`w-full rounded-lg border px-4 py-3 ${formErrors.reviewMessage ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none`}
            />
            {formErrors.reviewMessage && <p className="mt-1 text-sm text-red-500">{formErrors.reviewMessage}</p>}
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingTestimonial ? 'Update Testimonial' : 'Create Testimonial'}
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  )
}
