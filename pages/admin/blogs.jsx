import { useState } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';
import Table from '../../components/admin/Table';
import Modal from '../../components/admin/Modal';
import Form from '../../components/admin/Form';
import { Plus, Edit, Trash2, Calendar, Eye, FileText } from 'lucide-react';

export default function BlogsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [viewMode, setViewMode] = useState(false);

  const blogs = [
    {
      id: 1,
      title: 'Modern Interior Design Trends for 2024',
      author: 'Admin',
      category: 'Interior Design',
      status: 'published',
      publishedAt: '2024-01-15',
      views: 1250,
      excerpt: 'Discover the latest interior design trends that are shaping homes and offices in 2024.',
    },
    {
      id: 2,
      title: 'Sustainable Construction Practices',
      author: 'Admin',
      category: 'Construction',
      status: 'published',
      publishedAt: '2024-01-10',
      views: 890,
      excerpt: 'Learn about eco-friendly construction methods that are revolutionizing the industry.',
    },
    {
      id: 3,
      title: 'Kitchen Renovation Ideas',
      author: 'Admin',
      category: 'Renovation',
      status: 'draft',
      publishedAt: null,
      views: 0,
      excerpt: 'Transform your kitchen with these innovative renovation ideas and designs.',
    },
    {
      id: 4,
      title: 'Commercial Space Planning',
      author: 'Admin',
      category: 'Commercial',
      status: 'published',
      publishedAt: '2024-01-05',
      views: 1567,
      excerpt: 'Essential tips for planning and designing efficient commercial spaces.',
    },
    {
      id: 5,
      title: 'Luxury Villa Design Guide',
      author: 'Admin',
      category: 'Luxury',
      status: 'draft',
      publishedAt: null,
      views: 0,
      excerpt: 'A comprehensive guide to designing luxury villas with modern amenities.',
    },
  ];

  const columns = [
    { key: 'title', label: 'Title', sortable: true },
    { key: 'author', label: 'Author', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (status) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            status === 'published'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
          }`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      ),
    },
    {
      key: 'views',
      label: 'Views',
      sortable: true,
      render: (views) => views.toLocaleString(),
    },
    {
      key: 'publishedAt',
      label: 'Published',
      sortable: true,
      render: (date) => (date ? new Date(date).toLocaleDateString() : '-'),
    },
  ];

  const handleViewBlog = (blog) => {
    setSelectedBlog(blog);
    setViewMode(true);
    setIsModalOpen(true);
  };

  const handleNewBlog = () => {
    setSelectedBlog(null);
    setViewMode(false);
    setIsModalOpen(true);
  };

  const formFields = [
    { name: 'title', label: 'Blog Title', type: 'text', required: true, placeholder: 'Enter blog title' },
    { name: 'author', label: 'Author', type: 'text', required: true, placeholder: 'Enter author name' },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      required: true,
      options: [
        { value: 'Interior Design', label: 'Interior Design' },
        { value: 'Construction', label: 'Construction' },
        { value: 'Renovation', label: 'Renovation' },
        { value: 'Commercial', label: 'Commercial' },
        { value: 'Luxury', label: 'Luxury' },
      ],
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'published', label: 'Published' },
      ],
    },
    {
      name: 'excerpt',
      label: 'Excerpt',
      type: 'textarea',
      required: true,
      placeholder: 'Enter blog excerpt',
      rows: 3,
    },
    {
      name: 'content',
      label: 'Content',
      type: 'textarea',
      required: true,
      placeholder: 'Enter blog content',
      rows: 10,
    },
    { name: 'featuredImage', label: 'Featured Image', type: 'file' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Blogs</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage blog posts and articles
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNewBlog}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Blog Post
          </motion.button>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          data={blogs}
          onRowClick={handleViewBlog}
          pagination
          searchable
          filterable
        />

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={viewMode ? 'Blog Details' : 'Add New Blog Post'}
          size="lg"
        >
          {viewMode && selectedBlog ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {selectedBlog.title}
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>By {selectedBlog.author}</span>
                  <span>•</span>
                  <span>{selectedBlog.category}</span>
                  {selectedBlog.publishedAt && (
                    <>
                      <span>•</span>
                      <span>{new Date(selectedBlog.publishedAt).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <Eye className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Views</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedBlog.views.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedBlog.status.charAt(0).toUpperCase() + selectedBlog.status.slice(1)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Excerpt</h3>
                <p className="text-gray-600 dark:text-gray-400">{selectedBlog.excerpt}</p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  <Edit className="w-4 h-4" />
                  Edit Blog
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                  Delete Blog
                </button>
              </div>
            </div>
          ) : (
            <Form
              fields={formFields}
              onSubmit={(data) => {
                console.log('New blog:', data);
                setIsModalOpen(false);
              }}
              submitText="Publish Blog"
            />
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
