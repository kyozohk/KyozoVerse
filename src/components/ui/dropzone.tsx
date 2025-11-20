
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useDropzone, Accept } from 'react-dropzone';
import { UploadCloud, X, File, Music, Video } from 'lucide-react';
import { Button } from './button';
import Image from 'next/image';

interface DropzoneProps {
  onFileChange: (file: File | null) => void;
  file: File | null;
  accept?: Accept;
  fileType?: 'image' | 'audio' | 'video' | 'text';
  existingImageUrl?: string | null;
}

export function Dropzone({ onFileChange, file, accept, fileType = 'image', existingImageUrl }: DropzoneProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    // If a file is selected, create a URL for it
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      // Clean up the object URL on unmount or file change
      return () => URL.revokeObjectURL(url);
    } else if (existingImageUrl) {
      setPreviewUrl(existingImageUrl);
    } else {
      setPreviewUrl(null);
    }
  }, [file, existingImageUrl]);
  
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (acceptedFiles?.length) {
      const selectedFile = acceptedFiles[0];
      
      const maxSizeInBytes = selectedFile.type.startsWith('video/') 
        ? 100 * 1024 * 1024
        : selectedFile.type.startsWith('audio/') 
          ? 20 * 1024 * 1024
          : 10 * 1024 * 1024;
      
      if (selectedFile.size > maxSizeInBytes) {
        const maxSizeMB = maxSizeInBytes / (1024 * 1024);
        alert(`File too large. Maximum size for ${selectedFile.type.split('/')[0]} files is ${maxSizeMB}MB`);
        return;
      }
      
      onFileChange(selectedFile);
    }
    
    if (rejectedFiles?.length) {
      console.error('Rejected files:', rejectedFiles);
      alert(`File not accepted. Please check the file type and try again.`);
    }
  }, [onFileChange, fileType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
  });
  
  const getPreview = () => {
      if (!previewUrl) return null;
      
      switch(fileType) {
          case 'image':
            return <Image src={previewUrl} alt="Preview" fill className="object-cover rounded-md" />;
          case 'video':
            return (
              <div className="flex flex-col items-center justify-center h-full w-full">
                <video 
                  src={previewUrl} 
                  controls 
                  className="w-full max-h-48 object-contain rounded-md bg-black" 
                  onError={(e) => console.error('Video preview error:', e)}
                />
                <div className="mt-2 text-center w-full">
                  <p className="font-semibold truncate w-full">{file?.name || 'Video Preview'}</p>
                  {file && <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>}
                </div>
              </div>
            );
          case 'audio':
            return (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <Music className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="font-semibold truncate w-full">{file?.name || 'Audio Preview'}</p>
                {file && <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>}
                <audio 
                  src={previewUrl} 
                  controls 
                  className="w-full mt-4" 
                  onError={(e) => console.error('Audio preview error:', e)}
                />
              </div>
            );
          default:
            return (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <File className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="font-semibold truncate w-full">{file?.name || 'File Preview'}</p>
                {file && <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>}
              </div>
            )
      }
  }

  return (
    <div className="w-full">
      {!previewUrl ? (
        <div
          {...getRootProps()}
          className={`flex justify-center items-center w-full h-36 rounded-lg border-2 border-dashed border-input p-6 cursor-pointer transition-colors ${isDragActive ? 'bg-accent' : 'bg-muted/50'}`}
        >
          <input {...getInputProps()} />
          <div className="text-center">
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              <span className="font-semibold text-primary">Click to upload</span> or drag and drop
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
                {fileType === 'image' && 'PNG, JPG, GIF up to 10MB'}
                {fileType === 'video' && 'MP4, MOV, WEBM up to 100MB'}
                {fileType === 'audio' && 'MP3, WAV, M4A up to 20MB'}
            </p>
          </div>
        </div>
      ) : (
        <div className="relative w-full h-36 rounded-md border bg-muted flex items-center justify-center">
          {getPreview()}
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7"
            onClick={(e) => {
                e.stopPropagation();
                onFileChange(null)
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
