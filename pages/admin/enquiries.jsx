import { useState } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';
import Table from '../../components/admin/Table';
import Modal from '../../components/admin/Modal';
import Form from '../../components/admin/Form';
import { Plus, Eye, Check, X, Mail, Phone, Calendar } from 'lucide-react';

export default function EnquiriesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [viewMode, setViewMode] = useState(false);

  const enquiries = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+91 98765 43210',
      subject: 'Residential Construction',
      message: 'Looking for a complete home construction project in Chennai.',
      status: 'pending',
      createdAt: '2024-01-15',
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+91 87654 32109',
      subject: 'Interior Design',
      message: 'Need interior design services for my new office space.',
      status: 'in-progress',
      createdAt: '2024-01-14',
    },
    {
      id: 3,
      name: 'Robert Johnson',
      email: 'robert@example.com',
      phone: '+91 76543 21098',
      subject: 'Renovation',
      message: 'Kitchen and bathroom renovation required.',
      status: 'completed',
      createdAt: '2024-01-13',
    },
    {
      id: 4,
      name: 'Emily Davis',
      email: 'emily@example.com',
      phone: '+91 65432 10987',
      subject: 'Commercial Construction',
      message: 'Planning to build a commercial complex.',
      status: 'pending',
      createdAt: '2024-01-12',
    },
    {
      id: 5,
      name: 'Michael Wilson',
      email: 'michael@example.com',
      phone: '+91 54321 09876',
      subject: 'Consultation',
      message: 'Would like to schedule a consultation for a new project.',
      status: 'in-progress',
      createdAt: '2024-01-11',
    },
  ];

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'subject', label: 'Subject', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (status) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            status === 'completed'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : status === 'in-progress'
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
          }`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (date) => new Date(date).toLocaleDateString(),
    },
  ];

  const handleViewEnquiry = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setViewMode(true);
    setIsModalOpen(true);
  };

  const handleNewEnquiry = () => {
    setSelectedEnquiry(null);
    setViewMode(false);
    setIsModalOpen(true);
  };

  const formFields = [
    { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Enter name' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'Enter email' },
    { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: 'Enter phone number' },
    { name: 'subject', label: 'Subject', type: 'text', required: true, placeholder: 'Enter subject' },
    {
      name: 'message',
      label: 'Message',
      type: 'textarea',
      required: true,
      placeholder: 'Enter message',
      rows: 4,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Enquiries</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage customer enquiries and requests
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNewEnquiry}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Enquiry
          </motion.button>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          data={enquiries}
          onRowClick={handleViewEnquiry}
          pagination
          searchable
          filterable
        />

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={viewMode ? 'Enquiry Details' : 'Add New Enquiry'}
          size="lg"
        >
          {viewMode && selectedEnquiry ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <Mail className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedEnquiry.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <Phone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedEnquiry.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(selectedEnquiry.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <Eye className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedEnquiry.status.charAt(0).toUpperCase() + selectedEnquiry.status.slice(1)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Subject</h3>
                <p className="text-gray-600 dark:text-gray-400">{selectedEnquiry.subject}</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Message</h3>
                <p className="text-gray-600 dark:text-gray-400">{selectedEnquiry.message}</p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
                  <Check className="w-4 h-4" />
                  Mark as Completed
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  <Mail className="w-4 h-4" />
                  Send Reply
                </button>
              </div>
            </div>
          ) : (
            <Form
              fields={formFields}
              onSubmit={(data) => {
                console.log('New enquiry:', data);
                setIsModalOpen(false);
              }}
              submitText="Submit Enquiry"
            />
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
