import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';
import { Upload, X, FileText, Image as ImageIcon, Video, Trash2, Loader2, Search, Copy, Eye, Filter, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UploadsPage() {
  const [dragActive, setDragActive] = useState(false);
  const [uploads, setUploads] = useState([]);
  const [filteredUploads, setFilteredUploads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [previewModal, setPreviewModal] = useState(null);

  useEffect(() => {
    fetchUploads();
  }, []);

  useEffect(() => {
    filterUploads();
  }, [uploads, searchQuery, filterType]);

  const filterUploads = () => {
    let filtered = uploads;

    if (filterType !== 'all') {
      filtered = filtered.filter(u => u.type === filterType);
    }

    if (searchQuery) {
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredUploads(filtered);
  };
  const fetchUploads = async () => {
  setLoading(true);
  try {
    const response = await fetch('/api/upload/files');
    const data = await response.json();

    console.log("UPLOAD API RESPONSE:", data);

      if (data.success) {
      setUploads(data.files);
      }
    } catch (error) {
    console.error('Error fetching uploads:', error);
    toast.error('Failed to fetch uploads');
  } finally {
    setLoading(false);
  }
};

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFiles = async (files) => {
    setUploading(true);
    setUploadProgress(0);

    for (let i = 0; i < files.length; i++) {
      await uploadFile(files[i]);
      setUploadProgress(((i + 1) / files.length) * 100);
    }

    await fetchUploads();
    setUploading(false);
    setUploadProgress(0);
    toast.success(`${files.length} file(s) uploaded successfully`);
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      return data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
    e.target.value = '';
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    
    try {
      const response = await fetch(`/api/upload/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await fetchUploads();
        toast.success('File deleted successfully');
      } else {
        toast.error('Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Error deleting file');
    }
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upload Manager</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage images and videos
          </p>
        </div>

        {/* Upload Area */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
            dragActive
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-emerald-500 dark:hover:border-emerald-500'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
              {uploading ? (
                <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {uploading ? 'Uploading files...' : 'Drag and drop files here'}
              </p>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                or click to browse from your computer
              </p>
            </div>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
              disabled={uploading}
            />
            <label
              htmlFor="file-upload"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Select Files'}
            </label>
            {uploading && (
              <div className="w-full max-w-xs">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{Math.round(uploadProgress)}%</p>
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Images: JPG, PNG, WEBP (Max 10MB) | Videos: MP4, MOV, WEBM (Max 100MB)
            </p>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Files</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>
        </div>

        {/* Files Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Uploaded Files ({filteredUploads.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
          ) : filteredUploads.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {uploads.length === 0 ? 'No files uploaded yet' : 'No files match your filters'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {filteredUploads.map((upload, index) => (
                <motion.div
                  key={upload.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-square relative">
                    {upload.type === 'image' ? (
                      <img
                        src={upload.url}
                        alt={upload.name}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setPreviewModal(upload)}
                      />
                    ) : (
                      <div 
                        className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center cursor-pointer"
                        onClick={() => setPreviewModal(upload)}
                      >
                        <Video className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        onClick={() => setPreviewModal(upload)}
                        className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCopyUrl(upload.url)}
                        className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
                        title="Copy URL"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(upload.id)}
                        className="p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate" title={upload.name}>
                      {upload.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <span>{formatFileSize(upload.size)}</span>
                      <span>•</span>
                      <span>{new Date(upload.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        upload.type === 'image'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      }`}>
                        {upload.type}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Preview Modal */}
        <AnimatePresence>
          {previewModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setPreviewModal(null)}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="max-w-4xl max-h-[90vh] overflow-hidden"
              >
                {previewModal.type === 'image' ? (
                  <img
                    src={previewModal.url}
                    alt={previewModal.name}
                    className="max-w-full max-h-[90vh] object-contain"
                  />
                ) : (
                  <video
                    src={previewModal.url}
                    controls
                    className="max-w-full max-h-[90vh]"
                  />
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}
