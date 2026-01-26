
'use client';

import React, { useState, useEffect } from 'react';
import { CustomFormDialog, CustomButton, Badge } from '@/components/ui';
import { X, Tag, User, Plus, Search, List, Grid, Check } from 'lucide-react';
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
        <div className="space-y-4">
            {/* Available Tags - Clickable chips */}
            {unselectedTags.length > 0 && (
                <div>
                    <label className="text-xs font-medium mb-2 block" style={{ color: '#6B5D52' }}>Available Tags (click to add)</label>
                    <div className="flex flex-wrap gap-3">
                        {unselectedTags.map((tag, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => addTag(tag)}
                                className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm transition-colors border"
                                style={{ 
                                    backgroundColor: '#F5F0E8', 
                                    borderColor: '#E8DFD1',
                                    color: '#5B4A3A'
                                }}
                            >
                                <span className="font-medium">{tag}</span>
                                <Plus className="h-3 w-3" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Selected Tags Input */}
            <div className="inputWrapper relative">
                <div className="flex flex-wrap items-center gap-3 p-3 pr-12 border rounded-lg h-auto min-h-[48px]" style={{ borderColor: '#E8DFD1', backgroundColor: '#FAFAFA' }}>
                    {tags.map((tag, index) => (
                        <div key={index} className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm" style={{ backgroundColor: '#E8DFD1', color: '#5B4A3A' }}>
                            <span className="font-medium">{tag}</span>
                            <button type="button" onClick={() => removeTag(tag)} className="hover:opacity-70 transition-opacity">
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={tags.length === 0 ? "Type a new tag..." : ""}
                        className="flex-grow bg-transparent focus:outline-none p-1 text-foreground min-w-[120px]"
                        style={{ color: '#5B4A3A' }}
                    />
                </div>
                <button
                    type="button"
                    onClick={handleAddClick}
                    disabled={!inputValue.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ 
                        backgroundColor: inputValue.trim() ? '#E8DFD1' : 'transparent',
                        color: '#5B4A3A'
                    }}
                >
                    <Plus className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};

interface TagMembersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  allMembers: CommunityMember[];  // All community members
  initialSelectedMembers: CommunityMember[];  // Initially selected members
  communityId: string;
  onApplyTags: (tagsToAdd: string[], tagsToRemove: string[], selectedMemberIds: string[]) => void;
}

export function TagMembersDialog({
  isOpen,
  onClose,
  allMembers,
  initialSelectedMembers,
  communityId,
  onApplyTags
}: TagMembersDialogProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [initialTags, setInitialTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const { toast } = useToast();

  // Initialize selected members when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(initialSelectedMembers.map(m => m.id)));
    }
  }, [isOpen, initialSelectedMembers]);

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
    if (isOpen && initialSelectedMembers.length > 0) {
      const commonTags = initialSelectedMembers.reduce((acc, member) => {
        return acc.filter(tag => member.tags?.includes(tag));
      }, initialSelectedMembers[0]?.tags || []);
      setTags(commonTags);
      setInitialTags(commonTags);
    } else {
      setTags([]);
      setInitialTags([]);
    }
  }, [isOpen, initialSelectedMembers]);

  // Filter and sort members
  const filteredMembers = allMembers
    .filter(m => {
      if (!searchTerm) return true;
      const name = m.userDetails?.displayName?.toLowerCase() || '';
      const email = m.userDetails?.email?.toLowerCase() || '';
      return name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      // Selected members first
      const aSelected = selectedIds.has(a.id);
      const bSelected = selectedIds.has(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return (a.userDetails?.displayName || '').localeCompare(b.userDetails?.displayName || '');
    });

  const toggleMemberSelection = (memberId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  const selectedCount = selectedIds.size;

  // Check if tags have been modified
  const tagsModified = () => {
    if (tags.length !== initialTags.length) return true;
    const sortedTags = [...tags].sort();
    const sortedInitial = [...initialTags].sort();
    return !sortedTags.every((tag, index) => tag === sortedInitial[index]);
  };

  const handleSubmit = async () => {
    if (selectedCount === 0) {
      toast({
        title: "No members selected",
        description: "Please select at least one member to apply tags.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    const selectedMembers = allMembers.filter(m => selectedIds.has(m.id));
    const existingTags = new Set<string>();
    selectedMembers.forEach((member: CommunityMember) => {
      member.tags?.forEach((tag: string) => existingTags.add(tag));
    });

    const tagsToRemove = Array.from(existingTags).filter(tag => !tags.includes(tag));

    try {
      await onApplyTags(tags, tagsToRemove, Array.from(selectedIds));
      toast({
        title: "Tags Applied",
        description: `Tags have been updated for ${selectedCount} members.`,
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
      description={`Apply tags to ${selectedCount} selected member(s).`}
      size="large"
    >
      <div className="flex flex-col h-[70vh]">
        {/* Tag Input at the top */}
        <div className="space-y-4 mb-6 flex-shrink-0">
          <TagInput tags={tags} setTags={setTags} availableTags={availableTags} />
          <p className="text-xs" style={{ color: '#8A7A6A' }}>
            Click existing tags above to add them, or type a new tag name and press Enter to create one.
          </p>
        </div>

        {/* Members List with Search and View Mode */}
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Search and View Mode Header */}
          <div className="flex items-center gap-3 mb-3 flex-shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#8A7A6A' }} />
              <input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-offset-0"
                style={{ borderColor: '#E8DFD1', color: '#5B4A3A' }}
              />
            </div>
            <div className="flex items-center gap-1 rounded-md p-1" style={{ backgroundColor: '#F5F0E8' }}>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
              >
                <List className="h-4 w-4" style={{ color: '#5B4A3A' }} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
              >
                <Grid className="h-4 w-4" style={{ color: '#5B4A3A' }} />
              </button>
            </div>
          </div>

          {/* Selected count */}
          <div className="mb-2 flex-shrink-0">
            <span className="text-sm" style={{ color: '#6B5D52' }}>
              {selectedCount} of {allMembers.length} members selected
            </span>
          </div>

          {/* Members List */}
          <div className="flex-1 overflow-y-auto -mx-2 px-2">
            {viewMode === 'list' ? (
              <div className="space-y-2">
                {filteredMembers.map((member) => {
                  const isSelected = selectedIds.has(member.id);
                  return (
                    <div 
                      key={member.id} 
                      onClick={() => toggleMemberSelection(member.id)}
                      className="flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-accent/30"
                      style={{ 
                        borderColor: isSelected ? '#5B4A3A' : '#E8DFD1', 
                        backgroundColor: isSelected ? '#F5F0E8' : '#FAFAFA' 
                      }}
                    >
                      {/* Checkbox */}
                      <div 
                        className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                        style={{ 
                          borderColor: isSelected ? '#5B4A3A' : '#E8DFD1',
                          backgroundColor: isSelected ? '#5B4A3A' : 'transparent'
                        }}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={member.userDetails?.avatarUrl} />
                        <AvatarFallback style={{ backgroundColor: '#E8DFD1', color: '#5B4A3A' }}>
                          {member.userDetails?.displayName?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-grow min-w-0">
                        <p className="font-medium text-sm truncate" style={{ color: '#5B4A3A' }}>
                          {member.userDetails?.displayName || 'Unknown'}
                        </p>
                        <p className="text-xs truncate" style={{ color: '#8A7A6A' }}>
                          {member.userDetails?.email || 'No email'}
                        </p>
                      </div>
                      {member.tags && member.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-end max-w-[120px]">
                          {member.tags.slice(0, 2).map((tag: string) => (
                            <Badge 
                              key={tag} 
                              variant="secondary" 
                              className="text-xs px-2 py-0.5"
                              style={{ backgroundColor: '#E8DFD1', color: '#5B4A3A' }}
                            >
                              {tag}
                            </Badge>
                          ))}
                          {member.tags.length > 2 && (
                            <Badge 
                              variant="secondary" 
                              className="text-xs px-2 py-0.5"
                              style={{ backgroundColor: '#E8DFD1', color: '#5B4A3A' }}
                            >
                              +{member.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredMembers.map((member) => {
                  const isSelected = selectedIds.has(member.id);
                  return (
                    <div 
                      key={member.id} 
                      onClick={() => toggleMemberSelection(member.id)}
                      className="relative p-4 rounded-lg border transition-colors cursor-pointer hover:bg-accent/30 text-center"
                      style={{ 
                        borderColor: isSelected ? '#5B4A3A' : '#E8DFD1', 
                        backgroundColor: isSelected ? '#F5F0E8' : '#FAFAFA' 
                      }}
                    >
                      {/* Checkbox */}
                      <div 
                        className="absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                        style={{ 
                          borderColor: isSelected ? '#5B4A3A' : '#E8DFD1',
                          backgroundColor: isSelected ? '#5B4A3A' : 'transparent'
                        }}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <Avatar className="h-14 w-14 mx-auto mb-2">
                        <AvatarImage src={member.userDetails?.avatarUrl} />
                        <AvatarFallback style={{ backgroundColor: '#E8DFD1', color: '#5B4A3A' }}>
                          {member.userDetails?.displayName?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-medium text-sm truncate" style={{ color: '#5B4A3A' }}>
                        {member.userDetails?.displayName || 'Unknown'}
                      </p>
                      <p className="text-xs truncate" style={{ color: '#8A7A6A' }}>
                        {member.userDetails?.email || 'No email'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - Filled style */}
        <div className="mt-4 flex flex-row justify-end gap-3 pt-4 border-t flex-shrink-0" style={{ borderColor: '#E8DFD1' }}>
          <CustomButton
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6"
            style={{ borderColor: '#E8DFD1', color: '#5B4A3A' }}
          >
            Cancel
          </CustomButton>
          <CustomButton
            onClick={handleSubmit}
            disabled={isSubmitting || selectedCount === 0}
            className="px-6"
            style={{ 
              backgroundColor: '#E8DFD1', 
              color: '#5B4A3A',
              border: 'none'
            }}
          >
            <Tag className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Applying...' : `Apply Tags (${selectedCount})`}
          </CustomButton>
        </div>
      </div>
    </CustomFormDialog>
  );
}
