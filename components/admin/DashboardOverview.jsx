import { motion } from 'framer-motion';
import StatCard from './StatCard';
import RecentActivity from './RecentActivity';
import QuickActions from './QuickActions';

export default function DashboardOverview() {
  const stats = [
    {
      title: 'Total Enquiries',
      value: '248',
      change: '+12%',
      trend: 'up',
      icon: 'MessageSquare',
      color: 'emerald'
    },
    {
      title: 'Active Projects',
      value: '12',
      change: '+3',
      trend: 'up',
      icon: 'FolderKanban',
      color: 'blue'
    },
    {
      title: 'Completed Projects',
      value: '89',
      change: '+5',
      trend: 'up',
      icon: 'CheckCircle',
      color: 'green'
    },
    {
      title: 'Blog Posts',
      value: '34',
      change: '+2',
      trend: 'up',
      icon: 'FileText',
      color: 'purple'
    },
    {
      title: 'Website Visitors',
      value: '12.5K',
      change: '+18%',
      trend: 'up',
      icon: 'Users',
      color: 'orange'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Welcome back! Here's what's happening with your business.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <RecentActivity />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <QuickActions />
        </motion.div>
      </div>
    </div>
  );
}
