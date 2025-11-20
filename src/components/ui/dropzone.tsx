
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useDropzone, Accept } from 'react-dropzone';
import { UploadCloud, X, File, Music, Video } from 'lucide-react';
import { Button } from './button';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface DropzoneProps {
  onFileChange: (file: File | null) => void;
  file: File | null;
  accept?: Accept;
  fileType?: 'image' | 'audio' | 'video' | 'text';
  existingImageUrl?: string | null;
  label?: string;
  className?: string;
}

export function Dropzone({ onFileChange, file, accept, fileType = 'image', existingImageUrl, label, className }: DropzoneProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
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
                  className="w-full max-h-24 object-contain rounded-md bg-black" 
                  onError={(e) => console.error('Video preview error:', e)}
                />
                <div className="mt-2 text-center w-full">
                  <p className="font-semibold truncate w-full text-xs">{file?.name || 'Video Preview'}</p>
                </div>
              </div>
            );
          case 'audio':
            return (
              <div className="flex flex-col items-center justify-center h-full text-center p-2">
                <Music className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="font-semibold truncate w-full text-xs">{file?.name || 'Audio Preview'}</p>
                <audio 
                  src={previewUrl} 
                  controls 
                  className="w-full mt-2" 
                  onError={(e) => console.error('Audio preview error:', e)}
                />
              </div>
            );
          default:
            return (
              <div className="flex flex-col items-center justify-center h-full text-center p-2">
                <File className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="font-semibold truncate w-full text-xs">{file?.name || 'File Preview'}</p>
              </div>
            )
      }
  }

  const id = React.useId();

  return (
    <div className="inputWrapper">
        <div
          {...getRootProps()}
          className={cn(
              "relative flex justify-center items-center w-full h-32 rounded-lg border border-dotted p-4 cursor-pointer transition-colors",
              isDragActive ? 'bg-accent' : 'bg-muted/10',
              className
          )}
          style={{ borderWidth: '1px', borderColor: 'var(--input-border-color, #C170CF)' }}
        >
        <input {...getInputProps()} id={id} />

        {label && (
          <label htmlFor={id} className="floatingLabel" style={{ top: '-0.7rem', fontSize: '0.75rem', backgroundColor: '#EDEDED', color: 'var(--input-border-color, #C170CF)' }}>
            {label}
          </label>
        )}

        {!previewUrl ? (
            <div className="text-center">
                <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    {fileType === 'image' && 'PNG, JPG, GIF up to 10MB'}
                    {fileType === 'video' && 'MP4, MOV, WEBM up to 100MB'}
                    {fileType === 'audio' && 'MP3, WAV, M4A up to 20MB'}
                </p>
            </div>
        ) : (
            <div className="relative w-full h-full rounded-md flex items-center justify-center overflow-hidden">
                {getPreview()}
                <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 z-10"
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
    </div>
  );
}
