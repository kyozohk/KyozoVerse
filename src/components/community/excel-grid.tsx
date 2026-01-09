
'use client';

import { useState, useRef, useEffect } from 'react';
import { Checkbox } from '@/components/ui';
import { Trash2 } from 'lucide-react';

export interface ExcelGridRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  checked: boolean;
}

interface ExcelGridProps {
  members: ExcelGridRow[];
  onMembersChange: (members: ExcelGridRow[]) => void;
  minRows?: number;
}

export const ExcelGrid: React.FC<ExcelGridProps> = ({
  members,
  onMembersChange,
  minRows = 3
}) => {
  const [focusedCell, setFocusedCell] = useState<{ rowId: string; field: string } | null>(null);

  const allChecked = members.length > 0 && members.every(m => m.checked);
  const someChecked = members.some(m => m.checked) && !allChecked;

  const handleSelectAll = (checked: boolean) => {
    const updated = members.map(m => ({ ...m, checked }));
    onMembersChange(updated);
  };

  // Ensure minimum rows
  useEffect(() => {
    if (members.length < minRows) {
      const rowsToAdd = minRows - members.length;
      const newRows = Array.from({ length: rowsToAdd }, (_, i) => ({
        id: `empty-${Date.now()}-${i}`,
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        checked: true
      }));
      onMembersChange([...members, ...newRows]);
    }
  }, [members, minRows, onMembersChange]);

  const handleCheckboxChange = (id: string, checked: boolean) => {
    const updated = members.map(m => m.id === id ? { ...m, checked } : m);
    onMembersChange(updated);
  };

  const handleCellChange = (id: string, field: keyof Omit<ExcelGridRow, 'id' | 'checked'>, value: string) => {
    const updated = members.map(m => m.id === id ? { ...m, [field]: value } : m);
    onMembersChange(updated);
  };

  const handleRemove = (id: string) => {
    const updated = members.filter(m => m.id !== id);
    // Ensure minimum rows after deletion
    if (updated.length < minRows) {
      const rowsToAdd = minRows - updated.length;
      const newRows = Array.from({ length: rowsToAdd }, (_, i) => ({
        id: `empty-${Date.now()}-${i}`,
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        checked: true
      }));
      onMembersChange([...updated, ...newRows]);
    } else {
      onMembersChange(updated);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowId: string, field: string, rowIndex: number) => {
    const fields = ['firstName', 'lastName', 'email', 'phone'];
    const currentFieldIndex = fields.indexOf(field);

    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        // Move left
        if (currentFieldIndex > 0) {
          setFocusedCell({ rowId, field: fields[currentFieldIndex - 1] });
        } else if (rowIndex > 0) {
          setFocusedCell({ rowId: members[rowIndex - 1].id, field: 'phone' });
        }
      } else {
        // Move right
        if (currentFieldIndex < fields.length - 1) {
          setFocusedCell({ rowId, field: fields[currentFieldIndex + 1] });
        } else if (rowIndex < members.length - 1) {
          setFocusedCell({ rowId: members[rowIndex + 1].id, field: 'firstName' });
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (rowIndex < members.length - 1) {
        setFocusedCell({ rowId: members[rowIndex + 1].id, field });
      }
    } else if (e.key === 'ArrowDown' && rowIndex < members.length - 1) {
      e.preventDefault();
      setFocusedCell({ rowId: members[rowIndex + 1].id, field });
    } else if (e.key === 'ArrowUp' && rowIndex > 0) {
      e.preventDefault();
      setFocusedCell({ rowId: members[rowIndex - 1].id, field });
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="grid grid-cols-[40px_1fr_1fr_1.5fr_1fr_40px] bg-muted/50 border-b font-medium text-sm text-black flex-shrink-0">
        <div className="p-2 border-r flex items-center justify-center">
          <Checkbox 
            checked={allChecked}
            onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
            className="data-[state=checked]:bg-[#843484] data-[state=checked]:border-[#843484]"
            aria-label="Select all"
          />
        </div>
        <div className="p-2 border-r">First Name</div>
        <div className="p-2 border-r">Last Name</div>
        <div className="p-2 border-r">Email</div>
        <div className="p-2 border-r">Phone</div>
        <div className="p-2"></div>
      </div>

      {/* Scrollable Body */}
      <div className="overflow-y-auto flex-grow">
        {members.map((member, rowIndex) => (
          <div
            key={member.id}
            className="grid grid-cols-[40px_1fr_1fr_1.5fr_1fr_40px] border-b last:border-b-0 hover:bg-muted/20 transition-colors"
          >
            {/* Checkbox */}
            <div className="p-2 border-r flex items-center justify-center bg-background">
              <Checkbox
                checked={member.checked}
                onCheckedChange={(checked) => handleCheckboxChange(member.id, checked as boolean)}
                className="data-[state=checked]:bg-[#843484] data-[state=checked]:border-[#843484]"
              />
            </div>

            {/* First Name */}
            <div className="border-r">
              <input
                type="text"
                value={member.firstName}
                onChange={(e) => handleCellChange(member.id, 'firstName', e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, member.id, 'firstName', rowIndex)}
                onFocus={() => setFocusedCell({ rowId: member.id, field: 'firstName' })}
                className="w-full h-full px-2 py-2 bg-transparent border-0 focus:outline-none focus:bg-muted/30 text-sm text-black"
                placeholder="First"
              />
            </div>

            {/* Last Name */}
            <div className="border-r">
              <input
                type="text"
                value={member.lastName}
                onChange={(e) => handleCellChange(member.id, 'lastName', e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, member.id, 'lastName', rowIndex)}
                onFocus={() => setFocusedCell({ rowId: member.id, field: 'lastName' })}
                className="w-full h-full px-2 py-2 bg-transparent border-0 focus:outline-none focus:bg-muted/30 text-sm text-black"
                placeholder="Last"
              />
            </div>

            {/* Email */}
            <div className="border-r">
              <input
                type="email"
                value={member.email}
                onChange={(e) => handleCellChange(member.id, 'email', e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, member.id, 'email', rowIndex)}
                onFocus={() => setFocusedCell({ rowId: member.id, field: 'email' })}
                className="w-full h-full px-2 py-2 bg-transparent border-0 focus:outline-none focus:bg-muted/30 text-sm text-black"
                placeholder="email@example.com"
              />
            </div>

            {/* Phone */}
            <div className="border-r">
              <input
                type="text"
                value={member.phone}
                onChange={(e) => handleCellChange(member.id, 'phone', e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, member.id, 'phone', rowIndex)}
                onFocus={() => setFocusedCell({ rowId: member.id, field: 'phone' })}
                className="w-full h-full px-2 py-2 bg-transparent border-0 focus:outline-none focus:bg-muted/30 text-sm text-black"
                placeholder="Phone"
              />
            </div>

            {/* Delete */}
            <div className="p-2 flex items-center justify-center bg-background">
              <button
                type="button"
                onClick={() => handleRemove(member.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
