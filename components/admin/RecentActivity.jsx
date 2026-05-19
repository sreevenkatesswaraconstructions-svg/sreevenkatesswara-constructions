import { motion } from 'framer-motion';
import { MessageSquare, FolderKanban, FileText, Clock } from 'lucide-react';

export default function RecentActivity() {
  const activities = [
    {
      id: 1,
      type: 'enquiry',
      title: 'New enquiry from John Doe',
      description: 'Residential construction project inquiry',
      time: '2 minutes ago',
      icon: MessageSquare,
      color: 'emerald'
    },
    {
      id: 2,
      type: 'project',
      title: 'Project updated: Villa Renovation',
      description: 'Status changed to In Progress',
      time: '15 minutes ago',
      icon: FolderKanban,
      color: 'blue'
    },
    {
      id: 3,
      type: 'blog',
      title: 'Blog post published',
      description: 'Modern Interior Design Trends',
      time: '1 hour ago',
      icon: FileText,
      color: 'purple'
    },
    {
      id: 4,
      type: 'enquiry',
      title: 'New enquiry from Jane Smith',
      description: 'Commercial interior design inquiry',
      time: '2 hours ago',
      icon: MessageSquare,
      color: 'emerald'
    },
    {
      id: 5,
      type: 'project',
      title: 'Project completed: Office Space',
      description: 'Final inspection approved',
      time: '3 hours ago',
      icon: FolderKanban,
      color: 'green'
    },
  ];

  const colorMap = {
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {activities.map((activity, index) => {
          const Icon = activity.icon;
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${colorMap[activity.color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">{activity.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button className="w-full text-center text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
          View All Activity
        </button>
      </div>
    </div>
  );
}
