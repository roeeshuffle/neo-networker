import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, Calendar, User, Mail, Building, Phone } from "lucide-react";

interface PreviewItem {
  name?: string;
  title?: string;
  email?: string;
  company?: string;
  phone?: string;
  description?: string;
  start_datetime?: string;
  end_datetime?: string;
  location?: string;
  is_duplicate: boolean;
  existing_id?: string;
}

interface GoogleSyncPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'contacts' | 'calendar';
  previewData: PreviewItem[];
  onApprove: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function GoogleSyncPreviewDialog({
  isOpen,
  onClose,
  type,
  previewData,
  onApprove,
  onCancel,
  isLoading
}: GoogleSyncPreviewDialogProps) {
  const [showDuplicates, setShowDuplicates] = useState(false);
  
  const newItems = previewData.filter(item => !item.is_duplicate);
  const duplicateItems = previewData.filter(item => item.is_duplicate);
  
  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString();
  };

  const renderContactItem = (contact: PreviewItem, index: number) => (
    <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
      <div className="flex-shrink-0">
        {contact.is_duplicate ? (
          <XCircle className="h-5 w-5 text-orange-500" />
        ) : (
          <CheckCircle className="h-5 w-5 text-green-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{contact.name || 'Unknown'}</span>
          {contact.is_duplicate && (
            <Badge variant="secondary" className="text-xs">
              Duplicate
            </Badge>
          )}
        </div>
        <div className="mt-1 space-y-1">
          {contact.email && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span>{contact.email}</span>
            </div>
          )}
          {contact.company && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Building className="h-3 w-3" />
              <span>{contact.company}</span>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{contact.phone}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderEventItem = (event: PreviewItem, index: number) => (
    <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
      <div className="flex-shrink-0">
        {event.is_duplicate ? (
          <XCircle className="h-5 w-5 text-orange-500" />
        ) : (
          <CheckCircle className="h-5 w-5 text-green-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{event.title || 'Untitled Event'}</span>
          {event.is_duplicate && (
            <Badge variant="secondary" className="text-xs">
              Duplicate
            </Badge>
          )}
        </div>
        <div className="mt-1 space-y-1">
          {event.start_datetime && (
            <div className="text-sm text-muted-foreground">
              📅 {formatDateTime(event.start_datetime)}
              {event.end_datetime && ` - ${formatDateTime(event.end_datetime)}`}
            </div>
          )}
          {event.location && (
            <div className="text-sm text-muted-foreground">
              📍 {event.location}
            </div>
          )}
          {event.description && (
            <div className="text-sm text-muted-foreground">
              {event.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            Preview Google {type === 'contacts' ? 'Contacts' : 'Calendar Events'} Sync
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{newItems.length}</div>
              <div className="text-sm text-muted-foreground">New Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{duplicateItems.length}</div>
              <div className="text-sm text-muted-foreground">Duplicates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{previewData.length}</div>
              <div className="text-sm text-muted-foreground">Total Items</div>
            </div>
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center space-x-4">
            <Button
              variant={!showDuplicates ? "default" : "outline"}
              size="sm"
              onClick={() => setShowDuplicates(false)}
            >
              Show New Items ({newItems.length})
            </Button>
            <Button
              variant={showDuplicates ? "default" : "outline"}
              size="sm"
              onClick={() => setShowDuplicates(true)}
            >
              Show Duplicates ({duplicateItems.length})
            </Button>
          </div>

          <Separator />

          {/* Items List */}
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {(showDuplicates ? duplicateItems : newItems).map((item, index) => 
                type === 'contacts' ? renderContactItem(item, index) : renderEventItem(item, index)
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <div className="flex space-x-2">
            <Button 
              onClick={onApprove} 
              disabled={isLoading || newItems.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? 'Syncing...' : `Sync ${newItems.length} New Items`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
