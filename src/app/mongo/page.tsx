
'use client';

import { useState, useEffect, useMemo } from 'react';
import { getCommunities, getMembers, getMessagesForMember, getRawDocument } from './actions';
import { Copy } from 'lucide-react';

// A simple debounce hook
function useDebounce(value: any, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

// Define interfaces for the data structures
interface Community {
  id: string;
  name: string;
  memberCount: number;
  communityProfileImage?: string;
  owner: string;
}

interface Member {
  id: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
  email: string;
  photoURL?: string;
  phoneNumber?: string;
}

interface Message {
  id: string;
  text: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    avatar: string;
  };
}

const CommunityListMongo = ({ communities, onSelect, selectedCommunity, onCopyJson }: { communities: Community[], onSelect: (c: Community) => void, selectedCommunity: Community | null, onCopyJson: (collection: string, id: string) => void }) => (
    <div className="overflow-y-auto">
        {communities.map(c => (
            <div key={c.id} onClick={() => onSelect(c)} className={`p-4 border-b cursor-pointer flex justify-between items-center ${selectedCommunity?.id === c.id ? 'bg-gray-200' : ''}`}>
                <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-sm text-gray-500">{c.memberCount} members</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onCopyJson('communities', c.id); }} className="p-1 hover:bg-gray-300 rounded"><Copy size={16} /></button>
            </div>
        ))}
    </div>
);


// Main component for the Mongo dashboard
export default function MongoDashboard() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const [isLoadingCommunities, setIsLoadingCommunities] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const [communitySearch, setCommunitySearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [messageSearch, setMessageSearch] = useState('');

  const debouncedCommunitySearch = useDebounce(communitySearch, 500);
  const debouncedMemberSearch = useDebounce(memberSearch, 500);
  const debouncedMessageSearch = useDebounce(messageSearch, 500);

  // Fetch communities on initial load and when search changes
  useEffect(() => {
    async function fetchCommunities() {
      setIsLoadingCommunities(true);
      const communities = await getCommunities(debouncedCommunitySearch);
      setCommunities(communities);
      setIsLoadingCommunities(false);
    }
    fetchCommunities();
  }, [debouncedCommunitySearch]);

  // Handle community selection
  const handleCommunitySelect = async (community: Community) => {
    setSelectedCommunity(community);
    setSelectedMember(null);
    setMessages([]);
    setMemberSearch('');
    setMessageSearch('');
    setIsLoadingMembers(true);
    const members = await getMembers(community.id);
    setMembers(members);
    setIsLoadingMembers(false);
  };

  // Fetch members when member search changes
  useEffect(() => {
    async function fetchMembers() {
        if(selectedCommunity) {
            setIsLoadingMembers(true);
            const members = await getMembers(selectedCommunity.id, debouncedMemberSearch);
            setMembers(members);
            setIsLoadingMembers(false);
        }
    }
    fetchMembers();
  }, [selectedCommunity, debouncedMemberSearch]);

  // Handle member selection
  const handleMemberSelect = async (member: Member) => {
    setSelectedMember(member);
    setMessageSearch('');
    setIsLoadingMessages(true);
    if (selectedCommunity) {
      const messages = await getMessagesForMember(selectedCommunity.id, member.id);
      setMessages(messages);
    }
    setIsLoadingMessages(false);
  };

  // Fetch messages when message search changes
  useEffect(() => {
    async function fetchMessages() {
        if(selectedCommunity && selectedMember) {
            setIsLoadingMessages(true);
            const messages = await getMessagesForMember(selectedCommunity.id, selectedMember.id, debouncedMessageSearch);
            setMessages(messages);
            setIsLoadingMessages(false);
        }
    }
    fetchMessages();
  }, [selectedCommunity, selectedMember, debouncedMessageSearch]);

  const handleCopyJson = async (collectionName: string, id: string) => {
    const json = await getRawDocument(collectionName, id);
    navigator.clipboard.writeText(json);
    alert('JSON copied to clipboard!');
  };

  return (
    <div className="flex h-screen bg-white text-black">
      {/* Communities Panel */}
      <div className="w-1/4 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Communities</h2>
          <input type="text" placeholder="Search communities..." value={communitySearch} onChange={(e) => setCommunitySearch(e.target.value)} className="w-full p-2 mt-2 border rounded text-black" />
        </div>
        {isLoadingCommunities ? (
          <p className="p-4">Loading communities...</p>
        ) : (
          <CommunityListMongo communities={communities} onSelect={handleCommunitySelect} selectedCommunity={selectedCommunity} onCopyJson={handleCopyJson} />
        )}
      </div>

      {/* Members Panel */}
      <div className="w-1/4 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Members</h2>
          <input type="text" placeholder="Search members..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} className="w-full p-2 mt-2 border rounded text-black" />
        </div>
        {selectedCommunity ? (
            isLoadingMembers ? <p className="p-4">Loading members...</p> : (
                <div className="overflow-y-auto">
                    {members.map(m => (
                        <div key={m.id} onClick={() => handleMemberSelect(m)} className={`p-4 border-b cursor-pointer flex justify-between items-center ${selectedMember?.id === m.id ? 'bg-gray-200' : ''}`}>
                            <div>
                                <p className="font-semibold">{m.name}</p>
                                <p className="text-sm text-gray-500">{m.email}</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); handleCopyJson('users', m.id); }} className="p-1 hover:bg-gray-300 rounded"><Copy size={16} /></button>
                        </div>
                    ))}
                </div>
            )
        ) : <p className="p-4 text-gray-500">Select a community to see members</p>}
      </div>

      {/* Messages Panel */}
      <div className="w-1/2 bg-white flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Messages</h2>
          <input type="text" placeholder="Search messages..." value={messageSearch} onChange={(e) => setMessageSearch(e.target.value)} className="w-full p-2 mt-2 border rounded text-black" />
        </div>
        {selectedMember ? (
            isLoadingMessages ? <p className="p-4">Loading messages...</p> : (
                <div className="overflow-y-auto p-4 space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className="p-3 rounded-lg bg-gray-100">
                            <div className="flex justify-between items-start">
                                <p className="font-semibold">{msg.sender.name}</p>
                                <button onClick={(e) => { e.stopPropagation(); handleCopyJson('messages', msg.id); }} className="p-1 hover:bg-gray-300 rounded"><Copy size={16} /></button>
                            </div>
                            <p>{msg.text}</p>
                            <p className="text-xs text-gray-400 text-right">{new Date(msg.createdAt).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            )
        ) : <p className="p-4 text-gray-500">Select a member to see messages</p>}
      </div>
    </div>
  );
}
