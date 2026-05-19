'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CustomFormDialog, CustomButton } from '@/components/ui';
import { X, Tag, Search, Check, Loader2, Pencil, Trash2 } from 'lucide-react';
import { CommunityMember } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  getCommunityTagNames,
  addTagToCommunity,
  deleteTagFromCommunity,
} from '@/lib/community-tags';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TagMembersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  allMembers: CommunityMember[]; // All community members
  initialSelectedMembers: CommunityMember[]; // Pre-selected members
  communityId: string;
  onApplyTags: (
    tagsToAdd: string[],
    tagsToRemove: string[],
    selectedMemberIds: string[]
  ) => void;
  /** Dialog title — defaults to "Manage Tags" but the audience page can pass
   *  "Tag Audience Members" when the entry point is the row-selection CTA. */
  title?: string;
}

/**
 * Manage Tags dialog — three sections (image 2):
 *   1. Add New Tag      — type a tag, click Save to persist on community
 *   2. Saved Tags       — list of community tags; rename/delete inline
 *   3. Apply Tags       — pick recipients (search + multi-select members)
 *                         and click Save to apply the currently-selected
 *                         saved tags to them.
 */
export function TagMembersDialog({
  isOpen,
  onClose,
  allMembers,
  initialSelectedMembers,
  communityId,
  onApplyTags,
  title = 'Manage Tags',
}: TagMembersDialogProps) {
  const { toast } = useToast();

  // === Add New Tag ===
  const [newTag, setNewTag] = useState('');
  const [savingNew, setSavingNew] = useState(false);

  // === Saved Tags ===
  const [savedTags, setSavedTags] = useState<string[]>([]);
  // Editable copy keyed by original name. Allows in-place rename.
  const [tagEdits, setTagEdits] = useState<Record<string, string>>({});
  // Tag currently in inline-edit mode (clicked the pencil). Only one at a time.
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [busyTag, setBusyTag] = useState<string | null>(null);
  // Which saved tags are checked-on for the Apply step.
  const [tagsToApply, setTagsToApply] = useState<Set<string>>(new Set());

  // === Apply Tags (recipient picker) ===
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState(false);

  // ---- Loading saved tags + initial selection ------------------------------

  const loadTags = async () => {
    if (!communityId) return;
    try {
      const names = await getCommunityTagNames(communityId);
      setSavedTags(names);
      setTagEdits(Object.fromEntries(names.map((n) => [n, n])));
    } catch (e) {
      console.error('Error loading community tags:', e);
      setSavedTags([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTags();
      setSelectedMemberIds(new Set(initialSelectedMembers.map((m) => m.id)));
      setNewTag('');
      setMemberSearch('');
      setTagsToApply(new Set());
    }
  }, [isOpen, initialSelectedMembers, communityId]);

  // ---- Handlers ------------------------------------------------------------

  const handleAddNewTag = async () => {
    const name = newTag.trim();
    if (!name) return;
    if (savedTags.some((t) => t.toLowerCase() === name.toLowerCase())) {
      toast({
        title: 'Tag already exists',
        description: `"${name}" is already in your saved tags.`,
        variant: 'destructive',
      });
      return;
    }
    setSavingNew(true);
    try {
      await addTagToCommunity(communityId, name);
      setSavedTags((prev) => [...prev, name].sort((a, b) => a.localeCompare(b)));
      setTagEdits((prev) => ({ ...prev, [name]: name }));
      setNewTag('');
    } catch (e) {
      console.error('Failed to add tag:', e);
      toast({ title: 'Could not save tag', variant: 'destructive' });
    } finally {
      setSavingNew(false);
    }
  };

  const handleRenameTag = async (original: string) => {
    const next = (tagEdits[original] || '').trim();
    if (!next || next === original) return;
    if (savedTags.some((t) => t.toLowerCase() === next.toLowerCase() && t !== original)) {
      toast({ title: 'A tag with this name already exists', variant: 'destructive' });
      return;
    }
    setBusyTag(original);
    try {
      // Rename = add new + delete old. Members carrying `original` keep it in
      // their array until the next Apply Tags action; documented limitation.
      await addTagToCommunity(communityId, next);
      await deleteTagFromCommunity(communityId, original);
      setSavedTags((prev) =>
        prev.map((t) => (t === original ? next : t)).sort((a, b) => a.localeCompare(b))
      );
      setTagEdits((prev) => {
        const { [original]: _, ...rest } = prev;
        return { ...rest, [next]: next };
      });
      // Migrate Apply checkbox state.
      setTagsToApply((prev) => {
        if (!prev.has(original)) return prev;
        const n = new Set(prev);
        n.delete(original);
        n.add(next);
        return n;
      });
    } catch (e) {
      console.error('Failed to rename tag:', e);
      toast({ title: 'Could not rename tag', variant: 'destructive' });
    } finally {
      setBusyTag(null);
    }
  };

  const handleDeleteTag = async (name: string) => {
    setBusyTag(name);
    try {
      await deleteTagFromCommunity(communityId, name);
      setSavedTags((prev) => prev.filter((t) => t !== name));
      setTagEdits((prev) => {
        const { [name]: _, ...rest } = prev;
        return rest;
      });
      setTagsToApply((prev) => {
        if (!prev.has(name)) return prev;
        const n = new Set(prev);
        n.delete(name);
        return n;
      });
    } catch (e) {
      console.error('Failed to delete tag:', e);
      toast({ title: 'Could not delete tag', variant: 'destructive' });
    } finally {
      setBusyTag(null);
    }
  };

  const toggleTagToApply = (name: string) => {
    setTagsToApply((prev) => {
      const n = new Set(prev);
      if (n.has(name)) n.delete(name); else n.add(name);
      return n;
    });
  };

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    const list = q
      ? allMembers.filter((m) => {
          const name = m.userDetails?.displayName?.toLowerCase() || '';
          const email = m.userDetails?.email?.toLowerCase() || '';
          return name.includes(q) || email.includes(q);
        })
      : allMembers;
    return [...list].sort((a, b) => {
      const aSel = selectedMemberIds.has(a.id);
      const bSel = selectedMemberIds.has(b.id);
      if (aSel && !bSel) return -1;
      if (!aSel && bSel) return 1;
      return (a.userDetails?.displayName || '').localeCompare(b.userDetails?.displayName || '');
    });
  }, [allMembers, memberSearch, selectedMemberIds]);

  const toggleMember = (id: string) => {
    setSelectedMemberIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const handleApply = async () => {
    if (selectedMemberIds.size === 0) {
      toast({
        title: 'No members selected',
        description: 'Pick at least one recipient under Apply Tags.',
        variant: 'destructive',
      });
      return;
    }
    if (tagsToApply.size === 0) {
      toast({
        title: 'No tags selected',
        description: 'Tick at least one saved tag to apply.',
        variant: 'destructive',
      });
      return;
    }
    setApplying(true);
    try {
      await onApplyTags(Array.from(tagsToApply), [], Array.from(selectedMemberIds));
      toast({
        title: 'Tags applied',
        description: `${tagsToApply.size} tag${tagsToApply.size === 1 ? '' : 's'} applied to ${selectedMemberIds.size} member${selectedMemberIds.size === 1 ? '' : 's'}.`,
      });
      onClose();
    } catch (e) {
      console.error('Failed to apply tags:', e);
      toast({ title: 'Could not apply tags', variant: 'destructive' });
    } finally {
      setApplying(false);
    }
  };

  // ---- Shared styles -------------------------------------------------------

  const inputClass =
    'w-full h-10 px-3 rounded-md border-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A89882]';
  const inputStyle: React.CSSProperties = { borderColor: '#A89882', color: '#3D2E1F' };
  const saveBtnClass =
    'inline-flex items-center justify-center h-10 px-5 rounded-md text-sm font-medium border-2 transition-colors disabled:opacity-50 disabled:pointer-events-none';
  const saveBtnStyle: React.CSSProperties = {
    backgroundColor: '#E8DFD1',
    borderColor: '#A89882',
    color: '#3D2E1F',
  };

  return (
    <CustomFormDialog
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={title}
      description=""
      size="large"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 min-h-[60vh]">
        {/* ─────────────────────────────── LEFT COLUMN ─────────────────── */}
        <div className="flex flex-col gap-8 md:border-r md:pr-8" style={{ borderColor: '#E8DFD1' }}>
          {/* Add New Tag */}
          <section>
            <h3 className="text-base font-semibold mb-3" style={{ color: '#3D2E1F' }}>
              Add New Tag
            </h3>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="VIP"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddNewTag(); }}
                className={inputClass}
                style={inputStyle}
              />
              <button
                type="button"
                onClick={handleAddNewTag}
                disabled={!newTag.trim() || savingNew}
                className={saveBtnClass}
                style={saveBtnStyle}
              >
                {savingNew ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </button>
            </div>
          </section>

          {/* Saved Tags */}
          <section className="flex-1 min-h-0 flex flex-col">
            <h3 className="text-base font-semibold mb-3" style={{ color: '#3D2E1F' }}>
              Saved Tags
            </h3>
            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {savedTags.length === 0 && (
                <p className="text-sm italic" style={{ color: '#8A7A6A' }}>
                  No saved tags yet. Use "Add New Tag" above.
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                {savedTags.map((name) => {
                  const isEditing = editingTag === name;
                  const editing = tagEdits[name] ?? name;
                  const dirty = editing.trim() !== name && editing.trim().length > 0;
                  const isBusy = busyTag === name;
                  const isChecked = tagsToApply.has(name);

                  if (isEditing) {
                    return (
                      <div key={name} className="flex items-center gap-2">
                        <input
                          type="text"
                          autoFocus
                          value={editing}
                          onChange={(e) => setTagEdits((prev) => ({ ...prev, [name]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleRenameTag(name);
                              setEditingTag(null);
                            }
                            if (e.key === 'Escape') {
                              setTagEdits((prev) => ({ ...prev, [name]: name }));
                              setEditingTag(null);
                            }
                          }}
                          className={inputClass + ' w-28'}
                          style={inputStyle}
                          disabled={isBusy}
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            await handleRenameTag(name);
                            setEditingTag(null);
                          }}
                          disabled={!dirty || isBusy}
                          className={saveBtnClass + ' h-8 px-3'}
                          style={saveBtnStyle}
                        >
                          {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={name}
                      className="inline-flex items-center gap-2 rounded-md border-2 px-3 h-9"
                      style={{
                        borderColor: '#A89882',
                        backgroundColor: isChecked ? '#F0E8DA' : 'transparent',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleTagToApply(name)}
                        className="text-sm font-medium"
                        style={{ color: '#3D2E1F' }}
                        title="Tick to include in Apply Tags"
                      >
                        {name}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingTag(name)}
                        title="Rename tag"
                        className="p-1 rounded hover:bg-[#E8DFD1] transition-colors"
                        style={{ color: '#5B4A3A' }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTag(name)}
                        disabled={isBusy}
                        title="Delete tag"
                        className="p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                        style={{ color: '#9B8A75' }}
                      >
                        {isBusy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        {/* ─────────────────────────────── RIGHT COLUMN ────────────────── */}
        <div className="flex flex-col min-h-0">
          <section className="flex-1 flex flex-col min-h-0">
            <h3 className="text-base font-semibold mb-3" style={{ color: '#3D2E1F' }}>
              Apply Tags
            </h3>

            {/* Search + Save row */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#9B8A75' }} />
                <input
                  type="text"
                  placeholder="Search"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className={inputClass + ' pl-9'}
                  style={inputStyle}
                />
              </div>
              <button
                type="button"
                onClick={handleApply}
                disabled={
                  applying ||
                  selectedMemberIds.size === 0 ||
                  tagsToApply.size === 0
                }
                className={saveBtnClass}
                style={saveBtnStyle}
              >
                {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </button>
            </div>

            {/* Selection summary */}
            <p className="text-xs mb-2" style={{ color: '#8A7A6A' }}>
              {selectedMemberIds.size} selected · {tagsToApply.size} tag{tagsToApply.size === 1 ? '' : 's'} ticked
            </p>

            {/* Member list */}
            <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-2">
              {filteredMembers.map((m) => {
                const selected = selectedMemberIds.has(m.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => toggleMember(m.id)}
                    className="flex items-center gap-3 p-2.5 rounded-md border-2 cursor-pointer transition-colors"
                    style={{
                      borderColor: selected ? '#A89882' : '#E8DFD1',
                      backgroundColor: selected ? '#F0E8DA' : 'transparent',
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                      style={{
                        borderColor: selected ? '#5B4A3A' : '#A89882',
                        backgroundColor: selected ? '#5B4A3A' : 'transparent',
                      }}
                    >
                      {selected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={m.userDetails?.avatarUrl} />
                      <AvatarFallback style={{ backgroundColor: '#E8DFD1', color: '#5B4A3A' }}>
                        {m.userDetails?.displayName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#3D2E1F' }}>
                        {m.userDetails?.displayName || 'Unknown'}
                      </p>
                      <p className="text-xs truncate" style={{ color: '#8A7A6A' }}>
                        {m.userDetails?.email || 'No email'}
                      </p>
                    </div>
                  </div>
                );
              })}
              {filteredMembers.length === 0 && (
                <p className="text-sm italic py-6 text-center" style={{ color: '#8A7A6A' }}>
                  No members match "{memberSearch}"
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <div
        className="mt-6 flex justify-end gap-3 pt-4 border-t flex-shrink-0"
        style={{ borderColor: '#E8DFD1' }}
      >
        <CustomButton
          variant="outline"
          onClick={onClose}
          disabled={applying}
          className="px-6 border-2"
          style={{ borderColor: '#A89882', color: '#3D2E1F' }}
        >
          Close
        </CustomButton>
      </div>
    </CustomFormDialog>
  );
}
