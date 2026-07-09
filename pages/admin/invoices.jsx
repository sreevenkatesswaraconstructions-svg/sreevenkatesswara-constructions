import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { FileText, RefreshCw, Plus, ArrowRight, Trash2 } from 'lucide-react';
import Modal from '../../components/admin/Modal';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';

export default function InvoicesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
      return;
    }

    if (status === 'authenticated') {
      fetchInvoices();
    }
  }, [status, router]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/invoices');
      const data = await response.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState(null);

  const confirmDelete = (id) => {
    setSelectedDeleteId(id);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedDeleteId) return;
    try {
      const resp = await fetch(`/api/invoices/${selectedDeleteId}`, { method: 'DELETE' });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body?.message || 'Failed to delete invoice');
      toast.success('Invoice deleted');
      setDeleteModalOpen(false);
      setSelectedDeleteId(null);
      fetchInvoices();
    } catch (err) {
      console.error('Delete failed', err);
      toast.error(err?.message || 'Failed to delete invoice');
    }
  };

  const formatCurrency = (value) => {
    const amount = Number(value || 0);
    return `₹${amount.toLocaleString('en-IN')}`;
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Invoices</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manage invoice records for customers and projects.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchInvoices}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={() => router.push('/admin/invoices/create')}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Create Invoice
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Invoice List</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {loading ? 'Loading invoices...' : `${invoices.length} invoice${invoices.length === 1 ? '' : 's'} found`}
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center px-6 py-16 text-sm text-gray-500 dark:text-gray-400">
              Loading invoices...
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                <FileText className="h-6 w-6 text-gray-500" />
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">No invoices available.</p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Create your first invoice to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Invoice</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Created</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-emerald-600" />
                          <button
                            type="button"
                            onClick={() => router.push(`/admin/invoices/${invoice.id}`)}
                            className="text-emerald-600 hover:underline dark:text-emerald-400"
                          >
                            {invoice.invoiceNumber || 'Untitled Invoice'}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {invoice.customer?.name || invoice.customerName || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {invoice.project?.title || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {invoice.status || 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-right">
                        {formatCurrency(invoice.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {formatDate(invoice.dueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {formatDate(invoice.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-center">
                        <button
                          type="button"
                          onClick={() => confirmDelete(invoice.id)}
                          className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-1 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-700 dark:bg-gray-800 dark:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
