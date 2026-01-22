

'use client';

import { useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { db } from '@/firebase/firestore';
import { collection, query, where, orderBy, onSnapshot, getDocs, getDoc, updateDoc, doc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage, Card, Input } from '@/components/ui';
import { Search, Send } from 'lucide-react';
import { User, Community } from '@/lib/types';
import { MessagingServiceDropdown } from '@/components/inbox/messaging-service-dropdown';
import { CommunityHeader } from '@/components/community/community-header';
import { useAuth } from '@/hooks/use-auth';
import { getUserRoleInCommunity, getCommunityByHandle } from '@/lib/community-utils';

interface WhatsAppMessage {
  id: string;
  messageId: string;
  userId: string | null;
  senderPhone?: string;
  recipientPhone?: string;
  senderName?: string;
  recipientName?: string;
  messageText: string;
  direction: 'incoming' | 'outgoing';
  timestamp: any;
  read: boolean;
  messageType?: string;
  media?: {
    url?: string;
    caption?: string;
  };
  image?: {
    url?: string;
    caption?: string;
  }
}

interface Conversation {
  userId: string | null;
  userPhone: string;
  userName: string;
  userAvatar?: string;
  lastMessage: string;
  lastMessageTime: any;
  unreadCount: number;
}

export default function CommunityInboxPage() {
  const { user } = useAuth();
  const params = useParams();
  const pathname = usePathname();
  const handle = params?.handle as string;
  
  const [communityMembers, setCommunityMembers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<string>('all');
  const [community, setCommunity] = useState<Community | null>(null);
  const [userRole, setUserRole] = useState<string>('guest');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  // Load community and role
  useEffect(() => {
    async function fetchCommunityAndRole() {
      if (!handle) return;
      try {
        const communityData = await getCommunityByHandle(handle);
        setCommunity(communityData);
        if (communityData && user) {
          const role = await getUserRoleInCommunity(user.uid, communityData.communityId);
          setUserRole(role);
        }
      } catch (error) {
        console.error('Error fetching community data:', error);
      }
    }
    fetchCommunityAndRole();
  }, [handle, user]);

  // Load community members
  useEffect(() => {
    if (!handle) return;

    const loadCommunityMembers = async () => {
      try {
        console.log('[Inbox] Loading members for community:', handle);
        
        // Get community ID from handle
        const communitiesRef = collection(db, 'communities');
        const communityQuery = query(communitiesRef, where('handle', '==', handle));
        const communitySnapshot = await getDocs(communityQuery);
        
        if (!communitySnapshot.empty) {
          const communityId = communitySnapshot.docs[0].id;
          console.log('[Inbox] Found community ID:', communityId);
          
          // Get community members - use 'communityMembers' collection (no underscore)
          const membersRef = collection(db, 'communityMembers');
          const membersQuery = query(membersRef, where('communityId', '==', communityId));
          const membersSnapshot = await getDocs(membersQuery);
          
          console.log('[Inbox] Found members count:', membersSnapshot.docs.length);
          
          // Get user details for each member
          const memberPromises = membersSnapshot.docs.map(async (memberDoc) => {
            const memberData = memberDoc.data();
            try {
              // Use getDoc() to get user by ID directly
              const userDocRef = doc(db, 'users', memberData.userId);
              const userDocSnap = await getDoc(userDocRef);
              
              if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                console.log('[Inbox] Loaded user:', userData.displayName || memberData.userId);
                return { 
                  userId: memberData.userId, 
                  ...userData 
                } as User;
              } else {
                console.log('[Inbox] User not found:', memberData.userId);
              }
            } catch (error) {
              console.error('[Inbox] Error loading user:', memberData.userId, error);
            }
            return null;
          });
          
          const members = (await Promise.all(memberPromises)).filter(Boolean) as User[];
          console.log('[Inbox] Loaded members:', members.length, members.map(m => m.displayName));
          setCommunityMembers(members);
        } else {
          console.log('[Inbox] No community found with handle:', handle);
        }
      } catch (error) {
        console.error('[Inbox] Error loading community members:', error);
      }
    };

    loadCommunityMembers();
  }, [handle]);

  // Load all conversations with unread counts
  useEffect(() => {
    // Query from WhatsApp messages collection (add more services as they're implemented)
    const messagesRef = collection(db, 'messages_whatsapp');
    const messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const conversationMap = new Map<string, Conversation>();
      const userMessageMap = new Map<string, WhatsAppMessage[]>();

      // Group messages by user
      snapshot.docs.forEach((doc) => {
        const msg = { id: doc.id, ...doc.data() } as WhatsAppMessage;
        const userId = msg.userId || msg.senderPhone || msg.recipientPhone || 'unknown';
        
        if (!userMessageMap.has(userId)) {
          userMessageMap.set(userId, []);
        }
        userMessageMap.get(userId)!.push(msg);
      });

      // Create conversations from community members
      communityMembers.forEach((member) => {
        const memberMessages = userMessageMap.get(member.userId) || [];
        const lastMessage = memberMessages[0];
        const unreadCount = memberMessages.filter(
          (msg) => msg.direction === 'incoming' && !msg.read
        ).length;

        console.log('[Inbox] Member:', member.displayName, 'userId:', member.userId, 'phone:', member.phone || member.phoneNumber, 'messages:', memberMessages.length, 'unread:', unreadCount);

        conversationMap.set(member.userId, {
          userId: member.userId,
          userPhone: member.phone || member.phoneNumber || '',
          userName: member.displayName || 'Unknown',
          userAvatar: member.avatarUrl,
          lastMessage: lastMessage?.messageText || 'No messages yet',
          lastMessageTime: lastMessage?.timestamp,
          unreadCount,
        });
      });

      // Add conversations from messages for non-members
      userMessageMap.forEach((messages, userId) => {
        if (!conversationMap.has(userId)) {
          const firstMsg = messages[0];
          const unreadCount = messages.filter(
            (msg) => msg.direction === 'incoming' && !msg.read
          ).length;

          conversationMap.set(userId, {
            userId: firstMsg.userId,
            userPhone: firstMsg.senderPhone || firstMsg.recipientPhone || '',
            userName: firstMsg.senderName || firstMsg.recipientName || 'Unknown',
            lastMessage: firstMsg.messageText,
            lastMessageTime: firstMsg.timestamp,
            unreadCount,
          });
        }
      });

      setConversations(Array.from(conversationMap.values()));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [communityMembers]);

  // Load messages for selected user and mark as read
useEffect(() => {
    if (!selectedUserId) {
        setMessages([]);
        return;
    }

    const member = communityMembers.find(m => m.userId === selectedUserId);
    if (!member) {
        setMessages([]);
        return;
    }
    
    // Normalize phone number - crucial for matching
    const memberPhone = member.phone || member.phoneNumber;
    if (!memberPhone) {
        console.warn(`[Inbox] Selected member ${member.displayName} has no phone number.`);
        setMessages([]);
        return;
    }
    
    const normalizedPhone = memberPhone.replace(/\D/g, ''); // Remove all non-digit characters

    console.log(`[Inbox] Loading messages for user: ${selectedUserId}, phone: ${normalizedPhone}`);

    const messagesRef = collection(db, 'messages_whatsapp');
    
    // Query for messages sent TO this user (outgoing from us)
    const outgoingQuery = query(
        messagesRef,
        where('recipientPhone', '==', normalizedPhone),
        orderBy('timestamp', 'asc')
    );
    
    // Query for messages sent FROM this user (incoming to us)
    const incomingQuery = query(
        messagesRef,
        where('senderPhone', '==', `+${normalizedPhone}`), // Webhook adds '+'
        orderBy('timestamp', 'asc')
    );

    const unsubOutgoing = onSnapshot(outgoingQuery, (outgoingSnap) => {
        const outgoingMsgs = outgoingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WhatsAppMessage));
        
        const unsubIncoming = onSnapshot(incomingQuery, async (incomingSnap) => {
            const incomingMsgs = incomingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WhatsAppMessage));
            
            const allMessages = [...outgoingMsgs, ...incomingMsgs];
            
            // Sort all messages by timestamp
            allMessages.sort((a, b) => {
                const timeA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(0);
                const timeB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(0);
                return timeA - timeB;
            });
            
            setMessages(allMessages);
            console.log(`[Inbox] Total messages for ${selectedUserId}: ${allMessages.length}`);
            
            // Mark unread messages as read
            for (const msg of incomingMsgs) {
                if (!msg.read) {
                    try {
                        const msgRef = doc(db, 'messages_whatsapp', msg.id);
                        await updateDoc(msgRef, { read: true });
                    } catch (error) {
                        console.error('[Inbox] Error marking message as read:', error);
                    }
                }
            }
        });
        
        // Return a cleanup function that unsubscribes from both listeners
        return () => unsubIncoming();
    });

    return () => unsubOutgoing();
}, [selectedUserId, communityMembers]);

  const filteredConversations = conversations.filter((conv) =>
    conv.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.userPhone.includes(searchTerm)
  );

  const selectedConversation = conversations.find(
    (c) => c.userId === selectedUserId
  );

  // Calculate member count excluding owner
  const nonOwnerMembers = communityMembers.filter((m: any) => m.role !== 'owner');
  const memberCountExcludingOwner = nonOwnerMembers.length;

  return (
    <div className="space-y-8">
      {community && (
        <CommunityHeader 
          community={community} 
          userRole={userRole as any} 
          onEdit={() => setIsEditDialogOpen(true)}
          onDelete={() => setIsDeleteConfirmOpen(true)}
          onAddMember={() => setIsAddMemberOpen(true)}
          onInvite={() => setIsInviteDialogOpen(true)}
          memberCount={memberCountExcludingOwner}
        />
      )}
      <div className="h-[calc(100vh-200px)] flex">
      {/* Left sidebar - Conversations list */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading conversations...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No conversations yet
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.userId || conv.userPhone}
                className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${selectedUserId === conv.userId ? 'bg-muted' : ''}`}
                onClick={() => setSelectedUserId(conv.userId)}
              >
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarImage src={conv.userAvatar || undefined} />
                    <AvatarFallback>
                      {conv.userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold truncate">{conv.userName}</p>
                      {conv.unreadCount > 0 && (
                        <span className="text-xs rounded-full px-2 py-0.5 bg-primary text-primary-foreground">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.lastMessage}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {conv.userPhone}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right side - Messages */}
      <div className="flex-1 flex flex-col">
        {selectedUserId ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedConversation?.userAvatar || undefined} />
                    <AvatarFallback>
                      {selectedConversation?.userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedConversation?.userName}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedConversation?.userPhone}
                    </p>
                  </div>
                </div>
                
                {/* Messaging Service Filter */}
                <MessagingServiceDropdown
                  value={selectedService}
                  onChange={setSelectedService}
                />
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground">
                  No messages yet
                </div>
              ) : (
                messages.map((msg) => {
                  const mediaUrl = msg.media?.url || msg.image?.url;
                  const messageText = msg.messageText || msg.media?.caption || msg.image?.caption || '';

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          msg.direction === 'outgoing'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {mediaUrl && (msg.messageType === 'image') && (
                          <img
                            src={mediaUrl}
                            alt="WhatsApp image"
                            className="max-w-full rounded-lg mb-2 max-h-96 object-contain"
                          />
                        )}
                        {/* Add other media types here as needed */}

                        {messageText && (
                            <p className="whitespace-pre-wrap break-words">{messageText}</p>
                        )}
                        
                        <p
                          className={`text-xs mt-1 ${
                            msg.direction === 'outgoing'
                              ? 'text-primary-foreground/70'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {msg.timestamp?.toDate?.()?.toLocaleTimeString() || 'Just now'}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Message input (placeholder) */}
            <div className="p-4 border-t">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Type a message... (replies not yet supported)"
                  disabled
                  className="flex-1"
                />
                <Button
                  disabled
                  size="icon"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Note: Direct replies are not yet supported. Use broadcast to send messages.
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-lg mb-2">Select a conversation</p>
              <p className="text-sm">Choose a conversation from the left to view messages</p>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
