import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AdminLayout from '../../components/admin/AdminLayout'
import ServiceCard from '../../components/admin/ServiceCard'
import ServiceTable from '../../components/admin/ServiceTable'
import ServiceForm from '../../components/admin/ServiceForm'
import { Plus, Layers, Search, Filter, X, Loader2, CheckCircle, AlertCircle, Grid, List } from 'lucide-react'

export default function ServicesPage() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [featuredFilter, setFeaturedFilter] = useState('all')
  const [viewMode, setViewMode] = useState('card')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('view')
  const [selectedService, setSelectedService] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalOpenCounter, setModalOpenCounter] = useState(0)
  
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/services')
      const result = await response.json()
      
      if (result.success) {
        setServices(result.data || [])
      } else {
        setError(result.message || 'Failed to fetch services')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('[SERVICES] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateService = async (data) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        closeModal()
        fetchServices()
        showToast('Service created successfully!', 'success')
      } else {
        showToast(result.message || 'Failed to create service', 'error')
      }
    } catch (err) {
      showToast('Error creating service. Please try again.', 'error')
      console.error('[SERVICES] Create error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateService = async (data) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/services/${selectedService.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, id: selectedService.id }),
      })

      const result = await response.json()

      if (result.success) {
        closeModal()
        fetchServices()
        showToast('Service updated successfully!', 'success')
      } else {
        showToast(result.message || 'Failed to update service', 'error')
      }
    } catch (err) {
      showToast('Error updating service. Please try again.', 'error')
      console.error('[SERVICES] Update error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteService = async (serviceId) => {
    if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        closeModal()
        fetchServices()
        showToast('Service deleted successfully!', 'success')
      } else {
        showToast(result.message || 'Failed to delete service', 'error')
      }
    } catch (err) {
      showToast('Error deleting service. Please try again.', 'error')
      console.error('[SERVICES] Delete error:', err)
    }
  }

  const openCreateModal = () => {
    setModalMode('create')
    setSelectedService(null)
    setModalOpenCounter(prev => prev + 1)
    setIsModalOpen(true)
  }

  const openViewModal = (service) => {
    setModalMode('view')
    setSelectedService(service)
    setModalOpenCounter(prev => prev + 1)
    setIsModalOpen(true)
  }

  const openEditModal = (service) => {
    setModalMode('edit')
    setSelectedService(service)
    setModalOpenCounter(prev => prev + 1)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setModalMode('view')
    setSelectedService(null)
  }

  const filteredServices = services.filter(service => {
    const matchesSearch = service.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.slug.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || service.status === statusFilter
    const matchesFeatured = featuredFilter === 'all' ||
                         (featuredFilter === 'true' && service.featured) ||
                         (featuredFilter === 'false' && !service.featured)
    return matchesSearch && matchesStatus && matchesFeatured
  })

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
          <button onClick={fetchServices} className="px-4 py-2 bg-emerald-600 text-white rounded-lg">
            Retry
          </button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Services</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage services offered by the company
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openCreateModal}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Service
          </motion.button>
        </div>

        <div className="flex flex-wrap gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <select
            value={featuredFilter}
            onChange={(e) => setFeaturedFilter(e.target.value)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All</option>
            <option value="true">Featured</option>
            <option value="false">Not Featured</option>
          </select>
          <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-700 pl-4">
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'card' 
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'table' 
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {filteredServices.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {services.length === 0 ? 'No services yet. Create your first service!' : 'No services match your filters.'}
            </p>
          </div>
        ) : viewMode === 'card' ? (
          <div className="grid gap-4">
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onView={openViewModal}
                onEdit={openEditModal}
                onDelete={handleDeleteService}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <ServiceTable
              services={filteredServices}
              onView={openViewModal}
              onEdit={openEditModal}
              onDelete={handleDeleteService}
            />
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {modalMode === 'view' ? 'Service Details' : modalMode === 'create' ? 'Create Service' : 'Edit Service'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {modalMode === 'view' && selectedService ? (
                  <div className="space-y-6">
                    {selectedService.image && (
                      <img
                        src={selectedService.image}
                        alt={selectedService.serviceName}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {selectedService.serviceName}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>{selectedService.slug}</span>
                        <span>•</span>
                        <span>{new Date(selectedService.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {selectedService.shortDescription && (
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Short Description</h4>
                        <p className="text-gray-600 dark:text-gray-400">{selectedService.shortDescription}</p>
                      </div>
                    )}
                    {selectedService.detailedDescription && (
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Detailed Description</h4>
                        <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{selectedService.detailedDescription}</p>
                      </div>
                    )}
                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => openEditModal(selectedService)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        Edit Service
                      </button>
                      <button
                        onClick={() => handleDeleteService(selectedService.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        Delete Service
                      </button>
                    </div>
                  </div>
                ) : (
                  <ServiceForm
                    key={modalOpenCounter}
                    initialData={selectedService}
                    onSubmit={modalMode === 'create' ? handleCreateService : handleUpdateService}
                    submitText={modalMode === 'create' ? 'Create Service' : 'Update Service'}
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}

        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 50, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 50, x: '-50%' }}
              className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 ${
                toast.type === 'success' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-red-600 text-white'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  )
}
