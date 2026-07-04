import { useState } from 'react';
import { motion } from 'framer-motion';
import Lightbox from './Lightbox';

export default function ImageGallery({ images, className = '' }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const handleImageClick = (index) => {
    setSelectedIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className={`image-gallery ${className}`}>
      {/* Main Image */}
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg">
        <motion.img
          src={images[0]}
          alt="Main project image"
          className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform duration-300"
          onClick={() => handleImageClick(0)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          loading="lazy"
        />
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-white text-sm">
            {images.length} photos
          </div>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-4 md:grid-cols-6 gap-3">
          {images.map((image, index) => (
            <motion.button
              key={index}
              onClick={() => handleImageClick(index)}
              className="relative aspect-square rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <img
                src={image}
                alt={`Project image ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors" />
            </motion.button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Lightbox
        images={images}
        initialIndex={selectedIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
