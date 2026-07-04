import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';
import MediaPicker from '../../components/admin/MediaPicker';
import RichTextEditor from '../../components/admin/RichTextEditor';
import { Plus, Edit, Trash2, Eye, Search, Filter, Calendar, FileText, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function BlogsPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // 'view', 'create', 'edit'
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalOpenCounter, setModalOpenCounter] = useState(0);
  
  // Toast state
  const [toast, setToast] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    author: 'Admin',
    category: 'Interior Design',
    status: 'draft',
    excerpt: '',
    content: '',
    tags: '',
    metaTitle: '',
    metaDescription: '',
    featured: false,
    featuredImage: '',
  });

  // Categories
  const categories = ['Interior Design', 'Construction', 'Renovation', 'Commercial', 'Luxury'];

  // Toast helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/blogs');
      const result = await response.json();
      
      if (result.success) {
        setBlogs(result.data || []);
      } else {
        setError(result.message || 'Failed to fetch blogs');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('[BLOGS] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleCreateBlog = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const featuredImageUrl = formData.featuredImage || selectedMedia.length > 0 ? selectedMedia[0].url : null;
      
      if (!featuredImageUrl) {
        showToast('Please select a featured image', 'error');
        setIsSubmitting(false);
        return;
      }
      
      const slug = generateSlug(formData.title);

      const payload = {
        title: formData.title,
        slug,
        content: formData.content,
        excerpt: formData.excerpt || null,
        author: formData.author,
        category: formData.category,
        tags: formData.tags || null,
        featuredImage: featuredImageUrl,
        metaTitle: formData.metaTitle || null,
        metaDescription: formData.metaDescription || null,
        published: formData.status === 'published',
        featured: formData.featured,
      };

      const response = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        closeModal();
        fetchBlogs();
        showToast('Blog created successfully!', 'success');
      } else {
        showToast(result.message || 'Failed to create blog', 'error');
      }
    } catch (err) {
      showToast('Error creating blog. Please try again.', 'error');
      console.error('[BLOGS] Create error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBlog = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const featuredImageUrl = formData.featuredImage || selectedMedia.length > 0 ? selectedMedia[0].url : selectedBlog.featuredImage;
      const slug = formData.slug || generateSlug(formData.title);

      const payload = {
        id: selectedBlog.id,
        title: formData.title,
        slug,
        content: formData.content,
        excerpt: formData.excerpt || null,
        author: formData.author,
        category: formData.category,
        tags: formData.tags || null,
        featuredImage: featuredImageUrl,
        metaTitle: formData.metaTitle || null,
        metaDescription: formData.metaDescription || null,
        published: formData.status === 'published',
        featured: formData.featured,
      };

      const response = await fetch('/api/blogs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        closeModal();
        fetchBlogs();
        showToast('Blog updated successfully!', 'success');
      } else {
        showToast(result.message || 'Failed to update blog', 'error');
      }
    } catch (err) {
      showToast('Error updating blog. Please try again.', 'error');
      console.error('[BLOGS] Update error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBlog = async (blogId) => {
    if (!confirm('Are you sure you want to delete this blog? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/blogs?id=${blogId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        closeModal();
        fetchBlogs();
        showToast('Blog deleted successfully!', 'success');
      } else {
        showToast(result.message || 'Failed to delete blog', 'error');
      }
    } catch (err) {
      showToast('Error deleting blog. Please try again.', 'error');
      console.error('[BLOGS] Delete error:', err);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedBlog(null);
    setSelectedMedia([]);
    setFormData({
      title: '',
      author: 'Admin',
      category: 'Interior Design',
      status: 'draft',
      excerpt: '',
      content: '',
      tags: '',
      metaTitle: '',
      metaDescription: '',
      featured: false,
      featuredImage: '',
    });
    setModalOpenCounter(prev => prev + 1);
    setIsModalOpen(true);
  };

  const openViewModal = (blog) => {
    setModalMode('view');
    setSelectedBlog(blog);
    setModalOpenCounter(prev => prev + 1);
    setIsModalOpen(true);
  };

  const openEditModal = (blog) => {
    setModalMode('edit');
    setSelectedBlog(blog);
    setSelectedMedia(blog.featuredImage ? [{ url: blog.featuredImage, id: 'existing', name: 'Featured Image' }] : []);
    setFormData({
      title: blog.title,
      author: blog.author,
      category: blog.category,
      status: blog.published ? 'published' : 'draft',
      excerpt: blog.excerpt || '',
      content: blog.content,
      tags: blog.tags || '',
      metaTitle: blog.metaTitle || '',
      metaDescription: blog.metaDescription || '',
      featured: blog.featured || false,
      featuredImage: blog.featuredImage || '',
    });
    setModalOpenCounter(prev => prev + 1);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalMode('view');
    setSelectedBlog(null);
    setSelectedMedia([]);
  };

  // Filter blogs
  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         blog.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || blog.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'published' && blog.published) ||
                         (statusFilter === 'draft' && !blog.published);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchBlogs} className="px-4 py-2 bg-emerald-600 text-white rounded-lg">
            Retry
          </button>
        </div>
      </AdminLayout>
    );
  }

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
            onClick={openCreateModal}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Blog Post
          </motion.button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search blogs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {/* Blog List */}
        {filteredBlogs.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {blogs.length === 0 ? 'No blogs yet. Create your first blog post!' : 'No blogs match your filters.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredBlogs.map((blog) => (
              <motion.div
                key={blog.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {blog.featuredImage && (
                    <img
                      src={blog.featuredImage}
                      alt={blog.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {blog.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          By {blog.author} • {blog.category}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              blog.published
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                            }`}
                          >
                            {blog.published ? 'Published' : 'Draft'}
                          </span>
                          {blog.featured && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openViewModal(blog)}
                          className="p-2 text-gray-600 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors"
                          title="View"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => openEditModal(blog)}
                          className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBlog(blog.id)}
                          className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      Created: {new Date(blog.createdAt).toLocaleDateString()}
                      {blog.publishedAt && ` • Published: ${new Date(blog.publishedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {modalMode === 'view' ? 'Blog Details' : modalMode === 'create' ? 'Create Blog' : 'Edit Blog'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {modalMode === 'view' && selectedBlog ? (
                  <div className="space-y-6">
                    {selectedBlog.featuredImage && (
                      <img
                        src={selectedBlog.featuredImage}
                        alt={selectedBlog.title}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {selectedBlog.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>By {selectedBlog.author}</span>
                        <span>•</span>
                        <span>{selectedBlog.category}</span>
                        <span>•</span>
                        <span>{new Date(selectedBlog.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {selectedBlog.excerpt && (
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Excerpt</h4>
                        <p className="text-gray-600 dark:text-gray-400">{selectedBlog.excerpt}</p>
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Content</h4>
                      <div 
                        className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                        dangerouslySetInnerHTML={{ __html: selectedBlog.content }}
                      />
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => openEditModal(selectedBlog)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Blog
                      </button>
                      <button
                        onClick={() => handleDeleteBlog(selectedBlog.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Blog
                      </button>
                    </div>
                  </div>
                ) : (
                  <form key={modalOpenCounter} onSubmit={modalMode === 'create' ? handleCreateBlog : handleUpdateBlog} className="space-y-6">
                    {/* Featured Image */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Featured Image <span className="text-red-500">*</span>
                      </label>
                      <MediaPicker
                        type="image"
                        selected={selectedMedia}
                        onChange={(media) => {
                          setSelectedMedia(media);
                          // Update formData with image URL
                          if (media.length > 0) {
                            setFormData({ ...formData, featuredImage: media[0].url });
                          } else {
                            setFormData({ ...formData, featuredImage: '' });
                          }
                        }}
                        maxSelect={1}
                      />
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    {/* Author */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Author <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.author}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>

                    {/* Featured Toggle */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="featured"
                        checked={formData.featured}
                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
                      />
                      <label htmlFor="featured" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Featured Blog
                      </label>
                    </div>

                    {/* Excerpt */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Excerpt <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={formData.excerpt}
                        onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                        required
                      />
                    </div>

                    {/* Content */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Content <span className="text-red-500">*</span>
                      </label>
                      <RichTextEditor
                        value={formData.content}
                        onChange={(value) => setFormData({ ...formData, content: value })}
                        placeholder="Write your blog content..."
                      />
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tags
                      </label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        placeholder="Enter tags separated by commas"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    {/* SEO Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Meta Title
                        </label>
                        <input
                          type="text"
                          value={formData.metaTitle}
                          onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                          placeholder="SEO meta title"
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Meta Description
                        </label>
                        <textarea
                          value={formData.metaDescription}
                          onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                          rows={2}
                          placeholder="SEO meta description"
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          modalMode === 'create' ? 'Create Blog' : 'Update Blog'
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 50, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 50, x: '-50%' }}
              className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 ${
                toast.type === 'success' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-red-600 text-white'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}
