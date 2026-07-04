import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Image as ImageIcon, Video, Check, Loader2 } from 'lucide-react';

export default function MediaPicker({ 
  type = 'image', 
  selected = [], 
  onChange, 
  maxSelect = 10 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState(selected);

  useEffect(() => {
    setSelectedFiles(selected);
  }, [selected]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/upload/files?type=${type}`);
      const data = await response.json();
      if (data.success) {
        setFiles(data.files);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    fetchFiles();
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery('');
  };

  const toggleSelection = (file) => {
    const isSelected = selectedFiles.some(f => f.id === file.id);
    let newSelected;

    if (isSelected) {
      newSelected = selectedFiles.filter(f => f.id !== file.id);
    } else {
      if (selectedFiles.length >= maxSelect) {
        alert(`You can select maximum ${maxSelect} files`);
        return;
      }
      newSelected = [...selectedFiles, file];
    }

    setSelectedFiles(newSelected);
    onChange(newSelected);
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const removeSelected = (fileId) => {
    const newSelected = selectedFiles.filter(f => f.id !== fileId);
    setSelectedFiles(newSelected);
    onChange(newSelected);
  };

  return (
    <div className="space-y-4">
      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {selectedFiles.map((file) => (
            <div key={file.id} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border-2 border-emerald-500">
                {type === 'image' ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <Video className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <button
                onClick={() => removeSelected(file.id)}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                {file.name}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Select Button */}
      <button
        type="button"
        onClick={handleOpen}
        className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-emerald-500 dark:hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center justify-center gap-2"
      >
        {type === 'image' ? (
          <>
            <ImageIcon className="w-5 h-5" />
            Select Images
          </>
        ) : (
          <>
            <Video className="w-5 h-5" />
            Select Videos
          </>
        )}
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Select {type === 'image' ? 'Images' : 'Videos'}
                  </h2>
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Files Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                  </div>
                ) : filteredFiles.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600 dark:text-gray-400">
                      {searchQuery ? 'No files found' : 'No files uploaded yet'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredFiles.map((file) => {
                      const isSelected = selectedFiles.some(f => f.id === file.id);
                      return (
                        <motion.div
                          key={file.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => toggleSelection(file)}
                          className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                            isSelected
                              ? 'border-emerald-500 ring-2 ring-emerald-500 ring-offset-2'
                              : 'border-gray-200 dark:border-gray-700 hover:border-emerald-500'
                          }`}
                        >
                          {type === 'image' ? (
                            <img
                              src={file.url}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <Video className="w-12 h-12 text-gray-400" />
                            </div>
                          )}
                          
                          {/* Selection Indicator */}
                          {isSelected && (
                            <div className="absolute top-2 right-2 p-1.5 bg-emerald-500 rounded-full">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}

                          {/* File Name Overlay */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <p className="text-white text-xs truncate">{file.name}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedFiles.length} selected
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
