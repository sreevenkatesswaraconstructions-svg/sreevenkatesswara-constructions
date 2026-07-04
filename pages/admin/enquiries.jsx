import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/admin/AdminLayout';
import Table from '../../components/admin/Table';
import Modal from '../../components/admin/Modal';
import Form from '../../components/admin/Form';
import { Plus, Eye, Check, X, Mail, Phone, Calendar, Download, FileSpreadsheet, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EnquiriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Make this page dynamic to avoid static generation issues
  EnquiriesPage.getInitialProps = () => ({})
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [viewMode, setViewMode] = useState(false);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated') {
      fetchEnquiries();
    }
  }, [status, router, filterStatus]);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const query = filterStatus ? `?status=${filterStatus}` : '';
      const response = await fetch(`/api/enquiries${query}`);
      const data = await response.json();
      setEnquiries(data);
    } catch (error) {
      toast.error('Failed to fetch enquiries');
      console.error('Error fetching enquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const query = filterStatus ? `?format=${format}&status=${filterStatus}` : `?format=${format}`;
      const response = await fetch(`/api/enquiries/export${query}`);
      
      if (format === 'excel') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `enquiries-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Exported to Excel successfully');
      } else if (format === 'pdf') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `enquiries-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Exported to PDF successfully');
      }
    } catch (error) {
      toast.error('Export failed');
      console.error('Export error:', error);
    }
  };

  const handleStatusUpdate = async (enquiryId, newStatus) => {
    try {
      const response = await fetch(`/api/enquiries/${enquiryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success('Status updated successfully');
        fetchEnquiries();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update status');
      console.error('Error updating status:', error);
    }
  };

  const handleDeleteEnquiry = async (enquiryId) => {
    if (!confirm('Are you sure you want to delete this enquiry?')) return;

    try {
      const response = await fetch(`/api/enquiries/${enquiryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Enquiry deleted successfully');
        fetchEnquiries();
        setIsModalOpen(false);
      } else {
        toast.error('Failed to delete enquiry');
      }
    } catch (error) {
      toast.error('Failed to delete enquiry');
      console.error('Error deleting enquiry:', error);
    }
  };

  const columns = [
    { key: 'customerName', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'service', label: 'Service', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (status) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            status === 'COMPLETED'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : status === 'IN_PROGRESS'
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
          }`}
        >
          {status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
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

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </AdminLayout>
    );
  }

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
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONTACTED">Contacted</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CLOSED">Closed</option>
            </select>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleExport('excel')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              <FileSpreadsheet className="w-5 h-5" />
              Export Excel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              <FileText className="w-5 h-5" />
              Export PDF
            </motion.button>
          </div>
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
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Service</h3>
                <p className="text-gray-600 dark:text-gray-400">{selectedEnquiry.service}</p>
              </div>

              {selectedEnquiry.budget && (
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Budget</h3>
                  <p className="text-gray-600 dark:text-gray-400">{selectedEnquiry.budget}</p>
                </div>
              )}

              {selectedEnquiry.location && (
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Location</h3>
                  <p className="text-gray-600 dark:text-gray-400">{selectedEnquiry.location}</p>
                </div>
              )}

              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Message</h3>
                <p className="text-gray-600 dark:text-gray-400">{selectedEnquiry.message}</p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleStatusUpdate(selectedEnquiry.id, 'COMPLETED')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Mark as Completed
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedEnquiry.id, 'IN_PROGRESS')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Mark as In Progress
                </button>
                <button
                  onClick={() => handleDeleteEnquiry(selectedEnquiry.id)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                Use the contact form on the website to submit new enquiries.
              </p>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps = async (context) => {
  return {
    props: {}, // will be passed to the page component as props
  }
}
