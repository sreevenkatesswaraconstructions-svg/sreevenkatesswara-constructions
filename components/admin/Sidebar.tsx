'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  MessageSquare,
  FolderKanban,
  FileText,
  Settings,
  Upload,
  ChevronLeft,
  ChevronRight,
  Building2,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/enquiries', icon: MessageSquare, label: 'Enquiries' },
  { href: '/admin/projects', icon: FolderKanban, label: 'Projects' },
  { href: '/admin/blogs', icon: FileText, label: 'Blogs' },
  { href: '/admin/services', icon: Building2, label: 'Services' },
  { href: '/admin/testimonials', icon: MessageSquare, label: 'Testimonials' },
  { href: '/admin/upload', icon: Upload, label: 'Upload Manager' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onMobileToggle: () => void;
}

export default function Sidebar({ isCollapsed, onToggle, isMobileOpen, onMobileToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              onClick={onMobileToggle}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu button */}
      <button
        onClick={onMobileToggle}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? '80px' : '280px',
          x: isMobileOpen ? 0 : -280,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div className={cn(
          'h-full bg-white border-r border-gray-200 z-50',
          'fixed left-0 top-0 lg:translate-x-0 lg:relative lg:z-0'
        )}>
          <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                  >
                    <div className="overflow-hidden">
                      <h1 className="font-bold text-gray-900 text-sm leading-tight">
                        Sree Venkatesswara
                      </h1>
                      <p className="text-xs text-gray-500">Constructions</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                    'hover:bg-gray-100',
                    isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  )}
                >
                  <Icon className={cn('w-5 h-5 flex-shrink-0', isActive ? 'text-blue-600' : 'text-gray-500')} />
                  <AnimatePresence mode="wait">
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                      >
                        <span className="font-medium text-sm whitespace-nowrap overflow-hidden">
                          {item.label}
                        </span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              );
            })}
          </nav>

          {/* Collapse toggle */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={onToggle}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5 text-gray-500" />
              ) : (
                <>
                  <ChevronLeft className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-600">Collapse</span>
                </>
              )}
            </button>
          </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
