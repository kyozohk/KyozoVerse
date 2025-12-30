
'use client';

import React, { useState } from 'react';
import { CustomFormDialog, CustomButton } from '@/components/ui';
import { X, Tag } from 'lucide-react';
import { CommunityMember } from '@/lib/types';
import { THEME_COLORS } from '@/lib/theme-colors';

interface TagMembersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  members: CommunityMember[];
  onApplyTags: (tagsToAdd: string[], tagsToRemove: string[]) => void;
}

export function TagMembersDialog({
  isOpen,
  onClose,
  members,
  onApplyTags
}: TagMembersDialogProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    // Get common tags from all selected members
    if (isOpen && members.length > 0) {
      const commonTags = members.reduce((acc, member) => {
        return acc.filter(tag => member.tags?.includes(tag));
      }, members[0]?.tags || []);
      setTags(commonTags);
    } else {
      setTags([]);
    }
  }, [isOpen, members]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim() !== '') {
      e.preventDefault();
      if (!tags.includes(inputValue.trim())) {
        setTags([...tags, inputValue.trim()]);
      }
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    // Logic to determine which tags are new and which were removed
    const initialTags = members.reduce((acc, member) => {
      member.tags?.forEach(tag => acc.add(tag));
      return acc;
    }, new Set<string>());

    const tagsToAdd = tags.filter(tag => !initialTags.has(tag));
    
    // For removal, we need to consider tags present in any member but not in the final tags list.
    const allInitialTags = Array.from(initialTags);
    const tagsToRemove = allInitialTags.filter(tag => !tags.includes(tag));

    onApplyTags(tagsToAdd, tagsToRemove);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <CustomFormDialog
      open={isOpen}
      onClose={onClose}
      title="Tag Members"
      description={`Apply tags to ${members.length} selected member(s).`}
      color={THEME_COLORS.members.primary}
    >
      <div className="flex flex-col h-full">
        <div className="flex-grow space-y-4">
          <div className="inputWrapper relative">
            <div className="flex flex-wrap items-center gap-2 p-2 border rounded-lg input h-auto min-h-[44px]">
              {tags.map((tag, index) => (
                <div key={index} className="flex items-center gap-1 bg-muted rounded-full px-3 py-1 text-sm">
                  <span className="font-medium text-foreground">{tag}</span>
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder=" "
                className="flex-grow bg-transparent focus:outline-none p-1 text-foreground"
              />
            </div>
            <label className="floatingLabel" style={{ top: '-0.5rem', fontSize: '0.75rem', backgroundColor: '#EDEDED' }}>
              Tags
            </label>
          </div>
          <p className="text-xs text-muted-foreground">Press Enter to add a tag. Tags applied here will be added to all selected members. Removing a tag here will remove it from all selected members.</p>
        </div>

        <div className="mt-8 flex flex-row justify-end gap-3 pt-4">
          <CustomButton
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full"
          >
            Cancel
          </CustomButton>
          <CustomButton
            variant="outline"
            onClick={handleSubmit}
            className="w-full"
            disabled={isSubmitting}
          >
            <Tag className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Applying...' : 'Apply Tags'}
          </CustomButton>
        </div>
      </div>
    </CustomFormDialog>
  );
}
