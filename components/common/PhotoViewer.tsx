'use client';

import { useEffect } from 'react';
import { X, ZoomIn } from 'lucide-react';

interface PhotoViewerProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export default function PhotoViewer({ src, alt = 'Image', onClose }: PhotoViewerProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>

      {/* ESC hint */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/40 text-xs font-bold uppercase tracking-widest">
        Press ESC or click outside to close
      </div>

      {/* Image */}
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200"
      />
    </div>
  );
}
