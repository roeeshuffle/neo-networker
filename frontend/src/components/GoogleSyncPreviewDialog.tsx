import React, { useState, useMemo } from 'react';
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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, XCircle, Calendar, User, Mail, Building, Phone, Search } from "lucide-react";

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
  selected?: boolean;
}

interface GoogleSyncPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'contacts' | 'calendar';
  previewData: PreviewItem[];
  onApprove: (selectedIndices: number[], showDuplicates: boolean) => void;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [showDuplicates, setShowDuplicates] = useState(false);
  
  // Initialize all non-duplicate items as selected by default
  React.useEffect(() => {
    const newItems = previewData.filter(item => !item.is_duplicate);
    const defaultSelected = new Set(newItems.map((_, index) => index));
    setSelectedItems(defaultSelected);
  }, [previewData]);
  
  const newItems = previewData.filter(item => !item.is_duplicate);
  const duplicateItems = previewData.filter(item => item.is_duplicate);
  
  // Filter items based on search query
  const filteredItems = useMemo(() => {
    const itemsToFilter = showDuplicates ? duplicateItems : newItems;
    if (!searchQuery.trim()) return itemsToFilter;
    
    const query = searchQuery.toLowerCase();
    return itemsToFilter.filter(item => {
      const name = (item.name || item.title || '').toLowerCase();
      const email = (item.email || '').toLowerCase();
      const company = (item.company || '').toLowerCase();
      return name.includes(query) || email.includes(query) || company.includes(query);
    });
  }, [newItems, duplicateItems, showDuplicates, searchQuery]);
  
  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIndices = new Set(filteredItems.map((_, index) => index));
      setSelectedItems(allIndices);
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (index: number, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(index);
    } else {
      newSelected.delete(index);
    }
    setSelectedItems(newSelected);
  };

  const isAllSelected = filteredItems.length > 0 && filteredItems.every((_, index) => selectedItems.has(index));
  const isIndeterminate = selectedItems.size > 0 && selectedItems.size < filteredItems.length;

  const renderContactItem = (contact: PreviewItem, index: number) => (
    <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
      <div className="flex-shrink-0 pt-1">
        <Checkbox
          checked={selectedItems.has(index)}
          onCheckedChange={(checked) => handleSelectItem(index, checked as boolean)}
        />
      </div>
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
      <div className="flex-shrink-0 pt-1">
        <Checkbox
          checked={selectedItems.has(index)}
          onCheckedChange={(checked) => handleSelectItem(index, checked as boolean)}
        />
      </div>
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

  const selectedCount = selectedItems.size;
  const totalFiltered = filteredItems.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            Preview Google {type === 'contacts' ? 'Contacts' : 'Calendar Events'} Sync
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
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
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{selectedCount}</div>
              <div className="text-sm text-muted-foreground">Selected</div>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${type === 'contacts' ? 'contacts' : 'events'} by name, email, or company...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={!showDuplicates ? "default" : "outline"}
              size="sm"
              onClick={() => setShowDuplicates(false)}
            >
              New Items ({newItems.length})
            </Button>
            <Button
              variant={showDuplicates ? "default" : "outline"}
              size="sm"
              onClick={() => setShowDuplicates(true)}
            >
              Duplicates ({duplicateItems.length})
            </Button>
          </div>

          {/* Select All Controls */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={isAllSelected}
                ref={(el) => {
                  if (el) el.indeterminate = isIndeterminate;
                }}
                onCheckedChange={handleSelectAll}
              />
              <span className="font-medium">
                Select All ({totalFiltered} {showDuplicates ? 'duplicates' : 'new items'})
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedCount} of {totalFiltered} selected
            </div>
          </div>

          <Separator />

          {/* Items List */}
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {filteredItems.map((item, index) => 
                type === 'contacts' ? renderContactItem(item, index) : renderEventItem(item, index)
              )}
              {filteredItems.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No items match your search' : 'No items to display'}
                </div>
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
              onClick={() => onApprove(Array.from(selectedItems), showDuplicates)} 
              disabled={isLoading || selectedCount === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? 'Syncing...' : `Sync ${selectedCount} Selected Items`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
