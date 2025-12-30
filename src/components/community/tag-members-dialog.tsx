
'use client';

import React, { useState } from 'react';
import { CustomFormDialog, CustomButton } from '@/components/ui';
import { X, Tag } from 'lucide-react';
import { CommunityMember } from '@/lib/types';
import { THEME_COLORS } from '@/lib/theme-colors';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  React.useEffect(() => {
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
      const newTag = inputValue.trim();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const initialTags = new Set<string>();
    members.forEach(member => {
      member.tags?.forEach(tag => initialTags.add(tag));
    });

    const tagsToAdd = tags.filter(tag => {
      // Add tag if it's new for at least one member.
      // This logic is a simplification; a more robust solution might track per-member changes.
      // For now, we add all current tags to all members.
      return true;
    });

    const tagsToRemove = Array.from(initialTags).filter(tag => !tags.includes(tag));
    
    console.log('🏷️ [Applying Tags] - Member IDs:', members.map(m => m.id));
    console.log('🏷️ [Applying Tags] - Tags to ADD to all selected members:', tagsToAdd);
    console.log('🏷️ [Applying Tags] - Tags to REMOVE from all selected members:', tagsToRemove);

    try {
      await onApplyTags(tags, tagsToRemove); // Simplified: send the final list of tags
      toast({
        title: "Tags Applied",
        description: `Tags have been updated for ${members.length} members.`,
      });
      onClose();
    } catch (error) {
      console.error("Error applying tags:", error);
      toast({
        title: "Error",
        description: "Could not apply tags. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
