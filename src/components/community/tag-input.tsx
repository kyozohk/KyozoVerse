"use client";

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TagInputProps {
    tags: string[];
    setTags: (tags: string[]) => void;
}

export function TagInput({ tags, setTags }: TagInputProps) {
    const [inputValue, setInputValue] = useState('');

    const handleAddTag = () => {
        if (inputValue.trim() && !tags.includes(inputValue.trim())) {
            setTags([...tags, inputValue.trim()]);
            setInputValue('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <div>
            <label className="text-sm text-muted-foreground mb-2 block">Tags</label>
            <div className="flex items-center gap-2 p-2 border rounded-lg flex-wrap bg-white">
                 {tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button type="button" onClick={() => handleRemoveTag(tag)}>
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
                <div className="flex-grow flex items-center">
                    <input 
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        placeholder="Add a tag..."
                        className="bg-transparent outline-none flex-grow"
                    />
                    <Button type="button" size="icon" variant="ghost" onClick={handleAddTag} className="h-7 w-7">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
