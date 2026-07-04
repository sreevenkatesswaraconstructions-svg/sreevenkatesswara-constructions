import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Minimize2 } from 'lucide-react';

export default function Lightbox({ images, initialIndex = 0, isOpen, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // Reset zoom and position when image changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [initialIndex, isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  // Mouse wheel zoom
  useEffect(() => {
    const handleWheel = (e) => {
      if (!isOpen) return;
      e.preventDefault();
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        handleZoomOut();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [isOpen]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [images.length]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.5, 1));
  };

  const handleDoubleClick = () => {
    if (zoom === 1) {
      setZoom(2);
    } else {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging && zoom > 1 && e.touches.length === 1) {
      e.preventDefault();
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Swipe detection for mobile
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleSwipeStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleSwipeMove = (e) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const handleSwipeEnd = () => {
    const swipeDistance = touchStart - touchEnd;
    if (swipeDistance > 50) {
      goToNext();
    } else if (swipeDistance < -50) {
      goToPrevious();
    }
  };

  if (!isOpen || !images.length) return null;

  const currentImage = images[currentIndex];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={(e) => {
            handleTouchStart(e);
            handleSwipeStart(e);
          }}
          onTouchMove={(e) => {
            handleTouchMove(e);
            handleSwipeMove(e);
          }}
          onTouchEnd={() => {
            handleTouchEnd();
            handleSwipeEnd();
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all duration-200 hover:scale-110"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all duration-200 hover:scale-110"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all duration-200 hover:scale-110"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Zoom Controls */}
          <div className="absolute bottom-4 right-4 z-50 flex gap-2">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 5}
              className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setPosition({ x: 0, y: 0 });
              }}
              className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all duration-200 hover:scale-110"
              aria-label="Reset zoom"
            >
              {zoom === 1 ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
            </button>
          </div>

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute top-4 left-4 z-50 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white text-sm font-medium">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* Main Image */}
          <div className="flex items-center justify-center w-full h-full p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative max-w-full max-h-full"
              style={{
                transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
              }}
              onDoubleClick={handleDoubleClick}
            >
              <img
                ref={imageRef}
                src={currentImage}
                alt={`Image ${currentIndex + 1}`}
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl cursor-grab active:cursor-grabbing"
                draggable={false}
              />
            </motion.div>
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 p-2 bg-black/50 backdrop-blur-md rounded-xl overflow-x-auto max-w-[90vw]">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index);
                    setZoom(1);
                    setPosition({ x: 0, y: 0 });
                  }}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all duration-200 ${
                    index === currentIndex
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
