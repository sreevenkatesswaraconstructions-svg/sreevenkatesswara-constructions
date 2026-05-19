import { useState } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';
import { Upload, X, FileText, Image as ImageIcon, Download, Trash2 } from 'lucide-react';

export default function UploadsPage() {
  const [dragActive, setDragActive] = useState(false);
  const [uploads, setUploads] = useState([
    {
      id: 1,
      name: 'project-1-image.jpg',
      type: 'image',
      size: '2.4 MB',
      uploadedAt: '2024-01-15',
      url: '/images/project-1.jpg',
    },
    {
      id: 2,
      name: 'project-2-image.jpg',
      type: 'image',
      size: '3.1 MB',
      uploadedAt: '2024-01-14',
      url: '/images/project-2.jpg',
    },
    {
      id: 3,
      name: 'company-brochure.pdf',
      type: 'document',
      size: '5.2 MB',
      uploadedAt: '2024-01-13',
      url: '/documents/brochure.pdf',
    },
    {
      id: 4,
      name: 'logo-transparent.png',
      type: 'image',
      size: '156 KB',
      uploadedAt: '2024-01-12',
      url: '/images/logo.png',
    },
    {
      id: 5,
      name: 'project-proposal.docx',
      type: 'document',
      size: '1.8 MB',
      uploadedAt: '2024-01-11',
      url: '/documents/proposal.docx',
    },
  ]);

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
    
    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const handleFiles = (files) => {
    // Handle file upload logic here
    console.log('Files to upload:', files);
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    handleFiles(files);
  };

  const handleDelete = (id) => {
    setUploads(uploads.filter((upload) => upload.id !== id));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upload Manager</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage images, documents, and other files
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
              <Upload className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                Drag and drop files here
              </p>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                or click to browse from your computer
              </p>
            </div>
            <input
              type="file"
              multiple
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg cursor-pointer transition-colors"
            >
              Select Files
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Supported formats: JPG, PNG, PDF, DOC, DOCX (Max 10MB)
            </p>
          </div>
        </motion.div>

        {/* Files Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Uploaded Files ({uploads.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {uploads.map((upload, index) => (
              <motion.div
                key={upload.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    {upload.type === 'image' ? (
                      <ImageIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    ) : (
                      <FileText className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {upload.name}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                      <span>{upload.size}</span>
                      <span>•</span>
                      <span>{new Date(upload.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(upload.id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Storage Info */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Storage Usage</h3>
              <p className="text-emerald-100 mt-1">12.5 GB of 50 GB used</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">25%</p>
              <p className="text-emerald-100 text-sm">Used</p>
            </div>
          </div>
          <div className="mt-4 bg-emerald-800/50 rounded-full h-2">
            <div className="bg-white rounded-full h-2 w-1/4" />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
