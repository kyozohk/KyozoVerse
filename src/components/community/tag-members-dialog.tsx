

'use client';

import React, { useState } from 'react';
import { CustomFormDialog, CustomButton } from '@/components/ui';
import { X, Tag } from 'lucide-react';
import { CommunityMember } from '@/lib/types';
import { THEME_COLORS } from '@/lib/theme-colors';
import { useToast } from '@/hooks/use-toast';

const TagInput = ({ tags, setTags }: { tags: string[], setTags: (tags: string[]) => void }) => {
    const [inputValue, setInputValue] = useState('');

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

    return (
        <div className="inputWrapper relative">
            <div className="flex flex-wrap items-center gap-2 p-2 border rounded-lg input h-auto min-h-[44px]" style={{ borderColor: 'var(--input-border-color, var(--button-border))' }}>
                {tags.map((tag, index) => (
                    <div key={index} className="flex items-center gap-1 bg-muted rounded-full px-3 py-1 text-sm" style={{ color: 'var(--primary-purple)' }}>
                        <span className="font-medium">{tag}</span>
                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-foreground" style={{ color: 'var(--primary-purple)' }}>
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
            <label className="floatingLabel" style={{ top: tags.length > 0 ? '-0.5rem' : '0.7rem', fontSize: tags.length > 0 ? '0.75rem' : '1rem', backgroundColor: tags.length > 0 ? '#EDEDED' : 'transparent', color: tags.length > 0 ? 'var(--input-border-color, #C170CF)' : 'var(--text-secondary)' }}>
                Tags
            </label>
        </div>
    );
};

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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const initialTags = new Set<string>();
    members.forEach(member => {
      member.tags?.forEach(tag => initialTags.add(tag));
    });

    const tagsToRemove = Array.from(initialTags).filter(tag => !tags.includes(tag));

    try {
      await onApplyTags(tags, tagsToRemove);
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
          <TagInput tags={tags} setTags={setTags} />
          <p className="text-xs text-muted-foreground">Press Enter to include each tag. Tags applied here will be added to all selected members. Removing a tag here will remove it from all selected members.</p>
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
