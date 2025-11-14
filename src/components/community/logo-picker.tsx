"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Plus } from 'lucide-react';

interface LogoPickerProps {
    onFileChange: (file: File | null) => void;
}

const parallaxImages = ['/bg/Parallax1.jpg', '/bg/Parallax2.jpg', '/bg/Parallax3.jpg', '/bg/Parallax4.jpg'];

export function LogoPicker({ onFileChange }: LogoPickerProps) {
    const [selected, setSelected] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSelect = (src: string) => {
        setSelected(src);
        // We can't create a File object from a static path, so we'll pass null
        // In a real app, you might pass the path and handle it on the backend
        onFileChange(null);
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setSelected(previewUrl);
            onFileChange(file);
        }
    }

    return (
        <div>
            <p className="text-sm text-muted-foreground mb-2">Community Logo</p>
            <div className="flex items-center gap-3">
                {parallaxImages.map(src => (
                    <div 
                        key={src}
                        className={`w-12 h-12 rounded-full overflow-hidden cursor-pointer border-2 transition-all ${selected === src ? 'border-primary scale-110' : 'border-transparent'}`}
                        onClick={() => handleSelect(src)}
                    >
                        <Image src={src} alt="Logo option" width={48} height={48} className="object-cover" />
                    </div>
                ))}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                    className="hidden" 
                    accept="image/*"
                />
                 <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${selected && !parallaxImages.includes(selected) ? 'border-primary scale-110' : 'border-dashed'}`}
                >
                    {selected && !parallaxImages.includes(selected) ? (
                         <Image src={selected} alt="Custom logo" width={48} height={48} className="object-cover rounded-full" />
                    ) : (
                        <Plus className="h-6 w-6 text-gray-400" />
                    )}
                </button>
            </div>
        </div>
    )
}
