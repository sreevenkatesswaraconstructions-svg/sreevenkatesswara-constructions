import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, User, Loader2, Eye } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'

const PAGE_SIZE = 8

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await fetch('/api/customers')
        const result = await response.json()
        if (result?.success) {
          setCustomers(result.data || [])
        } else {
          setError(result?.message || 'Failed to load customers')
        }
      } catch (err) {
        console.error('Failed to load customers', err)
        setError('Unable to load customers right now.')
      } finally {
        setLoading(false)
      }
    }

    loadCustomers()
  }, [])

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return customers

    return customers.filter((customer) => {
      return [customer.name, customer.phone, customer.email, customer.location, customer.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    })
  }, [customers, search])

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pagedCustomers = filteredCustomers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search])

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="font-medium">{error}</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
            <p className="mt-1 text-sm text-gray-600">A read-only view of customers created from enquiries and quotations.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers..."
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <User className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">No customers yet</h2>
            <p className="mt-2 text-sm text-gray-600">Customers will appear here automatically after enquiries or quotations are converted.</p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer ID</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Phone</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Location</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Total Projects</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {pagedCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-700">{customer.id}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">{customer.name}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{customer.phone}</td>
                        <td className="px-4 py-3 text-gray-600">{customer.email}</td>
                        <td className="px-4 py-3 text-gray-600">{customer.location}</td>
                        <td className="px-4 py-3 text-gray-600">{customer.totalProjects}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            {customer.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/customers/${customer.id}`} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                            <Eye className="h-4 w-4" />
                            View Customer
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-gray-600">
                Showing {(safePage - 1) * PAGE_SIZE + 1}-{Math.min(safePage * PAGE_SIZE, filteredCustomers.length)} of {filteredCustomers.length} customers
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={safePage === 1}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">
                  Page {safePage} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={safePage === totalPages}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
