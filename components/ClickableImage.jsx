import { useState } from 'react';
import { motion } from 'framer-motion';
import Lightbox from './Lightbox';

export default function ClickableImage({ 
  src, 
  alt, 
  className = '', 
  aspectRatio = 'aspect-video',
  rounded = 'rounded-xl'
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!src) return null;

  return (
    <>
      <motion.div
        className={`relative ${aspectRatio} bg-gray-100 dark:bg-gray-800 ${rounded} overflow-hidden shadow-lg ${className}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform duration-300"
          onClick={() => setLightboxOpen(true)}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors pointer-events-none" />
      </motion.div>

      <Lightbox
        images={[src]}
        initialIndex={0}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
