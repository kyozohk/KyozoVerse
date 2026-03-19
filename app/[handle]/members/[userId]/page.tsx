'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  collection, query, where, getDocs, doc, getDoc
} from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Community } from '@/lib/types';
import { Banner } from '@/components/ui/banner';
import { PageLoadingSkeleton } from '@/components/community/page-loading-skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Globe, Lock, Mail, Phone, Calendar, Tag,
  MessageSquare, Users, UserCheck, Hash, ShieldCheck,
  Download, UserPlus, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MemberProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  imageUrl: string;
  role: string;
  joinedAt: any;
  tags: string[];
  status: string;
  source?: string;
  wa_id?: string;
}

interface MemberStats {
  messagesSent: number;
  messagesReceived: number;
  communitiesCount: number;
  tagsCount: number;
  postsCount: number;
  acquisitionMethod: string;
}

export default function MemberProfilePage() {
  const params = useParams();
  const router = useRouter();
  const handle = params.handle as string;
  const userId = params.userId as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [allCommunities, setAllCommunities] = useState<{ name: string; handle: string; role: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch community
        const cq = query(collection(db, 'communities'), where('handle', '==', handle));
        const cSnap = await getDocs(cq);
        if (cSnap.empty) { setIsLoading(false); return; }
        const communityData = { communityId: cSnap.docs[0].id, ...cSnap.docs[0].data() } as Community;
        setCommunity(communityData);

        // 2. Fetch the communityMember doc for this user in this community
        const mq = query(
          collection(db, 'communityMembers'),
          where('communityId', '==', communityData.communityId),
          where('userId', '==', userId)
        );
        const mSnap = await getDocs(mq);
        if (mSnap.empty) { setIsLoading(false); return; }

        const mDoc = mSnap.docs[0];
        const mData = mDoc.data();
        const ud = mData.userDetails || {};

        // 3. Fetch user doc for extra details (phone, source, etc.)
        let userDoc: any = {};
        try {
          const uSnap = await getDoc(doc(db, 'users', userId));
          if (uSnap.exists()) userDoc = uSnap.data();
        } catch (_) {}

        const memberProfile: MemberProfile = {
          id: mDoc.id,
          userId,
          name: ud.displayName || userDoc.displayName || userDoc.email || 'Unknown',
          email: ud.email || userDoc.email || '',
          phone: ud.phone || userDoc.phone || userDoc.phoneNumber || '',
          imageUrl: ud.avatarUrl || userDoc.avatarUrl || userDoc.photoURL || '/placeholder-avatar.png',
          role: mData.role || 'member',
          joinedAt: mData.joinedAt,
          tags: mData.tags || [],
          status: mData.status || 'active',
          source: mData.source || userDoc.source || userDoc.createdVia || null,
          wa_id: userDoc.wa_id || '',
        };
        setMember(memberProfile);

        // 4. Count communities this user belongs to
        const allMemberDocs = await getDocs(
          query(collection(db, 'communityMembers'), where('userId', '==', userId))
        );

        const communityIds = allMemberDocs.docs.map(d => d.data().communityId);

        // Fetch community names for each
        const communityDetails: { name: string; handle: string; role: string }[] = [];
        await Promise.all(
          allMemberDocs.docs.map(async (d) => {
            const cId = d.data().communityId;
            const cRole = d.data().role || 'member';
            try {
              const cRef = await getDoc(doc(db, 'communities', cId));
              if (cRef.exists()) {
                const cd = cRef.data() as any;
                communityDetails.push({ name: cd.name || cId, handle: cd.handle || cId, role: cRole });
              }
            } catch (_) {}
          })
        );
        setAllCommunities(communityDetails);

        // 5. Count posts/messages in this community
        let messagesSent = 0;
        let postsCount = 0;
        try {
          const postsSnap = await getDocs(
            query(collection(db, 'blogs'),
              where('communityId', '==', communityData.communityId),
              where('authorId', '==', userId))
          );
          postsCount = postsSnap.size;
          messagesSent = postsSnap.size;
        } catch (_) {}

        // 6. Determine acquisition method
        let acquisitionMethod = 'Unknown';
        if (mData.source === 'import' || userDoc.source === 'import' || mData.importedAt) {
          acquisitionMethod = 'Imported';
        } else if (userDoc.source === 'invite' || mData.inviteCode) {
          acquisitionMethod = 'Invite Link';
        } else if (userDoc.createdVia === 'manual' || mData.addedManually) {
          acquisitionMethod = 'Manual Add';
        } else if (userDoc.emailVerified || userDoc.createdAt) {
          acquisitionMethod = 'Sign Up';
        } else {
          acquisitionMethod = 'Sign Up';
        }

        setStats({
          messagesSent,
          messagesReceived: 0,
          communitiesCount: communityIds.length,
          tagsCount: memberProfile.tags.length,
          postsCount,
          acquisitionMethod,
        });
      } catch (err) {
        console.error('Error fetching member profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
  }, [handle, userId]);

  const formatDate = (ts: any) => {
    if (!ts) return 'Unknown';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'owner': return { backgroundColor: '#FFF3CD', color: '#856404' };
      case 'admin': return { backgroundColor: '#D1ECF1', color: '#0C5460' };
      default: return { backgroundColor: '#E8DFD1', color: '#5B4A3A' };
    }
  };

  const getAcquisitionIcon = (method: string) => {
    switch (method) {
      case 'Imported': return <Download className="h-4 w-4" />;
      case 'Invite Link': return <UserCheck className="h-4 w-4" />;
      case 'Manual Add': return <UserPlus className="h-4 w-4" />;
      default: return <UserPlus className="h-4 w-4" />;
    }
  };

  if (isLoading) return <PageLoadingSkeleton showMemberList={false} />;

  if (!community || !member) {
    return (
      <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--page-bg-color)' }}>
        <div className="p-8">
          <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: 'var(--page-content-bg)', border: '2px solid var(--page-content-border)' }}>
            <p className="text-muted-foreground">Member not found.</p>
            <Button variant="outline" className="mt-4" onClick={() => router.back()}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--page-bg-color)' }}>
      <div className="p-8 flex-1 overflow-auto">
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--page-content-bg)', border: '2px solid var(--page-content-border)' }}>
          {/* Community Banner */}
          <Banner
            backgroundImage={community.communityBackgroundImage}
            iconImage={community.communityProfileImage}
            title={community.name}
            location={(community as any).location}
            locationExtra={
              <span className="flex items-center gap-1 text-sm text-white/90">
                {(community as any).visibility === 'private'
                  ? <><Lock className="h-3.5 w-3.5" /> Private</>
                  : <><Globe className="h-3.5 w-3.5" /> Public</>}
              </span>
            }
            subtitle={community.tagline || (community as any).mantras}
            tags={(community as any).tags || []}
            leftCta={{
              label: 'Back to Audience',
              icon: <ArrowLeft className="h-4 w-4" />,
              onClick: () => router.push(`/${handle}/audience`),
            }}
            height="16rem"
          />

          <div className="p-6 space-y-6">
            {/* Member header card */}
            <div className="flex flex-col sm:flex-row items-start gap-6 p-6 rounded-xl" style={{ backgroundColor: 'var(--page-bg-color)', border: '1px solid var(--page-content-border)' }}>
              <Avatar className="h-20 w-20 border-4 flex-shrink-0" style={{ borderColor: 'var(--page-content-border)' }}>
                <AvatarImage src={member.imageUrl} alt={member.name} />
                <AvatarFallback style={{ backgroundColor: '#E8DFD1', color: '#5B4A3A', fontSize: '1.5rem' }}>
                  {member.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold" style={{ color: '#3D2E1E' }}>{member.name}</h1>
                  <Badge style={getRoleBadgeStyle(member.role)} className="capitalize text-xs px-2 py-0.5 rounded-full border-0">
                    {member.role}
                  </Badge>
                  {member.status !== 'active' && (
                    <Badge variant="destructive" className="text-xs capitalize">{member.status}</Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm mt-2" style={{ color: '#7A6652' }}>
                  {member.email && (
                    <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{member.email}</span>
                  )}
                  {member.phone && (
                    <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{member.phone}</span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />Joined {formatDate(member.joinedAt)}
                  </span>
                </div>
                {member.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {member.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: '#E8DFD1', color: '#5B4A3A' }}>
                        <Tag className="h-3 w-3" />{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Stats Matrix */}
            {stats && (
              <div>
                <h2 className="text-lg font-semibold mb-4" style={{ color: '#3D2E1E' }}>Activity & Stats</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <StatCard
                    icon={<MessageSquare className="h-5 w-5" />}
                    label="Posts Sent"
                    value={stats.messagesSent}
                    color="#E07B39"
                    bg="#FFF3E8"
                  />
                  <StatCard
                    icon={<Hash className="h-5 w-5" />}
                    label="Messages Rcvd"
                    value={stats.messagesReceived}
                    color="#4B7BF5"
                    bg="#EEF4FF"
                  />
                  <StatCard
                    icon={<Users className="h-5 w-5" />}
                    label="Communities"
                    value={stats.communitiesCount}
                    color="#7C3AED"
                    bg="#F5F3FF"
                  />
                  <StatCard
                    icon={<Tag className="h-5 w-5" />}
                    label="Tags Applied"
                    value={stats.tagsCount}
                    color="#059669"
                    bg="#ECFDF5"
                  />
                  <StatCard
                    icon={<Clock className="h-5 w-5" />}
                    label="Days as Member"
                    value={member.joinedAt ? Math.floor((Date.now() - (member.joinedAt.toDate ? member.joinedAt.toDate() : new Date(member.joinedAt)).getTime()) / 86400000) : '—'}
                    color="#D97706"
                    bg="#FFFBEB"
                  />
                  <div className="rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2" style={{ backgroundColor: '#F5F0EB', border: '1px solid #E8DFD1' }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8DFD1', color: '#5B4A3A' }}>
                      {getAcquisitionIcon(stats.acquisitionMethod)}
                    </div>
                    <p className="text-xs font-medium" style={{ color: '#8B7355' }}>Acquired Via</p>
                    <p className="text-sm font-bold" style={{ color: '#3D2E1E' }}>{stats.acquisitionMethod}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Other Communities */}
            {allCommunities.length > 1 && (
              <div>
                <h2 className="text-lg font-semibold mb-4" style={{ color: '#3D2E1E' }}>
                  Member of {allCommunities.length} Communities
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {allCommunities.map((c) => (
                    <div
                      key={c.handle}
                      className="flex items-center gap-3 p-3 rounded-lg"
                      style={{ backgroundColor: 'var(--page-bg-color)', border: '1px solid var(--page-content-border)' }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#E8DFD1', color: '#5B4A3A' }}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: '#3D2E1E' }}>{c.name}</p>
                        <p className="text-xs truncate" style={{ color: '#8B7355' }}>@{c.handle}</p>
                      </div>
                      <Badge style={getRoleBadgeStyle(c.role)} className="capitalize text-xs border-0 flex-shrink-0">
                        {c.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Member ID - Hidden in production, visible only in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--page-bg-color)', border: '1px solid var(--page-content-border)' }}>
                <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#8B7355' }}>Identifiers (Dev Only)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm font-mono">
                  <div className="flex items-center gap-2">
                    <span style={{ color: '#8B7355' }}>User ID:</span>
                    <span className="truncate" style={{ color: '#5B4A3A' }}>{member.userId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ color: '#8B7355' }}>Member Doc:</span>
                    <span className="truncate" style={{ color: '#5B4A3A' }}>{member.id}</span>
                  </div>
                  {member.wa_id && (
                    <div className="flex items-center gap-2">
                      <span style={{ color: '#8B7355' }}>WhatsApp ID:</span>
                      <span className="truncate" style={{ color: '#5B4A3A' }}>{member.wa_id}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, bg }: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2" style={{ backgroundColor: bg, border: '1px solid var(--page-content-border)' }}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}20`, color }}>
        {icon}
      </div>
      <p className="text-xs font-medium" style={{ color: '#8B7355' }}>{label}</p>
      <p className="text-xl font-bold" style={{ color: '#3D2E1E' }}>{value}</p>
    </div>
  );
}
