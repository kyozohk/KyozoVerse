import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Badge } from './badge';
import { Button } from './button';
import { Card } from './card';
import { Input } from '../input';
import { ChevronDown, Grid3x3, List, MessageSquare, Search, TrendingUp, Users, Plus, X, Send, Mail, Heart, Share2, UserPlus, Settings, Pencil, Trash2, Globe, Bot, Sparkles } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  email: string;
  status: 'Active' | 'Inactive';
  joinedDate: string;
  avatar?: string;
  tags: string[];
}

interface CustomTag {
  id: string;
  name: string;
  memberIds: string[];
}

interface InboxMessage {
  id: string;
  name: string;
  message: string;
  time: string;
  avatar?: string;
  unread: boolean;
}

interface FeedPost {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  time: string;
  likes: number;
  comments: number;
  responses?: FeedResponse[];
}

interface FeedResponse {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  time: string;
}

const initialMembers: Member[] = [
  { id: '1', name: 'Ashok Jaiswal', email: 'ashok.jaiswal@gmail.com', status: 'Active', joinedDate: 'Dec 14, 2025', tags: [] },
  { id: '2', name: 'Nikki Davies', email: 'nikkijdavies.com', status: 'Active', joinedDate: 'Dec 28, 2025', tags: [] },
  { id: '3', name: 'Will Poole', email: 'will@kyozo.com', status: 'Active', joinedDate: 'Dec 10, 2025', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop', tags: [] },
  { id: '4', name: 'Ashok Jaiswal', email: 'ashok.jaiswal@gmail.com', status: 'Active', joinedDate: 'Dec 30, 2025', tags: [] },
  { id: '5', name: 'Unknown', email: '', status: 'Active', joinedDate: 'Dec 13, 2025', tags: [] },
  { id: '6', name: 'Ashok Jaiswal', email: 'ashok@kyozo.com', status: 'Active', joinedDate: 'Dec 10, 2025', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', tags: [] },
];

const mockInboxMessages: InboxMessage[] = [
  { id: '1', name: 'Sarah Johnson', message: 'Hey! Thanks for the invite...', time: '5m ago', unread: true, avatar: 'https://i.pravatar.cc/150?img=1' },
  { id: '2', name: 'Michael Chen', message: 'Can we schedule a call?', time: '1h ago', unread: true, avatar: 'https://i.pravatar.cc/150?img=2' },
  { id: '3', name: 'Emma Wilson', message: 'I have a question about...', time: '2h ago', unread: false, avatar: 'https://i.pravatar.cc/150?img=3' },
  { id: '4', name: 'David Brown', message: 'Great community!', time: '5h ago', unread: false, avatar: 'https://i.pravatar.cc/150?img=4' },
];

const mockFeedPosts: FeedPost[] = [
  { 
    id: '1', 
    author: 'Will Poole', 
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop', 
    content: 'Excited to announce our new community initiative! Join us next week for an exclusive workshop on building sustainable creative practices.', 
    time: '2h ago', 
    likes: 24, 
    comments: 8,
    responses: [
      { id: 'r1', author: 'Nikki Davies', avatar: 'https://i.pravatar.cc/150?img=5', content: 'This sounds amazing! Count me in 🎉', time: '1h ago' },
      { id: 'r2', author: 'Ashok Jaiswal', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', content: 'What time does the workshop start?', time: '45m ago' },
      { id: 'r3', author: 'Sarah Johnson', avatar: 'https://i.pravatar.cc/150?img=1', content: 'Looking forward to this!', time: '30m ago' },
    ]
  },
  { 
    id: '2', 
    author: 'Will Poole', 
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop', 
    content: 'What creative projects are you all working on this week? Share below! 👇', 
    time: '1d ago', 
    likes: 18, 
    comments: 12,
    responses: [
      { id: 'r4', author: 'Michael Chen', avatar: 'https://i.pravatar.cc/150?img=2', content: 'Working on a new design system for my startup!', time: '20h ago' },
      { id: 'r5', author: 'Emma Wilson', avatar: 'https://i.pravatar.cc/150?img=3', content: 'Just started a photography series about urban landscapes', time: '18h ago' },
    ]
  },
  { 
    id: '3', 
    author: 'Will Poole', 
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop', 
    content: 'Quick reminder: Monthly community meetup is this Friday at 3pm EST. See you there!', 
    time: '2d ago', 
    likes: 31, 
    comments: 15,
    responses: [
      { id: 'r6', author: 'Nikki Davies', avatar: 'https://i.pravatar.cc/150?img=5', content: 'Will be there! 👍', time: '2d ago' },
      { id: 'r7', author: 'David Brown', avatar: 'https://i.pravatar.cc/150?img=4', content: 'Can we get a recording for those who can\'t make it?', time: '1d ago' },
      { id: 'r8', author: 'Ashok Jaiswal', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', content: 'Excited for this!', time: '1d ago' },
    ]
  },
];

interface OverviewScreenProps {
  initialDisplaySettingsOpen?: boolean;
  initialInviteCustomizerOpen?: boolean;
}

export function OverviewScreen({ initialDisplaySettingsOpen = false, initialInviteCustomizerOpen = false }: OverviewScreenProps = {}) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [customTags, setCustomTags] = useState<CustomTag[]>([]);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [tagName, setTagName] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [filterByTag, setFilterByTag] = useState<string | null>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [displaySettingsOpen, setDisplaySettingsOpen] = useState(initialDisplaySettingsOpen);
  const [rightBrainExpanded, setRightBrainExpanded] = useState(false);
  const [leftBrainExpanded, setLeftBrainExpanded] = useState(false);
  const [currentLogoUrl, setCurrentLogoUrl] = useState('/logo.svg');
  const [currentHeroUrl, setCurrentHeroUrl] = useState('https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&h=400&fit=crop');

  const unreadCount = mockInboxMessages.filter(m => m.unread).length;

  const handleOpenTagModal = (tagId?: string) => {
    if (tagId) {
      const tag = customTags.find(t => t.id === tagId);
      if (tag) {
        setSelectedTagId(tagId);
        setTagName(tag.name);
        setSelectedMemberIds(tag.memberIds);
      }
    } else {
      setSelectedTagId(null);
      setTagName('');
      setSelectedMemberIds([]);
    }
    setTagModalOpen(true);
  };

  const handleCloseTagModal = () => {
    setTagModalOpen(false);
    setSelectedTagId(null);
    setTagName('');
    setSelectedMemberIds([]);
    setMemberSearchQuery('');
  };

  const handleSaveTag = () => {
    if (!tagName.trim()) return;

    if (selectedTagId) {
      setCustomTags(tags =>
        tags.map(tag =>
          tag.id === selectedTagId
            ? { ...tag, name: tagName }
            : tag
        )
      );
    } else {
      const newTag: CustomTag = {
        id: Date.now().toString(),
        name: tagName.trim(),
        memberIds: [],
      };
      setCustomTags([...customTags, newTag]);
      setSelectedTagId(newTag.id);
    }
  };

  const handleApplyTag = () => {
    if (!selectedTagId) return;

    setCustomTags(tags =>
      tags.map(tag =>
        tag.id === selectedTagId
          ? { ...tag, memberIds: selectedMemberIds }
          : tag
      )
    );

    setMembers(mems =>
      mems.map(member => {
        const hasTag = selectedMemberIds.includes(member.id);
        const tagName = customTags.find(t => t.id === selectedTagId)?.name || tagName;
        
        if (hasTag && !member.tags.includes(tagName)) {
          return { ...member, tags: [...member.tags, tagName] };
        } else if (!hasTag && member.tags.includes(tagName)) {
          return { ...member, tags: member.tags.filter(t => t !== tagName) };
        }
        return member;
      })
    );

    handleCloseTagModal();
  };

  const handleToggleMember = (memberId: string) => {
    setSelectedMemberIds(ids =>
      ids.includes(memberId)
        ? ids.filter(id => id !== memberId)
        : [...ids, memberId]
    );
  };

  const handleDeleteTag = (tagId: string) => {
    const tag = customTags.find(t => t.id === tagId);
    if (!tag) return;

    setMembers(mems =>
      mems.map(member => ({
        ...member,
        tags: member.tags.filter(t => t !== tag.name),
      }))
    );

    setCustomTags(tags => tags.filter(t => t.id !== tagId));
    
    if (filterByTag === tagId) {
      setFilterByTag(null);
    }
  };

  const filteredMembers = filterByTag
    ? members.filter(m => {
        const tag = customTags.find(t => t.id === filterByTag);
        return tag && m.tags.includes(tag.name);
      })
    : members;

  const modalFilteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  const isSavedTag = selectedTagId !== null && customTags.some(t => t.id === selectedTagId);
  const canApply = isSavedTag && selectedMemberIds.length > 0;

  return (
    <div className="flex-1 overflow-auto">
     
      {/* AI Command Input */}
      <div className="px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <Bot className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#D4A574]" />
            <Input
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="Ask me to perform actions across your platform... (e.g., 'Send welcome message to all new members')"
              className="pl-12 pr-12 py-6 text-base bg-white border-2 border-[#D8CFC0] focus-visible:border-[#D4A574] rounded-2xl shadow-lg"
            />
            <Button
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-[#E87461] hover:bg-[#D76451]"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-[#000000] mt-3 text-center">
            AI-powered assistance to help you manage your community
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Stats & Inbox Preview */}
          <div className="col-span-2 space-y-6">
            {/* Right Brain Metrics Section */}
            <Card className="bg-gradient-to-br from-[#E8DFD0] to-[#D8CFC0] border-2 border-[#8B7355] shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
              <div 
                className="flex items-center justify-between p-6 cursor-pointer hover:bg-black/5 transition-colors"
                onClick={() => setRightBrainExpanded(!rightBrainExpanded)}
              >
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-[#D4A574]" />
                  <h3 className="text-lg font-bold text-[#3A3630]">Right Brain Metrics</h3>
                </div>
                <ChevronDown className={`w-5 h-5 text-[#8B7355] transition-transform ${rightBrainExpanded ? 'rotate-180' : ''}`} />
              </div>
              
              {rightBrainExpanded && (
                <div className="px-6 pb-6 space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-white/50 rounded-lg border border-[#8B7355]/30">
                    <div className="w-2 h-2 rounded-full bg-[#E87461] mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-[#3A3630]">
                        <span className="font-semibold text-[#E87461]">Women in your community</span> are resonating most with your recent post about collaborative art projects
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-white/50 rounded-lg border border-[#8B7355]/30">
                    <div className="w-2 h-2 rounded-full bg-[#D4A574] mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-[#3A3630]">
                        <span className="font-semibold text-[#D4A574]">The artistic and art-loving community</span> are resonating most with studio tour announcements
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-white/50 rounded-lg border border-[#8B7355]/30">
                    <div className="w-2 h-2 rounded-full bg-[#7BD3C4] mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-[#3A3630]">
                        <span className="font-semibold text-[#7BD3C4]">The musically minded</span> are resonating most with live performance events and jam session meetups
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-white/50 rounded-lg border border-[#8B7355]/30">
                    <div className="w-2 h-2 rounded-full bg-[#B8A6D4] mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-[#3A3630]">
                        <span className="font-semibold text-[#B8A6D4]">Those who like classical music</span> are most resonating with your symphony hall partnership announcement
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Stats Cards with Cultural Vessel Gauges */}
            <div className="grid grid-cols-1 gap-4">
              {/* Left Brain Metrics - Collapsible Card */}
              <Card className="bg-gradient-to-br from-[#E8DFD0] to-[#D8CFC0] border-2 border-[#8B7355] shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                <div 
                  className="flex items-center justify-between p-6 pb-4 cursor-pointer hover:bg-black/5 transition-colors"
                  onClick={() => setLeftBrainExpanded(!leftBrainExpanded)}
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#7BD3C4]" />
                    <h3 className="text-lg font-bold text-[#3A3630]">Left Brain Metrics</h3>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-[#8B7355] transition-transform ${leftBrainExpanded ? 'rotate-180' : ''}`} />
                </div>
                
                {leftBrainExpanded && (
                  <div className="px-6 pb-6">
                    <div className="grid grid-cols-3 gap-4">
                      {/* Total Members */}
                      <div className="p-4 bg-white/30 rounded-lg border border-[#8B7355]/30">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-xs text-[#5A4A3A] font-bold uppercase tracking-wider">Total Members</p>
                            <p className="text-xs text-[#8B7355] mt-0.5">+2 this month</p>
                          </div>
                          <Users className="w-4 h-4 text-[#8B7355]" />
                        </div>
                        
                        <div className="relative flex items-center justify-center mt-6">
                          {/* <HourglassGauge 
                            value={members.length}
                            maxValue={10}
                            label="members"
                            culturalLabel="成員"
                            color="#E87461"
                          /> */}
                        </div>
                        
                        <div className="mt-2 text-center">
                          <div className="inline-block bg-[#3A3630] px-4 py-1.5 rounded border-2 border-[#5A4A3A]">
                            <p className="text-2xl font-bold text-[#E87461] font-mono tracking-wider" style={{ textShadow: '0 0 8px rgba(232, 116, 97, 0.5)' }}>
                              {members.length}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Active Today */}
                      <div className="p-4 bg-white/30 rounded-lg border border-[#8B7355]/30">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-xs text-[#5A4A3A] font-bold uppercase tracking-wider">Active Today</p>
                            <p className="text-xs text-[#8B7355] mt-0.5">Members online</p>
                          </div>
                          <TrendingUp className="w-4 h-4 text-[#8B7355]" />
                        </div>
                        
                        <div className="relative flex items-center justify-center mt-6">
                          {/* <HourglassGauge 
                            value={8}
                            maxValue={10}
                            label="active"
                            culturalLabel="活躍"
                            color="#7BD3C4"
                          /> */}
                        </div>
                        
                        <div className="mt-2 text-center">
                          <div className="inline-block bg-[#3A3630] px-4 py-1.5 rounded border-2 border-[#5A4A3A]">
                            <p className="text-2xl font-bold text-[#7BD3C4] font-mono tracking-wider" style={{ textShadow: '0 0 8px rgba(123, 211, 196, 0.5)' }}>
                              8
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Engagement */}
                      <div className="p-4 bg-white/30 rounded-lg border border-[#8B7355]/30">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-xs text-[#5A4A3A] font-bold uppercase tracking-wider">Engagement</p>
                            <p className="text-xs text-[#8B7355] mt-0.5">Response rate</p>
                          </div>
                          <MessageSquare className="w-4 h-4 text-[#8B7355]" />
                        </div>
                        
                        <div className="relative flex items-center justify-center mt-6">
                          {/* <HourglassGauge 
                            value={94}
                            maxValue={100}
                            label="engagement"
                            culturalLabel="參與"
                            color="#D4A574"
                          /> */}
                        </div>
                        
                        <div className="mt-2 text-center">
                          <div className="inline-block bg-[#3A3630] px-4 py-1.5 rounded border-2 border-[#5A4A3A]">
                            <p className="text-2xl font-bold text-[#D4A574] font-mono tracking-wider" style={{ textShadow: '0 0 8px rgba(212, 165, 116, 0.5)' }}>
                              94%
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Member Milestones */}
            <Card className="bg-gradient-to-br from-[#F5F1E8] to-[#E8DFD0] border-2 border-[#8B7355]">
              <div className="p-6 pb-4 border-b-2 border-[#8B7355]/30">
                <h3 className="text-sm text-[#5A4A3A] font-bold uppercase tracking-wider mb-1">Member Milestones</h3>
                <p className="text-xs text-[#8B7355]">Celebrate your community achievements</p>
              </div>
              
              <div className="max-h-[280px] overflow-y-auto">
                <div className="divide-y divide-[#8B7355]/20">
                  {/* Milestone 1 */}
                  <div className="p-4 hover:bg-[#E8DFD0]/50 transition-colors group">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12 border-2 border-[#7BD3C4] shadow-md">
                        <AvatarImage src="https://i.pravatar.cc/150?img=1" />
                        <AvatarFallback className="bg-[#7BD3C4] text-white">SJ</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-semibold text-[#3A3630]">
                            <span className="text-[#5A4A3A]">Sarah Johnson</span> has just hit her one-year anniversary of membership 🎉
                          </p>
                          <span className="text-xs text-[#8B7355] whitespace-nowrap">2h ago</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-[#7BD3C4]/20 text-[#3A3630] border border-[#7BD3C4] hover:bg-[#7BD3C4]/30 text-xs">
                            1 Year Member
                          </Badge>
                        </div>
                        <Button 
                          size="sm" 
                          className="mt-3 bg-[#6B9BB5] hover:bg-[#5A8AA5] text-white gap-2 rounded-full text-xs h-8"
                        >
                          <Mail className="w-3 h-3" />
                          Send Message
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Milestone 2 */}
                  <div className="p-4 hover:bg-[#E8DFD0]/50 transition-colors group">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12 border-2 border-[#D4A574] shadow-md">
                        <AvatarImage src="https://i.pravatar.cc/150?img=2" />
                        <AvatarFallback className="bg-[#D4A574] text-white">MC</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-semibold text-[#3A3630]">
                            <span className="text-[#5A4A3A]">Michael Chen</span> has attended his fifth consecutive event 🔥
                          </p>
                          <span className="text-xs text-[#8B7355] whitespace-nowrap">5h ago</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-[#D4A574]/20 text-[#3A3630] border border-[#D4A574] hover:bg-[#D4A574]/30 text-xs">
                            5 Events Streak
                          </Badge>
                        </div>
                        <Button 
                          size="sm" 
                          className="mt-3 bg-[#6B9BB5] hover:bg-[#5A8AA5] text-white gap-2 rounded-full text-xs h-8"
                        >
                          <Mail className="w-3 h-3" />
                          Send Message
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Milestone 3 */}
                  <div className="p-4 hover:bg-[#E8DFD0]/50 transition-colors group">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12 border-2 border-[#E87461] shadow-md">
                        <AvatarImage src="https://i.pravatar.cc/150?img=3" />
                        <AvatarFallback className="bg-[#E87461] text-white">EW</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-semibold text-[#3A3630]">
                            <span className="text-[#5A4A3A]">Emma Wilson</span> just became a top contributor this month 🌟
                          </p>
                          <span className="text-xs text-[#8B7355] whitespace-nowrap">1d ago</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-[#E87461]/20 text-[#3A3630] border border-[#E87461] hover:bg-[#E87461]/30 text-xs">
                            Top Contributor
                          </Badge>
                        </div>
                        <Button 
                          size="sm" 
                          className="mt-3 bg-[#6B9BB5] hover:bg-[#5A8AA5] text-white gap-2 rounded-full text-xs h-8"
                        >
                          <Mail className="w-3 h-3" />
                          Send Message
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Milestone 4 */}
                  <div className="p-4 hover:bg-[#E8DFD0]/50 transition-colors group">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12 border-2 border-[#9B6B9E] shadow-md">
                        <AvatarImage src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" />
                        <AvatarFallback className="bg-[#9B6B9E] text-white">WP</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-semibold text-[#3A3630]">
                            <span className="text-[#5A4A3A]">Will Poole</span> has reached 100 community interactions ✨
                          </p>
                          <span className="text-xs text-[#8B7355] whitespace-nowrap">2d ago</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-[#9B6B9E]/20 text-[#3A3630] border border-[#9B6B9E] hover:bg-[#9B6B9E]/30 text-xs">
                            100 Interactions
                          </Badge>
                        </div>
                        <Button 
                          size="sm" 
                          className="mt-3 bg-[#6B9BB5] hover:bg-[#5A8AA5] text-white gap-2 rounded-full text-xs h-8"
                        >
                          <Mail className="w-3 h-3" />
                          Send Message
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Milestone 5 */}
                  <div className="p-4 hover:bg-[#E8DFD0]/50 transition-colors group">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12 border-2 border-[#8BA888] shadow-md">
                        <AvatarImage src="https://i.pravatar.cc/150?img=5" />
                        <AvatarFallback className="bg-[#8BA888] text-white">ND</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-semibold text-[#3A3630]">
                            <span className="text-[#5A4A3A]">Nikki Davies</span> completed her profile and added 10 interests 💚
                          </p>
                          <span className="text-xs text-[#8B7355] whitespace-nowrap">3d ago</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-[#8BA888]/20 text-[#3A3630] border border-[#8BA888] hover:bg-[#8BA888]/30 text-xs">
                            Profile Complete
                          </Badge>
                        </div>
                        <Button 
                          size="sm" 
                          className="mt-3 bg-[#6B9BB5] hover:bg-[#5A8AA5] text-white gap-2 rounded-full text-xs h-8"
                        >
                          <Mail className="w-3 h-3" />
                          Send Message
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Milestone 6 */}
                  <div className="p-4 hover:bg-[#E8DFD0]/50 transition-colors group">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12 border-2 border-[#C97B63] shadow-md">
                        <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" />
                        <AvatarFallback className="bg-[#C97B63] text-white">AJ</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-semibold text-[#3A3630]">
                            <span className="text-[#5A4A3A]">Ashok Jaiswal</span> invited 5 new members to the community 🚀
                          </p>
                          <span className="text-xs text-[#8B7355] whitespace-nowrap">4d ago</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-[#C97B63]/20 text-[#3A3630] border border-[#C97B63] hover:bg-[#C97B63]/30 text-xs">
                            5 Referrals
                          </Badge>
                        </div>
                        <Button 
                          size="sm" 
                          className="mt-3 bg-[#6B9BB5] hover:bg-[#5A8AA5] text-white gap-2 rounded-full text-xs h-8"
                        >
                          <Mail className="w-3 h-3" />
                          Send Message
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Unread Messages Alert */}
            <Card className="bg-gradient-to-r from-[#6B9BB5] to-[#5A8AA5] text-white p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{unreadCount} Unread Messages</p>
                    <p className="text-sm text-white/80">You have new conversations waiting</p>
                  </div>
                </div>
                <Button variant="outline" className="bg-white text-[#6B9BB5] hover:bg-[#F5F1E8] border-0 font-semibold">
                  View All
                </Button>
              </div>
            </Card>

            {/* Inbox Preview */}
            <Card className="bg-white">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Recent Messages</h2>
                  <Button variant="ghost" size="sm" className="text-purple-600">
                    View Inbox →
                  </Button>
                </div>
              </div>
              <div className="divide-y">
                {mockInboxMessages.map((msg) => (
                  <button
                    key={msg.id}
                    className="w-full p-4 hover:bg-gray-50 transition-colors text-left flex items-center gap-3"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={msg.avatar} />
                      <AvatarFallback className="bg-purple-200 text-purple-700">
                        {msg.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-medium text-sm">{msg.name}</h3>
                        <span className="text-xs text-gray-500">{msg.time}</span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{msg.message}</p>
                    </div>
                    {msg.unread && (
                      <div className="w-2 h-2 bg-purple-600 rounded-full flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </Card>

            {/* Members Section */}
            <Card className="bg-white p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-xl font-semibold">Members</h2>
                  <Button
                    onClick={() => handleOpenTagModal()}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Tag
                  </Button>
                </div>
                <p className="text-sm text-gray-600">Browse and manage your community members.</p>
              </div>

              {/* Search and Filters */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 flex items-center gap-2 border rounded-lg px-3 py-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by name..."
                    className="border-0 focus-visible:ring-0 p-0 h-auto"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="w-8 h-8">
                    <List className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="w-8 h-8 bg-purple-100">
                    <Grid3x3 className="w-4 h-4 text-purple-600" />
                  </Button>
                </div>
              </div>

              {/* Custom Tags Filter */}
              {customTags.length > 0 && (
                <div className="flex items-center gap-2 mb-6 flex-wrap">
                  <span className="text-sm text-gray-600">Filter by tag:</span>
                  <Button
                    variant={filterByTag === null ? "default" : "outline"}
                    size="sm"
                    className={filterByTag === null ? "rounded-full bg-purple-600 hover:bg-purple-700" : "rounded-full"}
                    onClick={() => setFilterByTag(null)}
                  >
                    All
                  </Button>
                  {customTags.map((tag) => (
                    <div key={tag.id} className="relative group">
                      <Button
                        variant={filterByTag === tag.id ? "default" : "outline"}
                        size="sm"
                        className={filterByTag === tag.id ? "rounded-full bg-purple-600 hover:bg-purple-700 pr-8" : "rounded-full pr-8"}
                        onClick={() => setFilterByTag(tag.id)}
                      >
                        {tag.name}
                      </Button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTag(tag.id);
                        }}
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Member Cards Grid */}
              <div className="grid grid-cols-2 gap-4">
                {filteredMembers.slice(0, 4).map((member) => (
                  <Card key={member.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="bg-gray-200 text-gray-700">
                          {member.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm mb-0.5">{member.name}</h3>
                        <p className="text-xs text-gray-600 truncate">{member.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">
                            {member.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {member.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-3 flex-wrap">
                        {member.tags.map((tag, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="rounded-full bg-purple-50 text-purple-700 border-purple-200 text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
              {members.length > 4 && (
                <div className="mt-4 text-center">
                  <Button variant="outline" size="sm">
                    View All {members.length} Members
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column - Feed Preview */}
          <div className="col-span-1">
            <Card className="bg-white sticky top-6">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">Community Feed</h2>
                <p className="text-sm text-gray-600 mt-1">Latest activity</p>
              </div>
              <div className="max-h-[calc(100vh-200px)] overflow-auto">
                <div className="divide-y">
                  {mockFeedPosts.map((post) => (
                    <div key={post.id} className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={post.avatar} />
                          <AvatarFallback className="bg-purple-200 text-purple-700 text-xs">
                            {post.author[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{post.author}</p>
                          <p className="text-xs text-gray-500">{post.time}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{post.content}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <button className="flex items-center gap-1 hover:text-purple-600 transition-colors">
                          <Heart className="w-4 h-4" />
                          {post.likes}
                        </button>
                        <button className="flex items-center gap-1 hover:text-purple-600 transition-colors">
                          <MessageSquare className="w-4 h-4" />
                          {post.comments}
                        </button>
                        <button className="flex items-center gap-1 hover:text-purple-600 transition-colors">
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                      {post.responses && post.responses.length > 0 && (
                        <div className="mt-3 ml-2 pl-3 border-l-2 border-purple-100 space-y-3">
                          {post.responses.map((response) => (
                            <div key={response.id} className="flex items-start gap-2">
                              <Avatar className="w-6 h-6 flex-shrink-0">
                                <AvatarImage src={response.avatar} />
                                <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                                  {response.author[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-xs">{response.author}</p>
                                  <span className="text-xs text-gray-400">•</span>
                                  <p className="text-xs text-gray-500">{response.time}</p>
                                </div>
                                <p className="text-xs text-gray-700 mt-0.5">{response.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 border-t">
                <Button variant="outline" size="sm" className="w-full text-purple-600">
                  View Full Feed →
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>    
    </div>
  );
}