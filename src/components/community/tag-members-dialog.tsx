
'use client';

import React, { useState, useEffect } from 'react';
import { CustomFormDialog, CustomButton, Badge } from '@/components/ui';
import { X, Tag, User, Plus } from 'lucide-react';
import { CommunityMember } from '@/lib/types';
import { THEME_COLORS } from '@/lib/theme-colors';
import { useToast } from '@/hooks/use-toast';
import { getCommunityTagNames } from '@/lib/community-tags';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const TagInput = ({ tags, setTags, availableTags }: { tags: string[], setTags: (tags: string[]) => void, availableTags: string[] }) => {
    const [inputValue, setInputValue] = useState('');

    const addTag = (tagName: string) => {
        if (tagName.trim() && !tags.includes(tagName.trim())) {
            setTags([...tags, tagName.trim()]);
        }
        setInputValue('');
    };

    const handleAddClick = () => {
        if (inputValue.trim()) {
            addTag(inputValue.trim());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim() !== '') {
            e.preventDefault();
            addTag(inputValue.trim());
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    // Get unselected tags (available tags that aren't currently selected)
    const unselectedTags = availableTags.filter(tag => !tags.includes(tag));

    return (
        <div className="space-y-3">
            {/* Available Tags - Clickable chips */}
            {unselectedTags.length > 0 && (
                <div>
                    <label className="text-xs font-medium text-gray-600 mb-2 block">Available Tags (click to add)</label>
                    <div className="flex flex-wrap gap-2">
                        {unselectedTags.map((tag, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => addTag(tag)}
                                className="flex items-center gap-1 bg-gray-100 hover:bg-purple-100 rounded-full px-3 py-1.5 text-sm transition-colors border border-gray-200 hover:border-purple-300"
                            >
                                <span className="font-medium text-gray-700">{tag}</span>
                                <span className="text-gray-400 text-xs">+</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Selected Tags Input */}
            <div className="inputWrapper relative">
                <div className="flex flex-wrap items-center gap-2 p-2 pr-12 border rounded-lg input h-auto min-h-[44px]" style={{ borderColor: 'var(--input-border-color, var(--button-border))' }}>
                    {tags.map((tag, index) => (
                        <div key={index} className="flex items-center gap-1 bg-purple-100 rounded-full px-3 py-1 text-sm border border-purple-200">
                            <span className="font-medium" style={{ color: 'var(--primary-purple)' }}>{tag}</span>
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
                <button
                    type="button"
                    onClick={handleAddClick}
                    disabled={!inputValue.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ 
                        backgroundColor: inputValue.trim() ? 'var(--primary-purple)' : 'transparent',
                        color: inputValue.trim() ? 'white' : 'var(--text-secondary)'
                    }}
                >
                    <Plus className="h-4 w-4" />
                </button>
                <label className="floatingLabel" style={{ top: tags.length > 0 ? '-0.5rem' : '0.7rem', fontSize: tags.length > 0 ? '0.75rem' : '1rem', backgroundColor: tags.length > 0 ? '#EDEDED' : 'transparent', color: tags.length > 0 ? 'var(--input-border-color, #C170CF)' : 'var(--text-secondary)' }}>
                    Tags to Apply
                </label>
            </div>
        </div>
    );
};

interface TagMembersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  members: CommunityMember[];
  communityId: string;
  onApplyTags: (tagsToAdd: string[], tagsToRemove: string[]) => void;
}

export function TagMembersDialog({
  isOpen,
  onClose,
  members,
  communityId,
  onApplyTags
}: TagMembersDialogProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [initialTags, setInitialTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Load available tags from community
  useEffect(() => {
    if (isOpen && communityId) {
      getCommunityTagNames(communityId)
        .then(setAvailableTags)
        .catch(error => {
          console.error('Error loading community tags:', error);
          setAvailableTags([]);
        });
    }
  }, [isOpen, communityId]);

  // Initialize tags with common tags from selected members
  useEffect(() => {
    if (isOpen && members.length > 0) {
      const commonTags = members.reduce((acc, member) => {
        return acc.filter(tag => member.tags?.includes(tag));
      }, members[0]?.tags || []);
      setTags(commonTags);
      setInitialTags(commonTags);
    } else {
      setTags([]);
      setInitialTags([]);
    }
  }, [isOpen, members]);

  // Check if tags have been modified
  const tagsModified = () => {
    if (tags.length !== initialTags.length) return true;
    const sortedTags = [...tags].sort();
    const sortedInitial = [...initialTags].sort();
    return !sortedTags.every((tag, index) => tag === sortedInitial[index]);
  };

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

  // Create right panel component showing selected members
  const rightPanel = (
    <div 
      className="h-full p-6 overflow-y-auto relative"
      style={{
        backgroundImage: 'url(/bg/light_app_bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* 10% transparent black overlay */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Selected Members</h3>
          <p className="text-sm text-gray-600">{members.length} member{members.length !== 1 ? 's' : ''} selected</p>
        </div>
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={member.userDetails?.avatarUrl} />
                  <AvatarFallback className="bg-purple-100 text-purple-700">
                    {member.userDetails?.displayName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-grow min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {member.userDetails?.displayName || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {member.userDetails?.email || 'No email'}
                  </p>
                  {member.tags && member.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {member.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <CustomFormDialog
      open={isOpen}
      onClose={onClose}
      title="Tag Members"
      description={`Apply tags to ${members.length} selected member(s).`}
      color={THEME_COLORS.members.primary}
      rightComponent={rightPanel}
    >
      <div className="flex flex-col h-full">
        <div className="flex-grow space-y-4 overflow-y-auto pr-2">
          <TagInput tags={tags} setTags={setTags} availableTags={availableTags} />
          <p className="text-xs text-muted-foreground">
            Click existing tags above to add them, or type a new tag name and press Enter to create one. Remove tags by clicking the X.
          </p>
        </div>

        <div className="mt-auto flex-shrink-0 flex flex-row justify-end gap-3 pt-4 border-t">
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
            disabled={isSubmitting || !tagsModified()}
          >
            <Tag className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Applying...' : 'Apply Tags'}
          </CustomButton>
        </div>
      </div>
    </CustomFormDialog>
  );
}
