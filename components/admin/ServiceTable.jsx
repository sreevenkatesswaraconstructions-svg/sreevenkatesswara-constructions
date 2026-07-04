import { Edit, Trash2, Eye } from 'lucide-react'

export default function ServiceTable({ services, onView, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Image</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Service Name</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Slug</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Featured</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Created Date</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
          </tr>
        </thead>
        <tbody>
          {services.map((service) => (
            <tr key={service.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="py-3 px-4">
                {service.image ? (
                  <img
                    src={service.image}
                    alt={service.serviceName}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                    <span className="text-xs text-gray-400">No img</span>
                  </div>
                )}
              </td>
              <td className="py-3 px-4">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {service.serviceName}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {service.slug}
                </span>
              </td>
              <td className="py-3 px-4">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    service.status === 'ACTIVE'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {service.status}
                </span>
              </td>
              <td className="py-3 px-4">
                {service.featured ? (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                    Yes
                  </span>
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">No</span>
                )}
              </td>
              <td className="py-3 px-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(service.createdAt).toLocaleDateString()}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onView(service)}
                    className="p-1.5 text-gray-600 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit(service)}
                    className="p-1.5 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(service.id)}
                    className="p-1.5 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
