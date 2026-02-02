import React, { useRef } from 'react';
import { Upload, Maximize2, Move } from 'lucide-react';
import { ImageItem } from '../types';

interface OverlayProps {
  onUpload: (newImages: ImageItem[]) => void;
}

export const Overlay: React.FC<OverlayProps> = ({ onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages: ImageItem[] = Array.from(e.target.files).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        url: URL.createObjectURL(file)
      }));
      onUpload(newImages);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-40 flex flex-col justify-between p-6">
      {/* Top Header */}
      <div className="flex justify-between items-start w-full">
        <div className="pointer-events-auto">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all font-medium text-sm border border-gray-100"
          >
            <Upload size={16} />
            UPLOAD GALLERY
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            multiple 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        <div className="flex gap-4 text-xs font-semibold text-gray-500 tracking-widest bg-white/80 backdrop-blur px-4 py-2 rounded-full border border-gray-100 shadow-sm">
            <span className="flex items-center gap-1"><Maximize2 size={12} /> PINCH TO ZOOM</span>
            <span className="text-gray-300">•</span>
            <span className="flex items-center gap-1"><Move size={12} /> MOVE TO ROTATE</span>
        </div>
      </div>

      {/* Center visual hint is handled by the scene content */}
      <div></div>
    </div>
  );
};
