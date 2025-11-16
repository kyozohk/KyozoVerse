

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
    <div className="bg-card text-foreground p-6 md:p-8 rounded-xl border border-gray-200/80">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Members</h2>
          <p className="text-muted-foreground">Manage your community members.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 bg-card border-primary-purple text-foreground focus:ring-primary-purple"
            />
          </div>
          <div className="flex items-center gap-1 rounded-md bg-gray-800 p-1">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
              className="h-8 w-8 text-white hover:bg-gray-700"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="h-8 w-8 text-white hover:bg-gray-700"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center text-muted-foreground py-10">Loading members...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-muted/50 border-b border-gray-200/80">
              <TableHead className="text-muted-foreground">User</TableHead>
              <TableHead className="text-muted-foreground">Email</TableHead>
              <TableHead className="text-muted-foreground">Phone</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Joined</TableHead>
              {canManage && <TableHead className="text-right text-muted-foreground">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.map((member) => (
              <TableRow key={member.userId} className="hover:bg-muted/50 border-gray-200/80">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.userDetails?.avatarUrl} />
                      <AvatarFallback>
                        {member.userDetails?.displayName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-foreground">
                        {member.userDetails?.displayName}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {member.role}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{member.userDetails?.email}</TableCell>
                <TableCell className="text-muted-foreground">{member.userDetails?.phoneNumber || '-'}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      member.status === 'active' ? 'default' : 'destructive'
                    }
                     className={
                      member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }
                  >
                    {member.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {member.joinedAt ? format(member.joinedAt.toDate(), 'PP') : '-'}
                </TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Phone className="h-4 w-4" />
                      </Button>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
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
