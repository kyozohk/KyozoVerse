"use client";

import { useState } from 'react';
import { UploadCloud, Edit } from 'lucide-react';

interface ImageUploaderProps {
  onFileChange: (file: File | null) => void;
}

export function ImageUploader({ onFileChange }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      onFileChange(file);
    }
  };

  const openFilePicker = () => {
    document.getElementById('banner-upload')?.click();
  }

  return (
    <div>
      <input 
        id="banner-upload"
        type="file" 
        accept="image/*" 
        onChange={handleFileChange}
        className="hidden"
      />
      {preview ? (
        <div className="relative h-48 w-full rounded-lg overflow-hidden group">
          <img src={preview} alt="Banner preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={openFilePicker} className="text-white flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                <Edit className="h-4 w-4" />
                Change Banner
            </button>
          </div>
        </div>
      ) : (
        <div 
            onClick={openFilePicker}
            className="h-48 w-full rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50/50"
        >
          <UploadCloud className="h-10 w-10 text-gray-400 mb-2" />
          <span className="text-gray-500 font-medium">Upload Community Banner</span>
          <span className="text-xs text-gray-400">16:9 ratio recommended</span>
        </div>
      )}
    </div>
  );
}
