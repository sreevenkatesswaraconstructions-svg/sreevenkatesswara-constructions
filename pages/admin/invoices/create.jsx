import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import AdminLayout from '../../../components/admin/AdminLayout';
import { calculateInvoiceTotals } from '../../../lib/invoiceCalculations';

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
    items: [
      { description: '', quantity: 1, unitPrice: 0, amount: 0 },
    ],
    subtotal: 0,
    discountPercent: 0,
    discountAmount: 0,
    taxPercent: 0,
    taxAmount: 0,
    totalAmount: 0,
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

  const handleSummaryChange = (event) => {
    const { name, value } = event.target;
    const numericValue = Number(value);

    setFormData((prev) => {
      const nextValue = Number.isFinite(numericValue) ? numericValue : 0;
      const nextState = { ...prev, [name]: nextValue };
      const totals = calculateInvoiceTotals(nextState.items || [], nextState.discountPercent ?? 0, nextState.taxPercent ?? 0);
      return { ...nextState, ...totals };
    });

    if (error) setError('');
  };

  const updateItem = (index, key, value) => {
    setFormData((prev) => {
      const items = Array.isArray(prev.items) ? [...prev.items] : []
      const item = { ...(items[index] || { description: '', quantity: 0, unitPrice: 0, amount: 0 }) }
      if (key === 'description') item.description = value
      if (key === 'quantity') item.quantity = Number(value)
      if (key === 'unitPrice') item.unitPrice = Number(value)
      item.amount = Number((Number(item.quantity || 0) * Number(item.unitPrice || 0)).toFixed(2))
      items[index] = item
      const totals = calculateInvoiceTotals(items, prev.discountPercent ?? 0, prev.taxPercent ?? 0)
      return { ...prev, items, ...totals }
    })
  }

  const addItem = () => {
    setFormData((prev) => {
      const items = [...(prev.items || []), { description: '', quantity: 1, unitPrice: 0, amount: 0 }]
      const totals = calculateInvoiceTotals(items, prev.discountPercent ?? 0, prev.taxPercent ?? 0)
      return { ...prev, items, ...totals }
    })
  }

  const removeItem = (index) => {
    setFormData((prev) => {
      const items = [...(prev.items || [])]
      items.splice(index, 1)
      const totals = calculateInvoiceTotals(items, prev.discountPercent ?? 0, prev.taxPercent ?? 0)
      return { ...prev, items, ...totals }
    })
  }

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

    const totals = calculateInvoiceTotals(formData.items || [], formData.discountPercent ?? 0, formData.taxPercent ?? 0)
    if (!totals.totalAmount || totals.totalAmount <= 0) {
      setError('Grand total must be greater than zero.');
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
          items: formData.items || [],
          ...totals,
          customerName: selectedCustomer?.name || '',
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

  const summaryTotals = calculateInvoiceTotals(formData.items || [], formData.discountPercent ?? 0, formData.taxPercent ?? 0);

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

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Invoice Items
                </label>
                <div className="space-y-2">
                  {(formData.items || []).map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                        placeholder="Description"
                        className="col-span-6 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                      />
                      <input
                        type="number"
                        value={item.quantity}
                        min="0"
                        step="1"
                        onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                        className="col-span-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                      />
                      <input
                        type="number"
                        value={item.unitPrice}
                        min="0"
                        step="0.01"
                        onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                        className="col-span-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                      />
                      <input
                        type="number"
                        value={item.amount}
                        readOnly
                        className="col-span-1 w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="col-span-1 rounded-lg border border-red-300 px-2 py-1 text-sm text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  <div>
                    <button
                      type="button"
                      onClick={addItem}
                      className="rounded-lg bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                    >
                      + Add Item
                    </button>
                  </div>

                  <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Subtotal</div>
                        <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">₹{summaryTotals.subtotal.toFixed(2)}</div>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <label className="mb-1 block text-sm text-gray-500 dark:text-gray-400">Discount %</label>
                        <input
                          type="number"
                          name="discountPercent"
                          min="0"
                          step="0.01"
                          value={formData.discountPercent ?? 0}
                          onChange={handleSummaryChange}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                        />
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">₹{summaryTotals.discountAmount.toFixed(2)}</div>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <label className="mb-1 block text-sm text-gray-500 dark:text-gray-400">Tax %</label>
                        <input
                          type="number"
                          name="taxPercent"
                          min="0"
                          step="0.01"
                          value={formData.taxPercent ?? 0}
                          onChange={handleSummaryChange}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                        />
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">₹{summaryTotals.taxAmount.toFixed(2)}</div>
                      </div>
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 md:col-span-2 xl:col-span-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-emerald-700">Grand Total</span>
                          <span className="text-xl font-bold text-emerald-700">₹{summaryTotals.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
