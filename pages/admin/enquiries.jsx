import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/admin/AdminLayout';
import Table from '../../components/admin/Table';
import Modal from '../../components/admin/Modal';
import Form from '../../components/admin/Form';
import { Plus, Eye, Check, X, Mail, Phone, Calendar, Download, FileSpreadsheet, FileText, Sparkles, Edit3, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { normalizeEnquiryStatus, normalizeEnquirySource, normalizeEnquiryCreatedBy, getEnquiryStatusClasses, getEnquiryStatusOptions } from '../../lib/enquiryUtils';

export default function EnquiriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [viewMode, setViewMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [timelineEnquiry, setTimelineEnquiry] = useState(null);
  const [timelineItems, setTimelineItems] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

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
      
      // Only Excel export supported
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
        body: JSON.stringify({
          status: newStatus,
          performedBy: session?.user?.name || session?.user?.email || 'Admin',
        }),
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

  const handleEditEnquiry = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setViewMode(true);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleCreateQuotation = (enquiry) => {
    if (!enquiry?.id) return;
    router.push(`/admin/quotations/create?enquiryId=${encodeURIComponent(enquiry.id)}`);
  };

  const handleConvertToCustomer = async (enquiry) => {
    if (!enquiry?.id) return;

    try {
      const response = await fetch(`/api/enquiries/${enquiry.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          performedBy: session?.user?.name || session?.user?.email || 'Admin',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Unable to convert enquiry to customer');
      }

      toast.success('Enquiry converted to customer successfully');
      fetchEnquiries();
    } catch (error) {
      toast.error(error.message || 'Failed to convert enquiry to customer');
      console.error('Failed to convert enquiry to customer:', error);
    }
  };

  const handleEditEnquirySubmit = async (formData) => {
    try {
      const response = await fetch(`/api/enquiries/${selectedEnquiry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          notes: formData.notes,
          message: formData.notes || formData.message || '',
          performedBy: session?.user?.name || session?.user?.email || 'Admin',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to update enquiry');
      }

      toast.success('Enquiry updated successfully');
      setIsModalOpen(false);
      setSelectedEnquiry(null);
      setIsEditMode(false);
      fetchEnquiries();
    } catch (error) {
      toast.error(error.message || 'Failed to update enquiry');
      console.error('Failed to update enquiry:', error);
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
        setSelectedEnquiry(null);
        setIsEditMode(false);
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
    { key: 'email', label: 'Email', sortable: true, render: (email) => email || '—' },
    { key: 'service', label: 'Service', sortable: true },
    {
      key: 'source',
      label: 'Source',
      sortable: true,
      render: (source, row) => normalizeEnquirySource(source || row?.source || 'Website')
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (status) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEnquiryStatusClasses(status)}`}>
          {normalizeEnquiryStatus(status)}
        </span>
      ),
    },
    {
      key: 'createdBy',
      label: 'Created By',
      sortable: true,
      render: (createdBy, row) => normalizeEnquiryCreatedBy(createdBy || row?.createdBy)
    },
    {
      key: 'followUpDate',
      label: 'Next Follow-up',
      sortable: true,
      render: (date) => date ? new Date(date).toLocaleDateString() : '—',
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
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleNewEnquiry = () => {
    setSelectedEnquiry(null);
    setViewMode(false);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleViewTimeline = async (enquiry) => {
    setTimelineEnquiry(enquiry);
    setIsTimelineModalOpen(true);
    setTimelineLoading(true);
    setTimelineItems([]);

    try {
      const response = await fetch(`/api/enquiries/${enquiry.id}`);
      const data = await response.json();
      setTimelineItems(data?.activities || []);
    } catch (error) {
      toast.error('Failed to load enquiry timeline');
      console.error('Failed to load enquiry timeline:', error);
    } finally {
      setTimelineLoading(false);
    }
  };

  const handleManualEnquirySubmit = async (formData) => {
    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          createdBy: 'Admin',
          source: formData.enquirySource || 'Website',
          status: formData.status || 'New',
          message: formData.notes || formData.message || '',
          performedBy: session?.user?.name || session?.user?.email || 'Admin',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to create enquiry');
      }

      toast.success('Manual enquiry created successfully');
      setIsModalOpen(false);
      fetchEnquiries();
    } catch (error) {
      toast.error(error.message || 'Failed to create enquiry');
      console.error('Failed to create manual enquiry:', error);
    }
  };

  const serviceOptions = [
    { value: 'New Construction', label: 'New Construction' },
    { value: 'Villa Construction', label: 'Villa Construction' },
    { value: 'Interior Design', label: 'Interior Design' },
    { value: 'Renovation', label: 'Renovation' },
    { value: 'Flooring', label: 'Flooring' },
    { value: 'Modular Kitchen', label: 'Modular Kitchen' },
    { value: 'Commercial Construction', label: 'Commercial Construction' },
    { value: 'Other', label: 'Other' },
  ];

  const enquirySourceOptions = [
    { value: 'Website', label: 'Website' },
    { value: 'Walk-in', label: 'Walk-in' },
    { value: 'Phone Call', label: 'Phone Call' },
    { value: 'WhatsApp', label: 'WhatsApp' },
    { value: 'Instagram', label: 'Instagram' },
    { value: 'Facebook', label: 'Facebook' },
    { value: 'Google', label: 'Google' },
    { value: 'Reference', label: 'Reference' },
    { value: 'Existing Customer', label: 'Existing Customer' },
    { value: 'Architect', label: 'Architect' },
    { value: 'Builder', label: 'Builder' },
    { value: 'Corporate', label: 'Corporate' },
    { value: 'Other', label: 'Other' },
  ];

  const manualEnquiryFields = [
    { name: 'customerName', label: 'Customer Name', type: 'text', required: true, placeholder: 'Enter customer name' },
    { name: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: 'Enter phone number' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'Enter email address' },
    { name: 'location', label: 'Location', type: 'text', placeholder: 'Enter location' },
    {
      name: 'service',
      label: 'Interested Service',
      type: 'select',
      required: true,
      options: serviceOptions,
    },
    {
      name: 'enquirySource',
      label: 'Enquiry Source',
      type: 'select',
      required: true,
      options: enquirySourceOptions,
    },
    { name: 'budget', label: 'Budget', type: 'text', placeholder: 'Enter budget' },
    { name: 'status', label: 'Status', type: 'select', required: true, options: getEnquiryStatusOptions() },
    { name: 'followUpDate', label: 'Follow-up Date', type: 'date' },
    { name: 'followUpTime', label: 'Follow-up Time', type: 'time' },
    { name: 'followUpNotes', label: 'Follow-up Notes', type: 'textarea', placeholder: 'Add follow-up notes', rows: 3 },
    { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Add notes for this enquiry', rows: 4 },
  ];

  const editEnquiryFields = [
    { name: 'customerName', label: 'Customer Name', type: 'text', required: true, placeholder: 'Enter customer name' },
    { name: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: 'Enter phone number' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'Enter email address' },
    { name: 'location', label: 'Location', type: 'text', placeholder: 'Enter location' },
    {
      name: 'service',
      label: 'Interested Service',
      type: 'select',
      required: true,
      options: serviceOptions,
    },
    { name: 'budget', label: 'Budget', type: 'text', placeholder: 'Enter budget' },
    {
      name: 'source',
      label: 'Source',
      type: 'select',
      required: true,
      options: enquirySourceOptions,
    },
    { name: 'status', label: 'Status', type: 'select', required: true, options: getEnquiryStatusOptions() },
    { name: 'followUpDate', label: 'Follow-up Date', type: 'date' },
    { name: 'followUpTime', label: 'Follow-up Time', type: 'time' },
    { name: 'followUpNotes', label: 'Follow-up Notes', type: 'textarea', placeholder: 'Add follow-up notes', rows: 3 },
    { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Add notes for this enquiry', rows: 4 },
  ];

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
          <div className="flex gap-3 flex-wrap justify-end">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            >
              <option value="">All Status</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Site Visit Scheduled">Site Visit Scheduled</option>
              <option value="Quotation Requested">Quotation Requested</option>
              <option value="Quotation Sent">Quotation Sent</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
              <option value="On Hold">On Hold</option>
            </select>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNewEnquiry}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Enquiry
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleExport('excel')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              <FileSpreadsheet className="w-5 h-5" />
              Export Excel
            </motion.button>
            {/* PDF export removed - keep Excel only */}
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
          actions={(row) => (
            <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => handleViewTimeline(row)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <History className="h-4 w-4" />
                View Timeline
              </button>
              {normalizeEnquiryStatus(row?.status) === 'Won' && !row?.customerId ? (
                <button
                  onClick={() => handleConvertToCustomer(row)}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
                >
                  <Check className="h-4 w-4" />
                  Convert to Customer
                </button>
              ) : row?.customerId ? (
                <button
                  onClick={() => router.push(`/admin/customers/${row.customerId}`)}
                  className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/20"
                >
                  <Eye className="h-4 w-4" />
                  View Customer
                </button>
              ) : null}
              <button
                onClick={() => handleCreateQuotation(row)}
                className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 px-3 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-900/20"
              >
                <FileText className="h-4 w-4" />
                Create Quotation
              </button>
              <button
                onClick={() => handleEditEnquiry(row)}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
              >
                <Edit3 className="h-4 w-4" />
                Edit
              </button>
            </div>
          )}
        />

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={viewMode ? (isEditMode ? 'Edit Enquiry' : 'Enquiry Details') : 'Add New Enquiry'}
          size="lg"
        >
          {isEditMode && selectedEnquiry ? (
            <div className="space-y-6">
              <Form
                key={selectedEnquiry.id}
                fields={editEnquiryFields}
                onSubmit={handleEditEnquirySubmit}
                initialValues={{
                  customerName: selectedEnquiry.customerName || '',
                  phone: selectedEnquiry.phone || '',
                  email: selectedEnquiry.email || '',
                  location: selectedEnquiry.location || '',
                  service: selectedEnquiry.service || '',
                  budget: selectedEnquiry.budget || '',
                  source: selectedEnquiry.source || 'Website',
                  status: selectedEnquiry.status || 'New',
                  followUpDate: selectedEnquiry.followUpDate ? new Date(selectedEnquiry.followUpDate).toISOString().split('T')[0] : '',
                  followUpTime: selectedEnquiry.followUpTime || '',
                  followUpNotes: selectedEnquiry.followUpNotes || '',
                  notes: selectedEnquiry.message || '',
                }}
                submitText="Save Changes"
              />
            </div>
          ) : viewMode && selectedEnquiry ? (
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

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Source</h3>
                  <p className="text-gray-600 dark:text-gray-400">{normalizeEnquirySource(selectedEnquiry.source)}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Created By</h3>
                  <p className="text-gray-600 dark:text-gray-400">{normalizeEnquiryCreatedBy(selectedEnquiry.createdBy)}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Status</h3>
                  <p className="text-gray-600 dark:text-gray-400">{normalizeEnquiryStatus(selectedEnquiry.status)}</p>
                </div>
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

              {(selectedEnquiry.followUpDate || selectedEnquiry.followUpTime || selectedEnquiry.followUpNotes) && (
                <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Next Follow-up</h3>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    {selectedEnquiry.followUpDate && (
                      <p><span className="font-medium text-gray-900 dark:text-white">Date:</span> {new Date(selectedEnquiry.followUpDate).toLocaleDateString()}</p>
                    )}
                    {selectedEnquiry.followUpTime && (
                      <p><span className="font-medium text-gray-900 dark:text-white">Time:</span> {selectedEnquiry.followUpTime}</p>
                    )}
                    {selectedEnquiry.followUpNotes && (
                      <p><span className="font-medium text-gray-900 dark:text-white">Notes:</span> {selectedEnquiry.followUpNotes}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleViewTimeline(selectedEnquiry)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  <History className="w-4 h-4" />
                  View Timeline
                </button>
                {normalizeEnquiryStatus(selectedEnquiry?.status) === 'Won' && !selectedEnquiry?.customerId ? (
                  <button
                    onClick={() => handleConvertToCustomer(selectedEnquiry)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Convert to Customer
                  </button>
                ) : selectedEnquiry?.customerId ? (
                  <button
                    onClick={() => router.push(`/admin/customers/${selectedEnquiry.customerId}`)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View Customer
                  </button>
                ) : null}
                <button
                  onClick={() => handleCreateQuotation(selectedEnquiry)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Create Quotation
                </button>
                <button
                  onClick={() => handleEditEnquiry(selectedEnquiry)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedEnquiry.id, 'Won')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Mark as Won
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedEnquiry.id, 'Follow-up')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Mark as Follow-up
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
            <div className="space-y-6">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200">
                Create a manual enquiry for a customer that is not submitted through the website form.
              </div>
              <Form
                fields={manualEnquiryFields}
                onSubmit={handleManualEnquirySubmit}
                initialValues={{
                  customerName: '',
                  phone: '',
                  email: '',
                  location: '',
                  service: '',
                  enquirySource: 'Website',
                  budget: '',
                  status: 'New',
                  followUpDate: '',
                  followUpTime: '',
                  followUpNotes: '',
                  notes: '',
                }}
                submitText="Create Enquiry"
              />
            </div>
          )}
        </Modal>

        <Modal
          isOpen={isTimelineModalOpen}
          onClose={() => setIsTimelineModalOpen(false)}
          title={timelineEnquiry ? `${timelineEnquiry.customerName || 'Enquiry'} Timeline` : 'Enquiry Timeline'}
          size="md"
        >
          <div className="space-y-4">
            {timelineLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : timelineItems.length > 0 ? (
              <div className="space-y-3">
                {timelineItems.map((item) => (
                  <div key={item.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{item.activity}</p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                          Performed by {item.performedBy || 'System'}
                        </p>
                      </div>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No timeline activity recorded yet.
              </div>
            )}
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}

