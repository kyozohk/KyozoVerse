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
 * Get members of a community from Firebase
 */
export async function getCommunityMembers(
  communityId: string,
  searchTerm: string = ''
): Promise<CommunityMember[]> {
  const membersRef = collection(db, "communityMembers");
  const q = query(membersRef, where("communityId", "==", communityId));

  try {
    const querySnapshot = await getDocs(q);
    
    let members = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        communityId: data.communityId,
        role: data.role,
        joinedAt: data.joinedAt,
        status: data.status,
        userDetails: data.userDetails
      } as CommunityMember;
    });
    
    // Filter by search term if provided
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      members = members.filter(member => 
        member.userDetails?.displayName?.toLowerCase().includes(lowerSearch) ||
        member.userDetails?.email?.toLowerCase().includes(lowerSearch) ||
        member.userDetails?.phone?.toLowerCase().includes(lowerSearch)
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
    // Use a composite key for the document ID to ensure uniqueness and allow for efficient lookups
    const docId = `${userId}_${communityId}`;
    console.log('💾 JOIN - Creating member document:', docId);
    
    // Use setDoc with the composite ID instead of addDoc
    await setDoc(doc(db, "communityMembers", docId), newMemberData);
    
    console.log('✅ JOIN - Member document created successfully');
  } catch (error) {
    console.error("❌ JOIN - Error creating member document:", error);
    errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'communityMembers',
        operation: 'create',
        requestResourceData: newMemberData,
    }));
    return false;
  }
  
  // NOTE: We don't update memberCount here because regular users shouldn't have
  // permission to update community documents. The memberCount should be:
  // 1. Calculated dynamically by counting communityMembers, OR
  // 2. Updated via a Cloud Function (server-side), OR
  // 3. Updated only by community owners/admins
  console.log('ℹ️ JOIN - Skipping memberCount update (should be done server-side)');
    
  return true;
}
