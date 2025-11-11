import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, serverTimestamp, increment } from "firebase/firestore";
import { db } from "@/firebase/firestore";
import { Community, CommunityMember, UserRole } from "./types";

/**
 * Get a community by its handle
 */
export async function getCommunityByHandle(handle: string): Promise<Community | null> {
  try {
    const communitiesRef = collection(db, "communities");
    const q = query(communitiesRef, where("handle", "==", handle));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const communityDoc = querySnapshot.docs[0];
    return { communityId: communityDoc.id, ...communityDoc.data() } as Community;
  } catch (error) {
    console.error("Error fetching community by handle:", error);
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
    // First check if user is the owner
    const communityRef = doc(db, "communities", communityId);
    const communitySnap = await getDoc(communityRef);
    
    if (communitySnap.exists() && communitySnap.data().ownerId === userId) {
      return 'owner';
    }
    
    // Then check membership collection
    const membersRef = collection(db, "communityMembers");
    const q = query(
      membersRef, 
      where("userId", "==", userId),
      where("communityId", "==", communityId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return 'guest';
    }
    
    const memberDoc = querySnapshot.docs[0];
    const memberData = memberDoc.data() as CommunityMember;
    
    return memberData.role;
  } catch (error) {
    console.error("Error getting user role:", error);
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
  try {
    const membersRef = collection(db, "communityMembers");
    
    // Create new member document
    await addDoc(membersRef, {
      userId,
      communityId,
      role: 'member',
      joinedAt: serverTimestamp(),
      status: 'active',
      userDetails
    });
    
    // Update member count in community
    const communityRef = doc(db, "communities", communityId);
    await updateDoc(communityRef, {
      memberCount: increment(1)
    });
    
    return true;
  } catch (error) {
    console.error("Error joining community:", error);
    return false;
  }
}
