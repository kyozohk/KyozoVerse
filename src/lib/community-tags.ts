import { collection, doc, setDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/firestore';

export interface CommunityTag {
  id: string;
  name: string;
  createdAt: Timestamp;
  usageCount?: number;
}

/**
 * Add a new tag to the community's tags subcollection
 * If the tag already exists, it won't create a duplicate
 */
export async function addTagToCommunity(communityId: string, tagName: string): Promise<void> {
  const tagId = tagName.toLowerCase().replace(/\s+/g, '-');
  const tagRef = doc(db, 'communities', communityId, 'tags', tagId);
  
  console.log(`🏷️ [addTagToCommunity] Saving tag "${tagName}" to communities/${communityId}/tags/${tagId}`);
  
  try {
    await setDoc(tagRef, {
      name: tagName,
      createdAt: Timestamp.now(),
    }, { merge: true });
    console.log(`✅ [addTagToCommunity] Tag "${tagName}" saved successfully`);
  } catch (error) {
    console.error(`❌ [addTagToCommunity] Error saving tag "${tagName}":`, error);
    throw error;
  }
}

/**
 * Add multiple tags to the community's tags subcollection
 */
export async function addTagsToCommunity(communityId: string, tagNames: string[]): Promise<void> {
  const promises = tagNames.map(tagName => addTagToCommunity(communityId, tagName));
  await Promise.all(promises);
}

/**
 * Get all tags for a community
 */
export async function getCommunityTags(communityId: string): Promise<CommunityTag[]> {
  console.log(`🏷️ [getCommunityTags] Fetching tags for community: ${communityId}`);
  const tagsRef = collection(db, 'communities', communityId, 'tags');
  const q = query(tagsRef, orderBy('name', 'asc'));
  
  try {
    const snapshot = await getDocs(q);
    console.log(`🏷️ [getCommunityTags] Found ${snapshot.docs.length} tags in subcollection`);
    
    const tags = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log(`  - Tag: ${data.name} (id: ${doc.id})`);
      return {
        id: doc.id,
        ...data
      } as CommunityTag;
    });
    
    return tags;
  } catch (error) {
    console.error(`❌ [getCommunityTags] Error fetching tags:`, error);
    return [];
  }
}

/**
 * Get tag names only (for autocomplete/suggestions)
 */
export async function getCommunityTagNames(communityId: string): Promise<string[]> {
  const tags = await getCommunityTags(communityId);
  const tagNames = tags.map(tag => tag.name);
  console.log(`🏷️ [getCommunityTagNames] Returning ${tagNames.length} tag names:`, tagNames);
  return tagNames;
}
