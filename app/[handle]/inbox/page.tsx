'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/firebase/firestore';
import { collection, query, where, orderBy, onSnapshot, getDocs, getDoc, doc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage, Input } from '@/components/ui';
import { Search, Mail, MessageSquare, Loader2, Lock, Globe, Inbox } from 'lucide-react';
import { Community } from '@/lib/types';
import { Banner } from '@/components/ui/banner';
import { useAuth } from '@/hooks/use-auth';
import { getUserRoleInCommunity } from '@/lib/community-utils';

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

  const [community, setCommunity] = useState<Community | null>(null);
  const [userRole, setUserRole] = useState<string>('guest');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [communityMembers, setCommunityMembers] = useState<any[]>([]);

  // Load community
  useEffect(() => {
    async function fetchCommunity() {
      if (!handle) return;
      try {
        const communityQuery = query(collection(db, 'communities'), where('handle', '==', handle));
        const snapshot = await getDocs(communityQuery);
        if (!snapshot.empty) {
          const communityData = { communityId: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Community;
          setCommunity(communityData);
          if (user) {
            const role = await getUserRoleInCommunity(user.uid, communityData.communityId);
            setUserRole(role);
          }
        }
      } catch (error) {
        console.error('Error fetching community:', error);
      }
    }
    fetchCommunity();
  }, [handle, user]);

  // Load community members
  useEffect(() => {
    if (!community?.communityId) return;

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

  // Load conversations from broadcast emails and WhatsApp messages
  useEffect(() => {
    if (!community?.communityId) {
      setLoading(false);
      return;
    }

    const conversationMap = new Map<string, Conversation>();

    // Create conversations from community members
    communityMembers.forEach((member) => {
      const oduserId = member.oduserId || member.oduserId;
      conversationMap.set(oduserId, {
        oduserId,
        recipientId: oduserId,
        recipientName: member.displayName || member.userDetails?.displayName || 'Unknown',
        recipientEmail: member.email || member.userDetails?.email,
        recipientPhone: member.phone || member.phoneNumber || member.userDetails?.phone,
        recipientAvatar: member.avatarUrl || member.userDetails?.avatarUrl,
        lastMessage: 'No messages yet',
        lastMessageTime: null,
        unreadCount: 0,
        messageTypes: new Set(),
      });
    });

    setConversations(Array.from(conversationMap.values()));
    setLoading(false);

    // TODO: Subscribe to actual message collections when implemented
    // For now, we show member list as potential conversations

  }, [community?.communityId, communityMembers]);

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

  const selectedConversation = conversations.find((c) => c.recipientId === selectedConversationId);

  if (!community && !loading) {
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
              tags={(community as any).tags || []}
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
              {loading ? (
                <div className="p-4 text-center text-[#8B7355]">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                  Loading conversations...
                </div>
              ) : filteredConversations.length === 0 ? (
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
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedConversation.recipientAvatar || undefined} />
                      <AvatarFallback style={{ backgroundColor: '#5B4A3A', color: 'white' }}>
                        {selectedConversation.recipientName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
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
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center h-full">
                      <div className="text-center text-[#8B7355]">
                        <Inbox className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg mb-1">No messages yet</p>
                        <p className="text-sm">Send a broadcast to start the conversation</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => (
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
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center" style={{ backgroundColor: 'var(--page-bg-color)' }}>
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#5B4A3A' }} />
        </div>
      }
    >
      <InboxContent />
    </Suspense>
  );
}
