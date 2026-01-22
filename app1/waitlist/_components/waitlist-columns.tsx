'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Timestamp } from 'firebase/firestore';
import { ArrowUpDown, Mail, Phone, CheckCircle, XCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface WaitlistRequest {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  newsletter: boolean;
  whatsapp: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'registered';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  approvedAt?: Timestamp;
  rejectedAt?: Timestamp;
  registeredAt?: Timestamp;
}

const getStatusBadge = (status: WaitlistRequest['status']) => {
  const baseClasses = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium";
  switch (status) {
    case 'pending':
      return <span className={`${baseClasses} bg-warning/20 text-warning-foreground`}><AlertCircle className="w-3.5 h-3.5" />Pending</span>;
    case 'approved':
      return <span className={`${baseClasses} bg-info/20 text-info-foreground`}><CheckCircle className="w-3.5 h-3.5" />Approved</span>;
    case 'rejected':
      return <span className={`${baseClasses} bg-destructive/20 text-destructive-foreground`}><XCircle className="w-3.5 h-3.5" />Rejected</span>;
    case 'registered':
      return <span className={`${baseClasses} bg-success/20 text-success-foreground`}><CheckCircle className="w-3.5 h-3.5" />Registered</span>;
    default:
      return null;
  }
};

const formatDate = (timestamp?: Timestamp) => {
    if (!timestamp) return 'N/A';
    return timestamp.toDate().toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};
  
export const getColumns = (
    processingId: string | null,
    onApprove: (id: string) => void,
    onReject: (id: string) => void
): ColumnDef<WaitlistRequest>[] => [
    {
        accessorKey: 'user',
        header: 'User',
        cell: ({ row }) => {
            const { firstName, lastName } = row.original;
            const initial = `${firstName.charAt(0)}${lastName.charAt(0)}`;
            return (
                <div className="flex items-center gap-3">
                     <div className="flex-shrink-0 h-10 w-10 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                        <span className="text-sm font-medium text-foreground">{initial}</span>
                    </div>
                    <span className="font-medium text-foreground">{firstName} {lastName}</span>
                </div>
            );
        }
    },
    {
        accessorKey: 'email',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                Email
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex items-center gap-2 text-sm text-foreground/80">
                <Mail className="w-4 h-4 text-muted-foreground" />
                {row.original.email}
            </div>
        )
    },
    {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => (
            <div className="flex items-center gap-2 text-sm text-foreground/80">
                <Phone className="w-4 h-4 text-muted-foreground" />
                {row.original.phone || 'N/A'}
            </div>
        )
    },
    {
        accessorKey: 'status',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                Status
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => getStatusBadge(row.original.status)
    },
    {
        accessorKey: 'createdAt',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                Requested At
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex items-center gap-2 text-sm text-foreground/80">
                <Clock className="w-4 h-4 text-muted-foreground" />
                {formatDate(row.original.createdAt)}
            </div>
        )
    },
    {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
            const request = row.original;
            const isProcessing = processingId === request.id;

            if (request.status === 'pending') {
                return (
                    <div className="flex gap-2 justify-end">
                        <Button
                            onClick={() => onApprove(request.id)}
                            disabled={isProcessing}
                            variant="outline"
                            size="sm"
                            className="bg-success/10 border-success/30 text-success-foreground hover:bg-success/20"
                        >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Approve'}
                        </Button>
                        <Button
                            onClick={() => onReject(request.id)}
                            disabled={isProcessing}
                            variant="outline"
                            size="sm"
                            className="bg-destructive/10 border-destructive/30 text-destructive-foreground hover:bg-destructive/20"
                        >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reject'}
                        </Button>
                    </div>
                );
            } else if (request.status === 'approved') {
                return <span className="text-sm text-info-foreground/80 flex justify-end">Awaiting registration</span>;
            } else if (request.status === 'registered') {
                return <span className="text-sm text-success-foreground/80 flex justify-end">✓ Complete</span>;
            }
            return null;
        }
    }
];
