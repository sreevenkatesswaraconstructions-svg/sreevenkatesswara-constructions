import { useEffect, useState } from 'react'
import AdminLayout from '../../../components/admin/AdminLayout'
import { Plus, Search, Trash2, Eye, Edit } from 'lucide-react'
import Link from 'next/link'

export default function QuotationsList() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const fetchList = async () => {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    if (search) q.set('search', search)
    if (status) q.set('status', status)
    const res = await fetch('/api/quotations?' + q.toString())
    const data = await res.json()
    if (data.success) {
      setItems(data.data.items)
      setTotal(data.data.total)
    }
  }

  useEffect(() => { fetchList() }, [page, search, status])

  const handleDelete = async (id) => {
    if (!confirm('Delete this quotation?')) return
    const res = await fetch('/api/quotations/' + id, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      fetchList()
      alert(data.message || 'Quotation deleted successfully.')
    } else {
      alert(data.message || 'Failed to delete quotation')
    }
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Quotations</h2>
        <Link href="/admin/quotations/create" className="inline-flex items-center gap-2 bg-emerald-600 text-white px-3 py-2 rounded">
          <Plus className="w-4 h-4" /> Create Quotation
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded mb-4 flex gap-3 items-center">
        <div className="flex items-center border rounded px-2 py-1 gap-2">
          <Search className="w-4 h-4 text-gray-500" />
          <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search" className="bg-transparent outline-none" />
        </div>
        <select value={status} onChange={(e)=>setStatus(e.target.value)} className="border px-2 py-1 rounded">
          <option value="">All Status</option>
          <option>Draft</option>
          <option>Sent</option>
          <option>Accepted</option>
          <option>Rejected</option>
          <option>Expired</option>
        </select>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b"><th className="py-2">#</th><th>Quotation</th><th>Customer</th><th>Status</th><th>Created</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={it.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="py-2">{(page-1)*pageSize + idx + 1}</td>
                <td>{it.quotationNumber}<div className="text-sm text-gray-500">{it.projectName}</div></td>
                <td>{it.customerName}<div className="text-sm text-gray-500">{it.customerPhone}</div></td>
                <td>{it.status}</td>
                <td>
  {new Date(it.quotationDate || it.createdAt).toLocaleDateString()}
</td>
                <td className="flex gap-2">
                  <Link href={`/admin/quotations/${it.id}`} className="p-2 rounded hover:bg-gray-100"><Eye className="w-4 h-4" /></Link>
                  <Link href={`/admin/quotations/${it.id}`} className="p-2 rounded hover:bg-gray-100"><Edit className="w-4 h-4" /></Link>
                  <button onClick={()=>handleDelete(it.id)} className="p-2 rounded hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex items-center justify-between">
          <div>Showing {items.length} of {total}</div>
          <div className="flex items-center gap-2">
            <button disabled={page<=1} onClick={()=>setPage(page-1)} className="px-3 py-1 border rounded">Prev</button>
            <span className="px-3">{page}</span>
            <button disabled={(page*pageSize)>=total} onClick={()=>setPage(page+1)} className="px-3 py-1 border rounded">Next</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
