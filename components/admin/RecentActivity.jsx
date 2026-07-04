import { motion } from 'framer-motion';
import { MessageSquare, FolderKanban, FileText, Settings, Clock } from 'lucide-react';

export default function RecentActivity({ activities = [] }) {
  const iconMap = {
    enquiry: MessageSquare,
    project: FolderKanban,
    blog: FileText,
    service: Settings,
  };

  const colorMap = {
    enquiry: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    project: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    blog: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    service: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);

    // Validate date before formatting
    if (isNaN(date.getTime())) {
      console.error('[DATE] Invalid date detected:', dateString);
      return 'Invalid Date';
    }

    try {
      // Use native Date methods for consistent formatting
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleString('en-US', { month: 'short' });
      const year = date.getFullYear();
      const hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;

      return `${day} ${month} ${year}, ${formattedHours}:${minutes} ${ampm}`;
    } catch (error) {
      console.error('[DATE] Formatting error:', error, 'for date:', dateString);
      return 'Invalid Date';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Recent Activity
        </h2>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {activities?.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No recent activity found.
          </div>
        ) : (
          activities?.map((activity, index) => {
            const Icon = iconMap[activity.type] || Clock;
            const colorClass =
              colorMap[activity.type] ||
              'bg-gray-100 text-gray-600';

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {activity.title}
                    </h3>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {activity.description}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(activity.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button className="w-full text-center text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
          View All Activity
        </button>
      </div>
    </div>
  );
}