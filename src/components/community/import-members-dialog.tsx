'use client';

import { useState, useEffect } from 'react';
import { CustomFormDialog, Input, Button, Tabs, TabsContent, TabsList, TabsTrigger, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { Upload, FileSpreadsheet, Users, Trash2, Plus } from 'lucide-react';
import { ExcelGrid, type ExcelGridRow } from './excel-grid';
import { type Community } from '@/lib/types';
import { addDoc, collection, serverTimestamp, increment, updateDoc, doc, query, where, getDocs, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { communityAuth } from '@/firebase/community-auth';
import { useToast } from '@/hooks/use-toast';

interface ImportMembersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  community: Community;
  onSuccess: () => void;
}

interface MemberRow {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export const ImportMembersDialog: React.FC<ImportMembersDialogProps> = ({
  isOpen,
  onClose,
  community,
  onSuccess
}) => {
  console.log('ImportMembersDialog rendered, isOpen:', isOpen);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'eventbrite' | 'csv' | 'manual'>('eventbrite');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Eventbrite state
  const [eventbritePrivateToken, setEventbritePrivateToken] = useState('');
  const [eventbriteEvents, setEventbriteEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [eventbriteAttendees, setEventbriteAttendees] = useState<ExcelGridRow[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  // CSV state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvMembers, setCsvMembers] = useState<ExcelGridRow[]>([]);

  // Manual state
  const [manualMembers, setManualMembers] = useState<ExcelGridRow[]>([]);

  const fetchEventbriteEvents = async () => {
    if (!eventbritePrivateToken) {
      setError('Please enter your Eventbrite Private Token');
      return;
    }

    setLoadingEvents(true);
    setError(null);

    try {
      const response = await fetch('/api/eventbrite/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: eventbritePrivateToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      setEventbriteEvents(data.events || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch Eventbrite events');
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchEventbriteAttendees = async () => {
    if (!selectedEventId || !eventbritePrivateToken) return;

    setLoadingAttendees(true);
    setError(null);

    try {
      const response = await fetch('/api/eventbrite/attendees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: eventbritePrivateToken, eventId: selectedEventId }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch attendees');
      }

      const data = await response.json();
      const attendees = data.attendees?.map((attendee: any, index: number) => ({
        id: `eb-${attendee.id || index}`,
        firstName: attendee.profile?.first_name || '',
        lastName: attendee.profile?.last_name || '',
        email: attendee.profile?.email || '',
        phone: attendee.profile?.cell_phone || '',
        checked: true,
      })) || [];

      setEventbriteAttendees(attendees);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch Eventbrite attendees');
    } finally {
      setLoadingAttendees(false);
    }
  };

  useEffect(() => {
    if (selectedEventId && eventbritePrivateToken) {
      fetchEventbriteAttendees();
    }
  }, [selectedEventId]);

  const handleCsvChange = (file: File | null) => {
    if (!file) {
      setCsvFile(null);
      setCsvMembers([]);
      return;
    }

    setCsvFile(file);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      // Skip header row if it exists
      const startIndex = lines[0].toLowerCase().includes('first') || lines[0].toLowerCase().includes('email') ? 1 : 0;
      
      const members: ExcelGridRow[] = lines.slice(startIndex).map((line, index) => {
        const [firstName = '', lastName = '', email = '', phone = ''] = line.split(',').map(s => s.trim());
        return { id: `csv-${index}`, firstName, lastName, email, phone, checked: true };
      }).filter(m => m.email); // Only include rows with email

      setCsvMembers(members);
    };

    reader.readAsText(file);
  };

  const addManualRow = () => {
    const newId = `manual-${Date.now()}`;
    setManualMembers([...manualMembers, { id: newId, firstName: '', lastName: '', email: '', phone: '', checked: true }]);
  };

  const removeManualRow = (index: number) => {
    setManualMembers(manualMembers.filter((_, i) => i !== index));
  };

  const updateManualRow = (id: string, field: keyof Omit<ExcelGridRow, 'id' | 'checked'>, value: string) => {
    const updated = manualMembers.map(m => m.id === id ? { ...m, [field]: value } : m);
    setManualMembers(updated);
  };

  const importMembers = async (members: ExcelGridRow[]) => {
    if (!community?.communityId) {
      throw new Error('Community not found');
    }

    const validMembers = members.filter(m => m.checked && m.email && m.email.includes('@'));
    
    if (validMembers.length === 0) {
      throw new Error('No valid members to import');
    }

    setLoading(true);
    setError(null);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const member of validMembers) {
        try {
          const usersRef = collection(db, 'users');
          let userId: string;
          
          // Normalize phone number
          let normalizedPhone = member.phone?.trim().replace(/\s+/g, '') || '';
          if (normalizedPhone && !normalizedPhone.startsWith('+')) {
            normalizedPhone = '+' + normalizedPhone;
          }
          const wa_id = normalizedPhone.replace(/\+/g, '').replace(/\s+/g, '');

          // Check if user exists
          const emailQuery = query(usersRef, where('email', '==', member.email));
          const emailSnap = await getDocs(emailQuery);

          if (!emailSnap.empty) {
            // User exists
            userId = emailSnap.docs[0].id;
            const userDetails = emailSnap.docs[0].data();
            
            // Update phone if needed
            if (normalizedPhone && userDetails.phone !== normalizedPhone) {
              await updateDoc(doc(db, 'users', userId), {
                phone: normalizedPhone,
                phoneNumber: normalizedPhone,
                wa_id: wa_id,
              });
            }
          } else {
            // Create new user
            const tempPassword = Math.random().toString(36).slice(-8);
            const userCredential = await createUserWithEmailAndPassword(communityAuth, member.email, tempPassword);
            userId = userCredential.user.uid;

            await setDoc(doc(db, 'users', userId), {
              userId: userId,
              displayName: `${member.firstName} ${member.lastName}`.trim(),
              email: member.email,
              phone: normalizedPhone,
              phoneNumber: normalizedPhone,
              wa_id: wa_id,
              createdAt: serverTimestamp(),
            });
          }

          // Add to community
          const membersRef = collection(db, 'communityMembers');
          await addDoc(membersRef, {
            userId,
            communityId: community.communityId,
            role: 'member',
            status: 'active',
            joinedAt: serverTimestamp(),
            userDetails: {
              displayName: `${member.firstName} ${member.lastName}`.trim(),
              email: member.email,
              avatarUrl: null,
              phone: normalizedPhone,
            },
          });

          successCount++;
        } catch (err) {
          console.error(`Error importing member ${member.email}:`, err);
          errorCount++;
        }
      }

      // Update community member count
      const communityRef = doc(db, 'communities', community.communityId);
      await updateDoc(communityRef, {
        memberCount: increment(successCount),
      });

      toast({
        title: 'Import Complete',
        description: `Successfully imported ${successCount} members${errorCount > 0 ? `. ${errorCount} failed.` : '.'}`,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to import members');
      toast({
        title: 'Import Failed',
        description: err.message || 'Failed to import members',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    const membersToImport = getMembersForGrid();

    if (membersToImport.length === 0) {
      setError('No members to import');
      return;
    }

    await importMembers(membersToImport);
  };

  const getMembersForGrid = () => {
    if (activeTab === 'eventbrite') return eventbriteAttendees;
    if (activeTab === 'csv') return csvMembers;
    if (activeTab === 'manual') return manualMembers;
    return [];
  };

  const handleMembersChange = (updated: ExcelGridRow[]) => {
    if (activeTab === 'eventbrite') setEventbriteAttendees(updated);
    else if (activeTab === 'csv') setCsvMembers(updated);
    else if (activeTab === 'manual') setManualMembers(updated);
  };

  const membersForGrid = getMembersForGrid();
  const checkedCount = membersForGrid.filter(m => m.checked && m.email).length;

  return (
    <CustomFormDialog
      open={isOpen}
      onClose={onClose}
      title="Import Members"
      description={`Import members to ${community.name}`}
      backgroundImage="/bg/light_app_bg.png"
      color="#843484"
    >
      <div className="flex flex-col h-full" style={{ maxWidth: '100vw', margin: '0 auto' }}>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3" style={{ height: '80px' }}>
          <TabsTrigger value="eventbrite" className="text-lg px-8 py-4">
            <Upload className="h-8 w-8 mr-3" />
            Eventbrite
          </TabsTrigger>
          <TabsTrigger value="csv" className="text-lg px-8 py-4">
            <FileSpreadsheet className="h-8 w-8 mr-3" />
            CSV
          </TabsTrigger>
          <TabsTrigger value="manual" className="text-lg px-8 py-4">
            <Users className="h-8 w-8 mr-3" />
            Manual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="eventbrite" className="space-y-4 mt-4">
          <div className="flex gap-2 items-start">
            <div className="flex-1">
              <Input
                type="password"
                value={eventbritePrivateToken}
                onChange={(e) => setEventbritePrivateToken(e.target.value)}
                label="Eventbrite Private Token"
                wrapperClassName="mb-0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Get your Private Token from Eventbrite Account Settings → API Keys
              </p>
            </div>
            <Button
              type="button"
              onClick={fetchEventbriteEvents}
              disabled={!eventbritePrivateToken || loadingEvents}
              className="mt-0"
              style={{ backgroundColor: '#843484', minWidth: '140px' }}
            >
              {loadingEvents ? 'Loading...' : 'Fetch'}
            </Button>
          </div>

          {eventbriteEvents.length > 0 && (
            <div>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger className="h-auto [&>span]:text-black">
                  <SelectValue placeholder="Select Event" />
                </SelectTrigger>
                <SelectContent>
                  {eventbriteEvents.map((event) => {
                    const attendeeCount = event.id === selectedEventId ? eventbriteAttendees.length : 0;
                    return (
                      <SelectItem 
                        key={event.id} 
                        value={event.id}
                        className="py-3 text-black cursor-pointer hover:bg-muted"
                      >
                        <div className="flex justify-between items-center w-full">
                          <span>{event.name.text}</span>
                          {attendeeCount > 0 && (
                            <span className="text-muted-foreground ml-4">({attendeeCount})</span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {loadingAttendees && <p className="text-sm text-muted-foreground">Loading attendees...</p>}

          {eventbriteAttendees.length > 0 && (
            <div className="mt-4">
              <ExcelGrid
                members={eventbriteAttendees}
                onMembersChange={setEventbriteAttendees}
                minRows={5}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="csv" className="space-y-4 mt-4">
          <div>
            <Label>Upload CSV File</Label>
            <div className="border-2 border-dashed rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer relative">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  handleCsvChange(file);
                }}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="flex items-center justify-center gap-2 cursor-pointer">
                <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {csvFile ? csvFile.name : 'Click to upload CSV file'}
                </span>
              </label>
              {csvFile && csvMembers.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setCsvFile(null);
                    setCsvMembers([]);
                  }}
                  className="absolute top-2 right-2 p-1 hover:bg-muted rounded-full transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              CSV format: firstName, lastName, email, phone (one member per line)
            </p>
          </div>

          {csvMembers.length > 0 && (
            <div className="mt-4">
              <ExcelGrid
                members={csvMembers}
                onMembersChange={setCsvMembers}
                minRows={5}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="manual" className="space-y-4 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={addManualRow}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </Button>
          <p className="text-xs text-muted-foreground mb-4">
            Add members manually and edit details in the grid below.
          </p>

          <div>
            <ExcelGrid
              members={manualMembers}
              onMembersChange={setManualMembers}
              minRows={5}
            />
          </div>
        </TabsContent>
      </Tabs>

          {error && (
            <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Footer with buttons */}
          <div className="flex gap-3 pt-6 mt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleImport}
              className="flex-1"
              style={{ backgroundColor: '#843484' }}
              disabled={loading || checkedCount === 0}
            >
              {loading ? 'Importing...' : `Import ${checkedCount} Member${checkedCount !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
    </CustomFormDialog>
  );
};
