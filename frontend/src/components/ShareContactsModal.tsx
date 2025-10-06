import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Share2, Users } from 'lucide-react';
import { apiClient } from '@/integrations/api/client';

interface GroupUser {
  id: string;
  email: string;
  full_name?: string;
  added_at: string;
  status?: string;
}

interface ShareContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShareComplete: () => void;
}

const ShareContactsModal: React.FC<ShareContactsModalProps> = ({
  isOpen,
  onClose,
  onShareComplete
}) => {
  const [groupUsers, setGroupUsers] = useState<GroupUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const { toast } = useToast();

  // Load group users when modal opens
  useEffect(() => {
    if (isOpen) {
      loadGroupUsers();
    }
  }, [isOpen]);

  const loadGroupUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getGroupUsers();
      
      if (response.success) {
        setGroupUsers(response.data || []);
      } else {
        throw new Error(response.message || 'Failed to load group users');
      }
    } catch (error: any) {
      console.error('Error loading group users:', error);
      toast({
        title: "Error",
        description: "Failed to load group members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === groupUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(groupUsers.map(user => user.id));
    }
  };

  const handleShare = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user to share contacts with",
        variant: "destructive",
      });
      return;
    }

    try {
      setSharing(true);
      const response = await apiClient.shareContacts(selectedUsers);
      
      if (response.success) {
        toast({
          title: "Contacts shared successfully",
          description: `Shared contacts with ${selectedUsers.length} user(s)`,
        });
        onShareComplete();
        onClose();
      } else {
        throw new Error(response.message || 'Failed to share contacts');
      }
    } catch (error: any) {
      console.error('Error sharing contacts:', error);
      toast({
        title: "Share failed",
        description: error.message || "Failed to share contacts",
        variant: "destructive",
      });
    } finally {
      setSharing(false);
    }
  };

  const handleClose = () => {
    setSelectedUsers([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Contacts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select group members to share all your contacts with. The source field will be updated to show who shared the contact.
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : groupUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No group members found</p>
              <p className="text-sm text-muted-foreground">Add users to your group first</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedUsers.length === groupUsers.length}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all" className="font-medium">
                  Select All ({groupUsers.length} members)
                </Label>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {groupUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={user.id}
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => handleUserToggle(user.id)}
                    />
                    <Label htmlFor={user.id} className="flex-1">
                      <div className="font-medium">{user.full_name || user.email}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={sharing}>
            Cancel
          </Button>
          <Button 
            onClick={handleShare} 
            disabled={sharing || selectedUsers.length === 0}
          >
            {sharing ? 'Sharing...' : `Share with ${selectedUsers.length} user(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareContactsModal;
