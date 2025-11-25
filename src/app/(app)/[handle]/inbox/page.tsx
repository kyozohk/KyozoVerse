
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/firebase/firestore';
import { collection, query, where, orderBy, onSnapshot, getDocs, getDoc, updateDoc, doc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage, Card, Input } from '@/components/ui';
import { Search, Send } from 'lucide-react';
import { User } from '@/lib/types';

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
  const params = useParams();
  const handle = params?.handle as string;
  
  const [communityMembers, setCommunityMembers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

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
    const messagesRef = collection(db, 'whatsapp_messages');
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

    const messagesRef = collection(db, 'whatsapp_messages');
    const messagesQuery = query(
      messagesRef,
      where('userId', '==', selectedUserId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, async (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as WhatsAppMessage[];
      setMessages(msgs);

      // Mark all incoming unread messages as read
      const unreadMessages = msgs.filter(
        (msg) => msg.direction === 'incoming' && !msg.read
      );
      
      for (const msg of unreadMessages) {
        try {
          const msgRef = doc(db, 'whatsapp_messages', msg.id);
          await updateDoc(msgRef, { read: true });
        } catch (error) {
          console.error('Error marking message as read:', error);
        }
      }
    });

    return () => unsubscribe();
  }, [selectedUserId]);

  const filteredConversations = conversations.filter((conv) =>
    conv.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.userPhone.includes(searchTerm)
  );

  const selectedConversation = conversations.find(
    (c) => c.userId === selectedUserId
  );

  return (
    <div className="h-[calc(100vh)] flex">
      {/* Left sidebar - Conversations list */}
      <div className="w-80 border-r bg-background flex flex-col">
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
                className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                  selectedUserId === conv.userId ? 'bg-muted' : ''
                }`}
                onClick={() => setSelectedUserId(conv.userId)}
              >
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarImage src={conv.userAvatar} />
                    <AvatarFallback>
                      {conv.userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold truncate">{conv.userName}</p>
                      {conv.unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
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
            <div className="p-4 border-b bg-background">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={selectedConversation?.userAvatar} />
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
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground">
                  No messages yet
                </div>
              ) : (
                messages.map((msg) => (
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
                      <p className="whitespace-pre-wrap break-words">{msg.messageText}</p>
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
                ))
              )}
            </div>

            {/* Message input (placeholder) */}
            <div className="p-4 border-t bg-background">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Type a message... (replies not yet supported)"
                  disabled
                  className="flex-1"
                />
                <button
                  disabled
                  className="p-2 rounded-lg bg-primary text-primary-foreground opacity-50 cursor-not-allowed"
                >
                  <Send className="h-5 w-5" />
                </button>
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
  );
}
