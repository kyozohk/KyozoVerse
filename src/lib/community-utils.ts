import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, serverTimestamp, increment, setDoc } from "firebase/firestore";
import { db } from "@/firebase/firestore";
import { Community, CommunityMember, UserRole } from "./types";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

/**
 * Get a community by its handle
 */
export async function getCommunityByHandle(handle: string): Promise<Community | null> {
  const communitiesRef = collection(db, "communities");
  const q = query(communitiesRef, where("handle", "==", handle));
  
  try {
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const communityDoc = querySnapshot.docs[0];
    return { communityId: communityDoc.id, ...communityDoc.data() } as Community;
  } catch (error) {
    console.error("Error fetching community by handle:", error);
    errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `communities`, // Path for a query
        operation: 'list', // list for queries
    }));
    return null;
  }
}

/**
 * Get a user's role in a specific community
 */
export async function getUserRoleInCommunity(
  userId: string | undefined | null, 
  communityId: string
): Promise<UserRole> {
  if (!userId) return 'guest';
  
  try {
    const communityRef = doc(db, "communities", communityId);
    const communitySnap = await getDoc(communityRef);
    
    if (communitySnap.exists() && communitySnap.data().ownerId === userId) {
      return 'owner';
    }
  } catch(error) {
     errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `communities/${communityId}`,
        operation: 'get',
    }));
    return 'guest';
  }
    
  const membersRef = collection(db, "communityMembers");
  const q = query(
    membersRef, 
    where("userId", "==", userId),
    where("communityId", "==", communityId)
  );
  
  try {
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return 'guest';
    }
    
    const memberDoc = querySnapshot.docs[0];
    const memberData = memberDoc.data() as CommunityMember;
    
    return memberData.role;
  } catch (error) {
    console.error("Error getting user role:", error);
     errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `communityMembers`,
        operation: 'list',
    }));
    return 'guest';
  }
}

/**
 * Check if a user is a member of a community
 */
export async function isUserCommunityMember(
  userId: string | undefined | null, 
  communityId: string
): Promise<boolean> {
  if (!userId) return false;
  
  const role = await getUserRoleInCommunity(userId, communityId);
  return role !== 'guest';
}

/**
 * Get members of a community from Firebase, with filtering
 */
export async function getCommunityMembers(
  communityId: string,
  search: { type: 'name' | 'tag'; value: string } = { type: 'name', value: '' }
): Promise<CommunityMember[]> {
  const membersRef = collection(db, "communityMembers");
  let q;

  if (search.type === 'tag' && search.value) {
    q = query(membersRef, 
      where("communityId", "==", communityId),
      where("tags", "array-contains", search.value)
    );
  } else {
    q = query(membersRef, where("communityId", "==", communityId));
  }

  try {
    const querySnapshot = await getDocs(q);
    
    let members = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as CommunityMember));
    
    console.log(`📋 [getCommunityMembers] Fetched ${members.length} members from Firestore`);
    members.forEach(m => {
      console.log(`  - ${m.userDetails?.displayName}: tags =`, m.tags);
    });
    
    // Client-side filtering for name search
    if (search.type === 'name' && search.value) {
      const lowerSearch = search.value.toLowerCase();
      members = members.filter(member => 
        member.userDetails?.displayName?.toLowerCase().includes(lowerSearch) ||
        member.userDetails?.email?.toLowerCase().includes(lowerSearch)
      );
    }
    
    return members;
  } catch (error) {
    console.error("Error fetching community members:", error);
    errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `communityMembers`,
        operation: 'list',
    }));
    return [];
  }
}

/**
 * Join a community as a member
 */
export async function joinCommunity(
  userId: string,
  communityId: string,
  userDetails: {
    displayName?: string;
    avatarUrl?: string;
    email?: string;
    phone?: string;
  }
): Promise<boolean> {
  const membersRef = collection(db, "communityMembers");
  const communityRef = doc(db, "communities", communityId);
  
  const newMemberData = {
    userId,
    communityId,
    role: 'member',
    joinedAt: serverTimestamp(),
    status: 'active',
    userDetails
  };
    
  try {
    // Check if member already exists
    const q = query(membersRef, where("userId", "==", userId), where("communityId", "==", communityId));
    const existingMemberSnap = await getDocs(q);
    if (!existingMemberSnap.empty) {
        console.log('User is already a member of this community');
        return true; // Or throw an error if you want to handle this case differently
    }

    // Use a composite key for the document ID to ensure uniqueness and allow for efficient lookups
    const docId = `${userId}_${communityId}`;
    console.log('💾 JOIN - Creating member document:', docId);
    
    // Use setDoc with the composite ID instead of addDoc
    await setDoc(doc(db, "communityMembers", docId), newMemberData);
    
    console.log('✅ JOIN - Member document created successfully');
    
    // Increment member count
    await updateDoc(communityRef, { memberCount: increment(1) });
    
  } catch (error) {
    console.error("❌ JOIN - Error creating member document:", error);
    errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'communityMembers',
        operation: 'create',
        requestResourceData: newMemberData,
    }));
    return false;
  }
    
  return true;
}
