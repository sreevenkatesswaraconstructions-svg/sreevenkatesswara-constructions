import { useState } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';
import Table from '../../components/admin/Table';
import Modal from '../../components/admin/Modal';
import Form from '../../components/admin/Form';
import { Plus, Edit, Trash2, Layers, DollarSign, Clock } from 'lucide-react';

export default function ServicesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [viewMode, setViewMode] = useState(false);

  const services = [
    {
      id: 1,
      name: 'Residential Construction',
      description: 'Complete home construction services from foundation to finishing.',
      price: 'Starting from ₹25L',
      duration: '6-12 months',
      status: 'active',
      featured: true,
    },
    {
      id: 2,
      name: 'Interior Design',
      description: 'Professional interior design services for homes and offices.',
      price: 'Starting from ₹5L',
      duration: '2-4 months',
      status: 'active',
      featured: true,
    },
    {
      id: 3,
      name: 'Commercial Construction',
      description: 'Commercial building construction for offices, retail, and industrial spaces.',
      price: 'Custom Quote',
      duration: '12-24 months',
      status: 'active',
      featured: false,
    },
    {
      id: 4,
      name: 'Renovation Services',
      description: 'Complete renovation services for kitchens, bathrooms, and entire properties.',
      price: 'Starting from ₹3L',
      duration: '1-3 months',
      status: 'active',
      featured: false,
    },
    {
      id: 5,
      name: 'Landscape Design',
      description: 'Professional landscape design and outdoor space planning.',
      price: 'Starting from ₹2L',
      duration: '1-2 months',
      status: 'inactive',
      featured: false,
    },
  ];

  const columns = [
    { key: 'name', label: 'Service Name', sortable: true },
    { key: 'description', label: 'Description', sortable: false },
    { key: 'price', label: 'Price', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (status) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            status === 'active'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      ),
    },
    {
      key: 'featured',
      label: 'Featured',
      sortable: true,
      render: (featured) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            featured
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          {featured ? 'Yes' : 'No'}
        </span>
      ),
    },
  ];

  const handleViewService = (service) => {
    setSelectedService(service);
    setViewMode(true);
    setIsModalOpen(true);
  };

  const handleNewService = () => {
    setSelectedService(null);
    setViewMode(false);
    setIsModalOpen(true);
  };

  const formFields = [
    { name: 'name', label: 'Service Name', type: 'text', required: true, placeholder: 'Enter service name' },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      required: true,
      placeholder: 'Enter service description',
      rows: 4,
    },
    { name: 'price', label: 'Price', type: 'text', required: true, placeholder: 'Enter price' },
    { name: 'duration', label: 'Duration', type: 'text', required: true, placeholder: 'Enter duration' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
    {
      name: 'featured',
      label: 'Featured Service',
      type: 'checkbox',
      checkboxLabel: 'Mark as featured service',
    },
    { name: 'image', label: 'Service Image', type: 'file' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
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
            onClick={handleNewService}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Service
          </motion.button>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          data={services}
          onRowClick={handleViewService}
          pagination
          searchable
          filterable
        />

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={viewMode ? 'Service Details' : 'Add New Service'}
          size="lg"
        >
          {viewMode && selectedService ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {selectedService.name}
                </h2>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedService.status === 'active'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {selectedService.status.charAt(0).toUpperCase() + selectedService.status.slice(1)}
                  </span>
                  {selectedService.featured && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                      Featured
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Price</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedService.price}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedService.duration}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Description</h3>
                <p className="text-gray-600 dark:text-gray-400">{selectedService.description}</p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  <Edit className="w-4 h-4" />
                  Edit Service
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                  Delete Service
                </button>
              </div>
            </div>
          ) : (
            <Form
              fields={formFields}
              onSubmit={(data) => {
                console.log('New service:', data);
                setIsModalOpen(false);
              }}
              submitText="Create Service"
            />
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
