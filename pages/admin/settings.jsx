import { useState } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';
import Form from '../../components/admin/Form';
import { User, Building, Bell, Shield, Palette, Globe } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'company', label: 'Company', icon: Building },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'seo', label: 'SEO', icon: Globe },
  ];

  const profileFields = [
    { name: 'firstName', label: 'First Name', type: 'text', required: true, placeholder: 'Enter first name' },
    { name: 'lastName', label: 'Last Name', type: 'text', required: true, placeholder: 'Enter last name' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'Enter email' },
    { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: 'Enter phone number' },
    { name: 'avatar', label: 'Profile Image', type: 'file' },
  ];

  const companyFields = [
    { name: 'companyName', label: 'Company Name', type: 'text', required: true, placeholder: 'Enter company name' },
    { name: 'tagline', label: 'Tagline', type: 'text', required: true, placeholder: 'Enter tagline' },
    { name: 'address', label: 'Address', type: 'textarea', required: true, placeholder: 'Enter address', rows: 3 },
    { name: 'city', label: 'City', type: 'text', required: true, placeholder: 'Enter city' },
    { name: 'state', label: 'State', type: 'text', required: true, placeholder: 'Enter state' },
    { name: 'zipCode', label: 'ZIP Code', type: 'text', required: true, placeholder: 'Enter ZIP code' },
    { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: 'Enter phone number' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'Enter email' },
    { name: 'logo', label: 'Company Logo', type: 'file' },
  ];

  const notificationFields = [
    {
      name: 'emailNotifications',
      label: 'Email Notifications',
      type: 'checkbox',
      checkboxLabel: 'Receive email notifications for new enquiries',
    },
    {
      name: 'projectUpdates',
      label: 'Project Updates',
      type: 'checkbox',
      checkboxLabel: 'Receive notifications for project updates',
    },
    {
      name: 'blogComments',
      label: 'Blog Comments',
      type: 'checkbox',
      checkboxLabel: 'Receive notifications for new blog comments',
    },
    {
      name: 'weeklyReport',
      label: 'Weekly Report',
      type: 'checkbox',
      checkboxLabel: 'Receive weekly activity reports',
    },
  ];

  const securityFields = [
    { name: 'currentPassword', label: 'Current Password', type: 'text', required: true, placeholder: 'Enter current password' },
    { name: 'newPassword', label: 'New Password', type: 'text', required: true, placeholder: 'Enter new password' },
    { name: 'confirmPassword', label: 'Confirm Password', type: 'text', required: true, placeholder: 'Confirm new password' },
  ];

  const appearanceFields = [
    {
      name: 'primaryColor',
      label: 'Primary Color',
      type: 'select',
      required: true,
      options: [
        { value: 'emerald', label: 'Emerald' },
        { value: 'blue', label: 'Blue' },
        { value: 'purple', label: 'Purple' },
        { value: 'orange', label: 'Orange' },
      ],
    },
    {
      name: 'theme',
      label: 'Theme',
      type: 'select',
      required: true,
      options: [
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
        { value: 'system', label: 'System' },
      ],
    },
  ];

  const seoFields = [
    { name: 'metaTitle', label: 'Meta Title', type: 'text', required: true, placeholder: 'Enter meta title' },
    { name: 'metaDescription', label: 'Meta Description', type: 'textarea', required: true, placeholder: 'Enter meta description', rows: 3 },
    { name: 'keywords', label: 'Keywords', type: 'textarea', required: true, placeholder: 'Enter keywords (comma separated)', rows: 2 },
    { name: 'ogImage', label: 'OG Image', type: 'file' },
  ];

  const getFields = () => {
    switch (activeTab) {
      case 'profile':
        return profileFields;
      case 'company':
        return companyFields;
      case 'notifications':
        return notificationFields;
      case 'security':
        return securityFields;
      case 'appearance':
        return appearanceFields;
      case 'seo':
        return seoFields;
      default:
        return profileFields;
    }
  };

  const handleSubmit = (data) => {
    console.log('Settings updated:', data);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your account and application settings
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-6 py-4 transition-colors ${
                      activeTab === tab.id
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-l-4 border-emerald-600'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-l-4 border-transparent'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                {tabs.find((t) => t.id === activeTab)?.label} Settings
              </h2>

              <Form
                fields={getFields()}
                onSubmit={handleSubmit}
                submitText="Save Changes"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
