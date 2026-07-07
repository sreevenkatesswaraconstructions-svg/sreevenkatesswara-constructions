import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import {
  LayoutDashboard,
  MessageSquare,
  FolderKanban,
  FileText,
  Settings,
  Upload,
  X,
  Moon,
  Sun,
  Building2,
  Users
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { name: 'Enquiries', icon: MessageSquare, path: '/admin/enquiries' },
  { name: 'Customers', icon: Users, path: '/admin/customers' },
  { name: 'Quotations', icon: FileText, path: '/admin/quotations' },
  { name: 'Projects', icon: FolderKanban, path: '/admin/projects' },
  { name: 'Blogs', icon: FileText, path: '/admin/blogs' },
  { name: 'Services', icon: Building2, path: '/admin/services' },
  { name: 'Testimonials', icon: MessageSquare, path: '/admin/testimonials' },
  { name: 'Upload Manager', icon: Upload, path: '/admin/uploads' },
  { name: 'Activity Log', icon: FileText, path: '/admin/activity-log' },
  { name: 'Settings', icon: Settings, path: '/admin/settings' },
];

export default function AdminSidebar({ onClose, darkMode, setDarkMode }) {
  const router = useRouter();
  const [activeItem, setActiveItem] = useState('Dashboard');

  const handleNavigation = (item) => {
    setActiveItem(item.name);
    router.push(item.path);
  };

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      exit={{ x: -300 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-lg"
    >
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Sree Venkatesswara
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Admin Dashboard
            </p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.name;
          
          return (
            <button
              key={item.name}
              onClick={() => handleNavigation(item)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Dark Mode Toggle */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
        >
          {darkMode ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
          <span className="font-medium">
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>
      </div>
    </motion.aside>
  );
}
