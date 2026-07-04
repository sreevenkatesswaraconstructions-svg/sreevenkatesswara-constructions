import { motion } from 'framer-motion';
import {
  MessageSquare,
  FolderKanban,
  CheckCircle,
  FileText,
  Users,
  Settings,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

const iconMap = {
  MessageSquare,
  FolderKanban,
  CheckCircle,
  FileText,
  Users,
  Settings,
};

const colorMap = {
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
};

export default function StatCard({ title, value, change, trend, icon, color }) {
  const Icon = iconMap[icon];
  const colors = colorMap[color];

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colors.bg}`}>
          <Icon className={`w-6 h-6 ${colors.text}`} />
        </div>
      </div>

      <div className="flex items-center mt-4">
        {trend === 'up' ? (
          <TrendingUp className="w-4 h-4 text-green-500" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-500" />
        )}
        <span
          className={`ml-2 text-sm font-medium ${
            trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}
        >
          {change}
        </span>
        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">from last month</span>
      </div>
    </motion.div>
  );
}
