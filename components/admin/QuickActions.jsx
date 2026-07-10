import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { Plus, MessageSquare, FolderKanban, FileText, Upload } from 'lucide-react';

export default function QuickActions() {
  const router = useRouter();
  const actions = [
    {
      title: 'New Enquiry',
      description: 'Add a new customer enquiry',
      icon: MessageSquare,
      color: 'emerald',
      path: '/admin/enquiries'
    },
    {
      title: 'New Project',
      description: 'Create a new project',
      icon: FolderKanban,
      color: 'blue',
      path: '/admin/projects'
    },
    {
      title: 'New Blog Post',
      description: 'Write a new article',
      icon: FileText,
      color: 'purple',
      path: '/admin/blogs'
    },
    {
      title: 'Upload File',
      description: 'Upload images or documents',
      icon: Upload,
      color: 'orange',
      path: '/admin/uploads'
    },
  ];

  const colorMap = {
    emerald: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-600',
    blue: 'hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600',
    purple: 'hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-600',
    orange: 'hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-300 dark:hover:border-orange-600',
  };

  const iconColorMap = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    blue: 'text-blue-600 dark:text-blue-400',
    purple: 'text-purple-600 dark:text-purple-400',
    orange: 'text-orange-600 dark:text-orange-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
      </div>

      <div className="p-4 space-y-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.title}
              type="button"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(action.path)}
              className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 transition-all duration-200 ${colorMap[action.color]}`}
            >
              <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${iconColorMap[action.color]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white">{action.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
              </div>
              <Plus className="w-5 h-5 text-gray-400" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
