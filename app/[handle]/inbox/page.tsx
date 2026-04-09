'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/firebase/firestore';
import { collection, query, where, orderBy, onSnapshot, getDocs, getDoc, doc, updateDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage, Input } from '@/components/ui';
import { Search, Mail, MessageSquare, Lock, Globe, Inbox, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Community } from '@/lib/types';
import { Banner } from '@/components/ui/banner';
import { PageLoadingSkeleton } from '@/components/community/page-loading-skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useCommunityAccess } from '@/hooks/use-community-access';

interface Message {
  id: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientName?: string;
  senderEmail?: string;
  senderPhone?: string;
  senderName?: string;
  subject?: string;
  messageText: string;
  direction: 'incoming' | 'outgoing';
  timestamp: any;
  read: boolean;
  type: 'email' | 'whatsapp';
  userId?: string;
  communityId?: string;
  broadcastId?: string;
}

interface Conversation {
  oduserId: string;
  recipientId: string;
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientAvatar?: string;
  lastMessage: string;
  lastMessageTime: any;
  unreadCount: number;
  messageTypes: Set<'email' | 'whatsapp'>;
}

type FilterType = 'all' | 'email' | 'whatsapp';

function InboxContent() {
  const { user } = useAuth();
  const params = useParams();
  const handle = params?.handle as string;

  // Access control hook
  const { community, userRole, loading: accessLoading, hasAccess } = useCommunityAccess({
    handle,
    requireAuth: true,
    allowedRoles: ['owner', 'admin', 'member'],
    redirectOnDenied: true,
  });

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageSearchTerm, setMessageSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [communityMembers, setCommunityMembers] = useState<any[]>([]);

  // Load community members
  useEffect(() => {
    if (!community?.communityId || accessLoading) return;

    const loadMembers = async () => {
      try {
        const membersQuery = query(
          collection(db, 'communityMembers'),
          where('communityId', '==', community.communityId)
        );
        const membersSnapshot = await getDocs(membersQuery);

        const memberPromises = membersSnapshot.docs.map(async (memberDoc) => {
          const memberData = memberDoc.data();
          try {
            const userDocRef = doc(db, 'users', memberData.userId);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              return {
                memberId: memberDoc.id,
                oduserId: memberData.userId,
                ...memberData,
                ...userDocSnap.data(),
              };
            }
          } catch (error) {
            console.error('Error loading user:', error);
          }
          return null;
        });

        const members = (await Promise.all(memberPromises)).filter(Boolean);
        setCommunityMembers(members);
      } catch (error) {
        console.error('Error loading members:', error);
      }
    };

    loadMembers();
  }, [community?.communityId]);

  // Load conversations from inbox messages
  useEffect(() => {
    if (!handle) {
      setLoading(false);
      return;
    }

    // Query all messages for this community by handle (both outgoing and incoming)
    const messagesQuery = query(
      collection(db, 'inboxMessages'),
      where('communityHandle', '==', handle),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const conversationMap = new Map<string, Conversation>();

        snapshot.docs.forEach((docSnap) => {
          const msg = { id: docSnap.id, ...docSnap.data() } as Message;

          // For outgoing: group by recipient; for incoming: group by sender
          const memberEmail = msg.direction === 'outgoing'
            ? (msg.recipientEmail || '')
            : (msg.senderEmail || '');
          const memberName = msg.direction === 'outgoing'
            ? (msg.recipientName || msg.recipientEmail || 'Unknown')
            : (msg.senderName || msg.senderEmail || 'Unknown');
          const conversationKey = memberEmail || docSnap.id;

          if (!conversationMap.has(conversationKey)) {
            conversationMap.set(conversationKey, {
              oduserId: msg.userId || '',
              recipientId: conversationKey,
              recipientName: memberName,
              recipientEmail: memberEmail || undefined,
              recipientPhone: msg.senderPhone,
              recipientAvatar: undefined,
              lastMessage: msg.messageText?.substring(0, 100) || '',
              lastMessageTime: msg.timestamp,
              unreadCount: (!msg.read && msg.direction === 'incoming') ? 1 : 0,
              messageTypes: new Set([msg.type]),
            });
          } else {
            const conv = conversationMap.get(conversationKey)!;
            if (!msg.read && msg.direction === 'incoming') conv.unreadCount++;
            conv.messageTypes.add(msg.type);
            if (!conv.lastMessageTime || (msg.timestamp && msg.timestamp.seconds > conv.lastMessageTime?.seconds)) {
              conv.lastMessage = msg.messageText?.substring(0, 100) || '';
              conv.lastMessageTime = msg.timestamp;
            }
          }
        });

        // Merge with community members who haven't messaged yet
        communityMembers.forEach((member) => {
          const memberEmail = member.email || member.userDetails?.email || '';
          if (memberEmail && !conversationMap.has(memberEmail)) {
            conversationMap.set(memberEmail, {
              oduserId: member.oduserId || member.userId || '',
              recipientId: memberEmail,
              recipientName: member.displayName || member.userDetails?.displayName || 'Unknown',
              recipientEmail: memberEmail,
              recipientPhone: member.phone || member.phoneNumber || member.userDetails?.phone,
              recipientAvatar: member.avatarUrl || member.userDetails?.avatarUrl,
              lastMessage: 'No messages yet',
              lastMessageTime: null,
              unreadCount: 0,
              messageTypes: new Set(),
            });
          }
        });

        setConversations(Array.from(conversationMap.values()).sort((a, b) => {
          if (!a.lastMessageTime) return 1;
          if (!b.lastMessageTime) return -1;
          return b.lastMessageTime.seconds - a.lastMessageTime.seconds;
        }));
        setLoading(false);
      },
      (error) => {
        console.error('Error in inbox snapshot listener:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [handle, communityMembers]);

  // Filter conversations based on search and filter type
  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.recipientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (conv.recipientPhone?.includes(searchTerm) ?? false);

    if (filter === 'all') return matchesSearch;
    if (filter === 'email') return matchesSearch && (conv.recipientEmail || conv.messageTypes.has('email'));
    if (filter === 'whatsapp') return matchesSearch && (conv.recipientPhone || conv.messageTypes.has('whatsapp'));
    return matchesSearch;
  });

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversationId || !handle) {
      setMessages([]);
      return;
    }

    const messagesQuery = query(
      collection(db, 'inboxMessages'),
      where('communityHandle', '==', handle),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const conversationMessages = snapshot.docs
        .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Message))
        .filter(msg => {
          const memberEmail = msg.direction === 'outgoing' ? msg.recipientEmail : msg.senderEmail;
          return memberEmail === selectedConversationId;
        });

      setMessages(conversationMessages);

      // Mark incoming messages as read
      conversationMessages.forEach(async (msg) => {
        if (!msg.read && msg.direction === 'incoming') {
          try {
            await updateDoc(doc(db, 'inboxMessages', msg.id), { read: true });
          } catch (error) {
            console.error('Error marking message as read:', error);
          }
        }
      });
    });

    return () => unsubscribe();
  }, [selectedConversationId, handle]);

  const selectedConversation = conversations.find((c) => c.recipientId === selectedConversationId);

  // Filter messages by search term
  const filteredMessages = messages.filter(msg => {
    if (!messageSearchTerm) return true;
    const searchLower = messageSearchTerm.toLowerCase();
    return (
      msg.messageText.toLowerCase().includes(searchLower) ||
      msg.subject?.toLowerCase().includes(searchLower) ||
      msg.senderName?.toLowerCase().includes(searchLower) ||
      msg.senderEmail?.toLowerCase().includes(searchLower)
    );
  });

  if (accessLoading || loading) {
    return <PageLoadingSkeleton showInbox={true} />;
  }

  if (!hasAccess) {
    return null;
  }

  if (!community) {
    return null;
  }

  if (!community) {
    return (
      <div className="p-8">
        <div className="rounded-2xl p-8" style={{ backgroundColor: 'var(--page-content-bg)', border: '2px solid var(--page-content-border)' }}>
          <p>Community not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--page-bg-color)' }}>
      <div className="p-8 flex-1 overflow-hidden flex flex-col">
        {/* Single container with Banner and Inbox Content */}
        <div className="flex-1 rounded-2xl overflow-hidden flex flex-col" style={{ backgroundColor: 'var(--page-content-bg)', border: '2px solid var(--page-content-border)' }}>
          {community && (
            <Banner
              backgroundImage={community.communityBackgroundImage}
              iconImage={community.communityProfileImage}
              title={community.name}
              location={(community as any).location}
              locationExtra={
                <span className="flex items-center gap-1 text-sm text-white/90">
                  {(community as any).visibility === 'private' ? (
                    <><Lock className="h-3.5 w-3.5" /> Private</>
                  ) : (
                    <><Globe className="h-3.5 w-3.5" /> Public</>
                  )}
                </span>
              }
              subtitle={community.tagline || (community as any).mantras}
              height="16rem"
            />
          )}
          {/* Inbox Content */}
          <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar - Conversations list */}
          <div className="w-80 border-r flex flex-col" style={{ borderColor: '#E8DFD1' }}>
            {/* Filter Toggles */}
            <div className="p-4 border-b" style={{ borderColor: '#E8DFD1' }}>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setFilter('all')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    filter === 'all' ? 'text-white' : 'text-[#5B4A3A] hover:bg-[#E8DFD1]'
                  }`}
                  style={{ backgroundColor: filter === 'all' ? '#5B4A3A' : 'transparent' }}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('email')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                    filter === 'email' ? 'text-white' : 'text-[#5B4A3A] hover:bg-[#E8DFD1]'
                  }`}
                  style={{ backgroundColor: filter === 'email' ? '#5B4A3A' : 'transparent' }}
                >
                  <Mail className="h-4 w-4" />
                  Email
                </button>
                <button
                  onClick={() => setFilter('whatsapp')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                    filter === 'whatsapp' ? 'text-white' : 'text-[#5B4A3A] hover:bg-[#E8DFD1]'
                  }`}
                  style={{ backgroundColor: filter === 'whatsapp' ? '#25D366' : 'transparent' }}
                >
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B7355]" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  style={{ backgroundColor: 'white', borderColor: '#E8DFD1' }}
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-[#8B7355]">
                  <Inbox className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No conversations yet
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.recipientId}
                    className={`p-4 border-b cursor-pointer transition-colors ${
                      selectedConversationId === conv.recipientId ? 'bg-[#E8DFD1]' : 'hover:bg-[#FAF8F5]'
                    }`}
                    style={{ borderColor: '#E8DFD1' }}
                    onClick={() => setSelectedConversationId(conv.recipientId)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conv.recipientAvatar || undefined} />
                        <AvatarFallback style={{ backgroundColor: '#5B4A3A', color: 'white' }}>
                          {conv.recipientName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold truncate text-[#5B4A3A]">{conv.recipientName}</p>
                          {conv.unreadCount > 0 && (
                            <span className="text-xs rounded-full px-2 py-0.5 bg-[#5B4A3A] text-white">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[#8B7355] truncate">{conv.lastMessage}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {conv.recipientEmail && (
                            <span className="text-xs text-[#8B7355] flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                            </span>
                          )}
                          {conv.recipientPhone && (
                            <span className="text-xs text-[#8B7355] flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right side - Messages */}
          <div className="flex-1 flex flex-col" style={{ backgroundColor: '#FAF8F5' }}>
            {selectedConversationId && selectedConversation ? (
              <>
                {/* Chat header */}
                <div className="p-4 border-b bg-white" style={{ borderColor: '#E8DFD1' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedConversation.recipientAvatar || undefined} />
                      <AvatarFallback style={{ backgroundColor: '#5B4A3A', color: 'white' }}>
                        {selectedConversation.recipientName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-[#5B4A3A]">{selectedConversation.recipientName}</p>
                      <div className="flex items-center gap-3 text-sm text-[#8B7355]">
                        {selectedConversation.recipientEmail && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            {selectedConversation.recipientEmail}
                          </span>
                        )}
                        {selectedConversation.recipientPhone && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {selectedConversation.recipientPhone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Search messages */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B7355]" />
                    <Input
                      placeholder="Search messages..."
                      value={messageSearchTerm}
                      onChange={(e) => setMessageSearchTerm(e.target.value)}
                      className="pl-9"
                      style={{ backgroundColor: 'white', borderColor: '#E8DFD1' }}
                    />
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {filteredMessages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center h-full">
                      <div className="text-center text-[#8B7355]">
                        <Inbox className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg mb-1">{messageSearchTerm ? 'No matching messages' : 'No messages yet'}</p>
                        <p className="text-sm">{messageSearchTerm ? 'Try a different search term' : 'Send a broadcast to start the conversation'}</p>
                      </div>
                    </div>
                  ) : (
                    filteredMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                            msg.direction === 'outgoing'
                              ? 'bg-[#5B4A3A] text-white'
                              : 'bg-white border'
                          }`}
                          style={{ borderColor: msg.direction === 'incoming' ? '#E8DFD1' : undefined }}
                        >
                          {msg.subject && (
                            <p className={`font-semibold mb-1 ${msg.direction === 'outgoing' ? 'text-white' : 'text-[#5B4A3A]'}`}>
                              {msg.subject}
                            </p>
                          )}
                          <p className={`whitespace-pre-wrap break-words ${msg.direction === 'incoming' ? 'text-[#5B4A3A]' : ''}`}>
                            {msg.messageText}
                          </p>
                          <div className={`flex items-center gap-2 mt-2 text-xs ${
                            msg.direction === 'outgoing' ? 'text-white/70' : 'text-[#8B7355]'
                          }`}>
                            {msg.type === 'email' ? <Mail className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                            <span>{msg.timestamp?.toDate?.()?.toLocaleString() || 'Just now'}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer note */}
                <div className="p-4 border-t bg-white" style={{ borderColor: '#E8DFD1' }}>
                  <p className="text-xs text-[#8B7355] text-center">
                    Use the Broadcast feature to send messages to members
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-[#8B7355]">
                  <Inbox className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">Select a conversation</p>
                  <p className="text-sm">Choose a member from the left to view messages</p>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InboxPage() {
  return (
    <Suspense fallback={<PageLoadingSkeleton showInbox={true} />}>
      <InboxContent />
    </Suspense>
  );
}
