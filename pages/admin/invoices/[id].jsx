import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import AdminLayout from '../../../components/admin/AdminLayout';
import Modal from '../../../components/admin/Modal';
import { Trash2 } from 'lucide-react';

export default function InvoiceDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { status } = useSession();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
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

      setInvoice(data);
      setFormData({
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : '',
        status: data.status || 'Draft',
        totalAmount: data.totalAmount ?? '',
        notes: data.notes || '',
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

  const handleSave = async (event) => {
    event.preventDefault();
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
      setSaving(true);
      setError('');

      const response = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dueDate: formData.dueDate,
          status: formData.status,
          totalAmount: amount,
          notes: formData.notes,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to update invoice');
      }

      setInvoice(data);
      toast.success('Invoice updated successfully.');
    } catch (error) {
      console.error('Failed to update invoice:', error);
      setError(error.message || 'Unable to update invoice right now.');
    } finally {
      setSaving(false);
    }
  };

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

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

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Total Amount</label>
                  <input
                    type="number"
                    name="totalAmount"
                    value={formData.totalAmount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                  />
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
