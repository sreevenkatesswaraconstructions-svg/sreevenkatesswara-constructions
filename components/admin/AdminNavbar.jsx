import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Menu, Search, User, LogOut, Settings, Clock, Shield, FileText } from 'lucide-react';
import NotificationBell from './NotificationBell';

export default function AdminNavbar({ onMenuClick, sidebarOpen, darkMode, setDarkMode }) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserProfile();
    }
  }, [session]);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch('/api/admin/profile');
      const data = await res.json();
      if (data.success) {
        setUserProfile(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (error) {
      console.error('Failed to log logout:', error);
    }

    await signOut({ callbackUrl: '/svci-admin-secure-login' });
  };

  const getRelativeTime = (date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    return name.charAt(0).toUpperCase();
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4"
    >
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>

          {/* Search Bar */}
          <div className="hidden md:flex items-center relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-80 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <NotificationBell />

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="group flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
            >
              <div className="relative">
                {userProfile?.profileImage ? (
                  <img
                    src={userProfile.profileImage}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 text-white flex items-center justify-center border-2 border-white shadow-sm transition-transform duration-200 group-hover:scale-105">
                    <span className="text-sm font-semibold">
                      {getInitials(userProfile?.name || session?.user?.name)}
                    </span>
                  </div>
                )}
                <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-white bg-emerald-400 shadow-lg animate-pulse" />
              </div>
            </button>

            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50"
              >
                {/* Profile Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    {userProfile?.profileImage ? (
                      <img
                        src={userProfile.profileImage}
                        alt="Profile"
                        className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center border-2 border-emerald-500">
                        <span className="text-white font-semibold">
                          {getInitials(userProfile?.name || session?.user?.name)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {userProfile?.name || session?.user?.name || 'Admin User'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {userProfile?.email || session?.user?.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">
                          {userProfile?.role || session?.user?.role || 'ADMIN'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          userProfile?.accountStatus === 'ACTIVE'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          {userProfile?.accountStatus || 'ACTIVE'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>Last login: {getRelativeTime(userProfile?.lastLogin)}</span>
                    </div>
                  </div>
                </div>

                {/* Dropdown Options */}
                <div className="p-2">
                  <button
                    onClick={() => {
                      window.location.href = '/admin/profile'
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>My Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      window.location.href = '/admin/settings'
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Account Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      window.location.href = '/admin/change-password'
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Change Password</span>
                  </button>
                  <button
                    onClick={() => {
                      window.location.href = '/admin/activity-log'
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Activity Log</span>
                  </button>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
