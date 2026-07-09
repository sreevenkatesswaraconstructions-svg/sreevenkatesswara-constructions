import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import AdminLayout from '../../../components/admin/AdminLayout';
import Modal from '../../../components/admin/Modal';
import { Trash2 } from 'lucide-react';
import { calculateInvoiceTotals } from '../../../lib/invoiceCalculations';

const createEmptyItem = () => ({ description: '', quantity: 1, unitPrice: 0, amount: 0 });

const normalizeItem = (item = {}) => {
  const quantity = Number(item.quantity ?? 1) || 0;
  const unitPrice = Number(item.unitPrice ?? 0) || 0;
  return {
    id: item.id || undefined,
    description: item.description || '',
    quantity,
    unitPrice,
    amount: Number((quantity * unitPrice).toFixed(2)),
  };
};

const normalizeItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return [createEmptyItem()];
  }

  return items.map(normalizeItem);
};

export default function InvoiceDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { status } = useSession();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    dueDate: '',
    status: 'Draft',
    subtotal: 0,
    discountPercent: 0,
    discountAmount: 0,
    taxPercent: 0,
    taxAmount: 0,
    totalAmount: 0,
    notes: '',
    items: [createEmptyItem()],
  });

  const totals = calculateInvoiceTotals(
    formData.items || [],
    formData.discountPercent ?? 0,
    formData.taxPercent ?? 0,
  );

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
      return;
    }

    if (status === 'authenticated' && id) {
      fetchInvoice();
    }
  }, [status, id, router]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/invoices/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to load invoice');
      }

      const items = normalizeItems(data.items);
      const invoiceTotals = calculateInvoiceTotals(items, data?.discountPercent ?? 0, data?.taxPercent ?? 0);

      setInvoice(data);
      setFormData({
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : '',
        status: data.status || 'Draft',
        subtotal: Number(data?.subtotal ?? invoiceTotals.subtotal).toFixed(2),
        discountPercent: Number(data?.discountPercent ?? invoiceTotals.discountPercent),
        discountAmount: Number(data?.discountAmount ?? invoiceTotals.discountAmount).toFixed(2),
        taxPercent: Number(data?.taxPercent ?? invoiceTotals.taxPercent),
        taxAmount: Number(data?.taxAmount ?? invoiceTotals.taxAmount).toFixed(2),
        totalAmount: Number(data?.totalAmount ?? invoiceTotals.totalAmount).toFixed(2),
        notes: data.notes || '',
        items,
      });
    } catch (error) {
      console.error('Failed to load invoice:', error);
      setError(error.message || 'Unable to load invoice right now.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      const items = Array.isArray(prev.items) ? [...prev.items] : [];
      const item = { ...(items[index] || createEmptyItem()) };

      if (key === 'description') item.description = value;
      if (key === 'quantity') item.quantity = Number(value);
      if (key === 'unitPrice') item.unitPrice = Number(value);

      item.amount = Number((Number(item.quantity || 0) * Number(item.unitPrice || 0)).toFixed(2));
      items[index] = item;

      const totals = calculateInvoiceTotals(items, prev.discountPercent ?? 0, prev.taxPercent ?? 0);
      return { ...prev, items, ...totals };
    });
  };

  const addItem = () => {
    setFormData((prev) => {
      const items = [...(prev.items || []), createEmptyItem()];
      const totals = calculateInvoiceTotals(items, prev.discountPercent ?? 0, prev.taxPercent ?? 0);
      return { ...prev, items, ...totals };
    });
  };

  const removeItem = (index) => {
    setFormData((prev) => {
      const items = [...(prev.items || [])];
      items.splice(index, 1);
      const totals = calculateInvoiceTotals(items, prev.discountPercent ?? 0, prev.taxPercent ?? 0);
      return {
        ...prev,
        items: items.length > 0 ? items : [createEmptyItem()],
        ...totals,
      };
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!formData.dueDate) {
      setError('Due date is required.');
      return;
    }

    if (!totals.totalAmount || totals.totalAmount <= 0) {
      setError('Invoice total must be greater than zero.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const response = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dueDate: formData.dueDate,
          status: formData.status,
          notes: formData.notes,
          items: formData.items || [],
          ...totals,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to update invoice');
      }

      const items = normalizeItems(data.items);
      const invoiceTotals = calculateInvoiceTotals(items, data?.discountPercent ?? 0, data?.taxPercent ?? 0);

      setInvoice(data);
      setFormData((prev) => ({
        ...prev,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : prev.dueDate,
        status: data.status || prev.status,
        subtotal: Number(data?.subtotal ?? invoiceTotals.subtotal).toFixed(2),
        discountPercent: Number(data?.discountPercent ?? invoiceTotals.discountPercent),
        discountAmount: Number(data?.discountAmount ?? invoiceTotals.discountAmount).toFixed(2),
        taxPercent: Number(data?.taxPercent ?? invoiceTotals.taxPercent),
        taxAmount: Number(data?.taxAmount ?? invoiceTotals.taxAmount).toFixed(2),
        totalAmount: Number(data?.totalAmount ?? invoiceTotals.totalAmount).toFixed(2),
        notes: data.notes ?? prev.notes,
        items,
      }));
      toast.success('Invoice updated successfully.');
    } catch (error) {
      console.error('Failed to update invoice:', error);
      setError(error.message || 'Unable to update invoice right now.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const resp = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body?.message || 'Failed to delete invoice');
      toast.success('Invoice deleted');
      router.push('/admin/invoices');
    } catch (err) {
      console.error('Delete failed', err);
      toast.error(err?.message || 'Failed to delete invoice');
    }
  };

  const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const summaryTotals = totals;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Invoice Details</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              View and update invoice information.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`/api/invoices/${id}/pdf?download=1`}
              download={invoice?.invoiceNumber ? `${invoice.invoiceNumber}.pdf` : undefined}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              Download PDF
            </a>
            <button
              type="button"
              onClick={() => window.open(`/api/invoices/${id}/pdf`, '_blank')}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              Print
            </button>
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="inline-flex items-center justify-center rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-700 dark:bg-gray-800 dark:text-red-400"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          {loading ? (
            <div className="flex items-center justify-center px-6 py-16 text-sm text-gray-500 dark:text-gray-400">
              Loading invoice...
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Invoice Number</label>
                  <input
                    type="text"
                    value={invoice.invoiceNumber || ''}
                    readOnly
                    className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Customer</label>
                  <input
                    type="text"
                    value={invoice.customer?.name || invoice.customerName || ''}
                    readOnly
                    className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Project</label>
                  <input
                    type="text"
                    value={invoice.project?.title || '-'}
                    readOnly
                    className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Issue Date</label>
                  <input
                    type="text"
                    value={formatDate(invoice.issueDate)}
                    readOnly
                    className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
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
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="4"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Invoice Items
                </label>
                <div className="space-y-2">
                  {(formData.items || []).map((item, idx) => (
                    <div key={`${item.id || 'new'}-${idx}`} className="grid grid-cols-12 items-center gap-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(event) => updateItem(idx, 'description', event.target.value)}
                        placeholder="Description"
                        className="col-span-6 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                      />
                      <input
                        type="number"
                        value={item.quantity}
                        min="0"
                        step="1"
                        onChange={(event) => updateItem(idx, 'quantity', event.target.value)}
                        className="col-span-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                      />
                      <input
                        type="number"
                        value={item.unitPrice}
                        min="0"
                        step="0.01"
                        onChange={(event) => updateItem(idx, 'unitPrice', event.target.value)}
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

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => router.push('/admin/invoices')}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Invoice?">
        <div className="space-y-4">
          <p>This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteModalOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700">Cancel</button>
            <button onClick={handleDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white">Delete</button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
