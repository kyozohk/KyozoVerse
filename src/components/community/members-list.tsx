
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search,
  List,
  LayoutGrid,
  Edit,
  MessageCircle,
  Phone,
  Mail,
  Trash2,
} from 'lucide-react';
import { Community, CommunityMember, UserRole } from '@/lib/types';
import { format } from 'date-fns';

interface MembersListProps {
  community: Community;
  userRole: UserRole;
}

export function MembersList({ community, userRole }: MembersListProps) {
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const canManage = userRole === 'owner' || userRole === 'admin';

  useEffect(() => {
    if (!community.communityId) return;

    const membersRef = collection(db, 'communityMembers');
    const q = query(
      membersRef,
      where('communityId', '==', community.communityId),
      orderBy('joinedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const membersData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as CommunityMember)
        );
        setMembers(membersData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching members:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [community.communityId]);

  const filteredMembers = members.filter(
    (member) =>
      member.userDetails?.displayName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      member.userDetails?.email
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-transparent text-white p-6 md:p-8 rounded-xl">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-400">Members</h2>
          <p className="text-gray-500">Manage your community members.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 bg-transparent border-primary-purple text-white focus:ring-primary-purple"
            />
          </div>
          <div className="flex items-center gap-1 rounded-md bg-gray-800 p-1">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
              className="h-8 w-8 hover:bg-gray-700"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="h-8 w-8 hover:bg-gray-700"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center text-gray-400 py-10">Loading members...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-gray-700/80">
              <TableHead className="text-gray-500">User</TableHead>
              <TableHead className="text-gray-500">Email</TableHead>
              <TableHead className="text-gray-500">Phone</TableHead>
              <TableHead className="text-gray-500">Status</TableHead>
              <TableHead className="text-gray-500">Joined</TableHead>
              {canManage && <TableHead className="text-right text-gray-500">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.map((member) => (
              <TableRow key={member.userId} className="hover:bg-gray-800/50 border-gray-800/80">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.userDetails?.avatarUrl} />
                      <AvatarFallback>
                        {member.userDetails?.displayName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-gray-300">
                        {member.userDetails?.displayName}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {member.role}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-gray-400">{member.userDetails?.email}</TableCell>
                <TableCell className="text-gray-400">{member.userDetails?.phoneNumber || '-'}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      member.status === 'active' ? 'default' : 'destructive'
                    }
                     className={
                      member.status === 'active' ? 'bg-green-600/20 text-green-400 border-green-500/30' : 'bg-red-600/20 text-red-400 border-red-500/30'
                    }
                  >
                    {member.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-400">
                  {member.joinedAt ? format(member.joinedAt.toDate(), 'PP') : '-'}
                </TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-300">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-300">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-300">
                        <Phone className="h-4 w-4" />
                      </Button>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-300">
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
