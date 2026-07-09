import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import AdminLayout from '../../../components/admin/AdminLayout';

const generateInvoiceNumber = () => `INV-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`;

export default function CreateInvoicePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    customerId: router.query.customerId || '',
    projectId: '',
    invoiceNumber: generateInvoiceNumber(),
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    status: 'Draft',
    totalAmount: '',
    notes: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
      return;
    }

    if (status === 'authenticated') {
      fetchCustomersAndProjects();
    }
  }, [status, router]);

  useEffect(() => {
    const customerIdFromQuery = typeof router.query.customerId === 'string'
      ? router.query.customerId
      : Array.isArray(router.query.customerId)
        ? router.query.customerId[0]
        : '';

    if (customerIdFromQuery) {
      setFormData((prev) => ({
        ...prev,
        customerId: customerIdFromQuery,
        projectId: '',
      }));
    }
  }, [router.query.customerId]);

  const normalizeList = (payload) => {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (Array.isArray(payload?.data)) {
      return payload.data;
    }

    return [];
  };

  const fetchProjectsForCustomer = async (customerId = '') => {
    try {
      const projectsResponse = await fetch(customerId ? `/api/projects?customerId=${encodeURIComponent(customerId)}` : '/api/projects');
      const projectsData = await projectsResponse.json();
      setProjects(normalizeList(projectsData));
    } catch (error) {
      console.error('Failed to load projects for invoice form:', error);
      setProjects([]);
    }
  };

  const fetchCustomersAndProjects = async () => {
    try {
      setLoading(true);
      setError('');

      const customersResponse = await fetch('/api/customers');
      const customersPayload = await customersResponse.json();
      const customerList = normalizeList(customersPayload);
      setCustomers(customerList);

      const customerIdFromQuery = typeof router.query.customerId === 'string'
        ? router.query.customerId
        : Array.isArray(router.query.customerId)
          ? router.query.customerId[0]
          : '';

      if (customerIdFromQuery) {
        setFormData((prev) => ({ ...prev, customerId: customerIdFromQuery, projectId: '' }));
        await fetchProjectsForCustomer(customerIdFromQuery);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error('Failed to load invoice form data:', error);
      setError('Unable to load customers and projects right now.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === 'customerId') {
      setFormData((prev) => ({ ...prev, customerId: value, projectId: '' }));
      if (value) {
        fetchProjectsForCustomer(value);
      } else {
        setProjects([]);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (error) setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.customerId) {
      setError('Customer is required.');
      return;
    }

    if (!formData.dueDate) {
      setError('Due date is required.');
      return;
    }

    const amount = Number(formData.totalAmount);
    if (!amount || amount <= 0) {
      setError('Total amount must be greater than zero.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const selectedCustomer = customers.find((customer) => customer.id === formData.customerId);
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          totalAmount: amount,
          customerName: selectedCustomer?.name || '',
          subtotal: amount,
          taxAmount: 0,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to create invoice');
      }

      toast.success('Invoice created successfully');
      router.push('/admin/invoices');
    } catch (error) {
      console.error('Failed to create invoice:', error);
      toast.error('Failed to create invoice.');
      setError(error.message || 'Unable to create invoice right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Invoice</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Create a new invoice for a customer and optional project.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Customer <span className="text-red-500">*</span>
                </label>
                <select
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">Select customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} {customer.phone ? `- ${customer.phone}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Project
                </label>
                <select
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Invoice Number
                </label>
                <input
                  type="text"
                  name="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={handleChange}
                  readOnly
                  placeholder="Auto-generated"
                  className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Issue Date
                </label>
                <input
                  type="date"
                  name="issueDate"
                  value={formData.issueDate}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                >
                  <option value="Draft">Draft</option>
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="totalAmount"
                  value={formData.totalAmount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="4"
                placeholder="Add invoice notes"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
              <button
                type="button"
                onClick={() => router.push('/admin/invoices')}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || loading}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Creating...' : 'Create Invoice'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
