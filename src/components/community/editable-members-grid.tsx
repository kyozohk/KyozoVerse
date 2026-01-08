'use client';

import { useState } from 'react';
import { Input, Checkbox, Button } from '@/components/ui';
import { Trash2 } from 'lucide-react';

export interface MemberGridRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  checked: boolean;
}

interface EditableMembersGridProps {
  members: MemberGridRow[];
  onMembersChange: (members: MemberGridRow[]) => void;
  onImport?: () => void;
  importButtonText?: string;
  loading?: boolean;
  showImportButton?: boolean;
}

export const EditableMembersGrid: React.FC<EditableMembersGridProps> = ({
  members,
  onMembersChange,
  onImport,
  importButtonText = 'Import Members',
  loading = false,
  showImportButton = true
}) => {
  const handleCheckboxChange = (id: string, checked: boolean) => {
    const updated = members.map(m => m.id === id ? { ...m, checked } : m);
    onMembersChange(updated);
  };

  const handleFieldChange = (id: string, field: keyof Omit<MemberGridRow, 'id' | 'checked'>, value: string) => {
    const updated = members.map(m => m.id === id ? { ...m, [field]: value } : m);
    onMembersChange(updated);
  };

  const handleRemove = (id: string) => {
    const updated = members.filter(m => m.id !== id);
    onMembersChange(updated);
  };

  const checkedCount = members.filter(m => m.checked).length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2 pr-2">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No members to display</p>
          ) : (
            members.map((member) => (
              <div key={member.id} className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                <Checkbox
                  checked={member.checked}
                  onCheckedChange={(checked) => handleCheckboxChange(member.id, checked as boolean)}
                  className="mt-2"
                />
                <div className="flex-1 grid grid-cols-4 gap-2">
                  <Input
                    value={member.firstName}
                    onChange={(e) => handleFieldChange(member.id, 'firstName', e.target.value)}
                    placeholder="First Name"
                    className="text-sm"
                  />
                  <Input
                    value={member.lastName}
                    onChange={(e) => handleFieldChange(member.id, 'lastName', e.target.value)}
                    placeholder="Last Name"
                    className="text-sm"
                  />
                  <Input
                    value={member.email}
                    onChange={(e) => handleFieldChange(member.id, 'email', e.target.value)}
                    placeholder="Email"
                    type="email"
                    className="text-sm"
                  />
                  <Input
                    value={member.phone}
                    onChange={(e) => handleFieldChange(member.id, 'phone', e.target.value)}
                    placeholder="Phone"
                    className="text-sm"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(member.id)}
                  className="mt-1 h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {showImportButton && members.length > 0 && (
        <div className="flex-shrink-0 pt-4 border-t mt-4">
          <Button
            type="button"
            onClick={onImport}
            className="w-full"
            style={{ backgroundColor: '#843484' }}
            disabled={loading || checkedCount === 0}
          >
            {loading ? 'Importing...' : `${importButtonText} (${checkedCount} selected)`}
          </Button>
        </div>
      )}
    </div>
  );
};
