"use client";

import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Edit } from 'lucide-react';

interface ColorPalettePickerProps {
    palette: string[];
    onPaletteChange: (palette: string[]) => void;
}

export function ColorPalettePicker({ palette, onPaletteChange }: ColorPalettePickerProps) {
    const [openPicker, setOpenPicker] = useState<number | null>(null);

    const handleColorChange = (color: string, index: number) => {
        const newPalette = [...palette];
        newPalette[index] = color;
        onPaletteChange(newPalette);
    }
    
    // Simple color wheel for demonstration purposes
    const ColorWheel = ({ index }: { index: number }) => (
      <div className="p-4 bg-white rounded-lg shadow-lg">
          <input 
              type="color" 
              value={palette[index]}
              onChange={(e) => handleColorChange(e.target.value, index)}
              className="w-full h-10 p-0 border-none cursor-pointer"
          />
      </div>
    );

    return (
        <div>
            <p className="text-sm text-muted-foreground mb-2">Color Palette</p>
            <div className="bg-gray-800 p-2 rounded-lg flex items-center gap-2">
                {palette.map((color, index) => (
                    <Popover key={index} onOpenChange={(isOpen) => setOpenPicker(isOpen ? index : null)}>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                className="w-8 h-8 rounded-md border-2 border-transparent hover:border-white transition-all"
                                style={{ backgroundColor: color }}
                            />
                        </PopoverTrigger>
                        {openPicker === index && (
                            <PopoverContent className="w-auto p-0 border-none">
                               <ColorWheel index={index} />
                            </PopoverContent>
                        )}
                    </Popover>
                ))}
                 <button className="text-purple-400 text-sm ml-2 flex items-center gap-1">
                    <Edit className="h-3 w-3" /> Edit
                </button>
            </div>
        </div>
    );
}
