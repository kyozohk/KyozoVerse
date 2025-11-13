
'use client';

import React, { useCallback } from 'react';
import { useDropzone, Accept } from 'react-dropzone';
import { UploadCloud, X, File, Music, Video } from 'lucide-react';
import { Button } from './button';

interface DropzoneProps {
  onFileChange: (file: File | null) => void;
  file: File | null;
  accept?: Accept;
  fileType?: 'image' | 'audio' | 'video' | 'text';
}

export function Dropzone({ onFileChange, file, accept, fileType = 'image' }: DropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles?.length) {
      onFileChange(acceptedFiles[0]);
    }
  }, [onFileChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
  });
  
  const getPreview = () => {
      if (!file) return null;
      
      const fileUrl = URL.createObjectURL(file);
      
      switch(fileType) {
          case 'image':
            return <img src={fileUrl} alt="Preview" className="w-full h-full object-contain rounded-md" />;
          case 'video':
            return <video src={fileUrl} controls className="w-full h-full object-contain rounded-md" />;
          case 'audio':
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <Music className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="font-semibold">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <audio src={fileUrl} controls className="w-full mt-4" />
                </div>
            );
          default:
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <File className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="font-semibold">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
            )
      }
  }

  return (
    <div className="w-full">
      {!file ? (
        <div
          {...getRootProps()}
          className={`flex justify-center items-center w-full h-64 rounded-lg border-2 border-dashed border-input p-6 cursor-pointer transition-colors ${isDragActive ? 'bg-accent' : 'bg-muted/50'}`}
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
        <div className="relative w-full h-64 rounded-md border bg-muted flex items-center justify-center">
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
