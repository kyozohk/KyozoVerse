
'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { JsonTreeView } from './json-tree-view';


interface ExportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    data: any;
    onImport: () => void;
    isImporting: boolean;
}

export function ExportDialog({ isOpen, onClose, data, onImport, isImporting }: ExportDialogProps) {
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Export Community Data</DialogTitle>
                    <DialogDescription>
                        Review the JSON data that will be exported for this community.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto p-4 border rounded-md bg-muted/50">
                    {data ? (
                        <JsonTreeView data={data} />
                    ) : (
                        <p>No data to display.</p>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={onImport} disabled={isImporting}>
                        {isImporting ? 'Importing...' : 'Import to Firebase'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
