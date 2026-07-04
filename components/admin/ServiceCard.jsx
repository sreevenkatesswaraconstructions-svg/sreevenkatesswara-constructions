import { motion } from 'framer-motion'
import { Edit, Trash2, Eye } from 'lucide-react'

export default function ServiceCard({ service, onView, onEdit, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start gap-4">
        {service.image && (
          <img
            src={service.image}
            alt={service.serviceName}
            className="w-24 h-24 object-cover rounded-lg"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {service.serviceName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {service.slug}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    service.status === 'ACTIVE'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {service.status}
                </span>
                {service.featured && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                    Featured
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onView(service)}
                className="p-2 text-gray-600 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors"
                title="View"
              >
                <Eye className="w-5 h-5" />
              </button>
              <button
                onClick={() => onEdit(service)}
                className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                title="Edit"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={() => onDelete(service.id)}
                className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            Created: {new Date(service.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
