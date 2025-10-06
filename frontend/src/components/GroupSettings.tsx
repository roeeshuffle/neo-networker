import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/integrations/api/client';

interface GroupUser {
  id: string;
  email: string;
  full_name?: string;
  added_at: string;
  status?: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  name: string;
  requested_at: string;
  status: string;
}

export const GroupSettings: React.FC = () => {
  const [groupUsers, setGroupUsers] = useState<GroupUser[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  // Load group users and pending invitations on component mount
  useEffect(() => {
    loadGroupUsers();
    loadPendingInvitations();
  }, []);

  const loadGroupUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await apiClient.getUserGroup();
      if (error) throw error;
      
      // Ensure data is an array
      const users = Array.isArray(data) ? data : (data?.data || []);
      console.log('🔍 GROUP USERS DEBUG: Raw data:', data);
      console.log('🔍 GROUP USERS DEBUG: Processed users:', users);
      console.log('🔍 GROUP USERS DEBUG: First user structure:', users[0]);
      setGroupUsers(users);
    } catch (error) {
      console.error('Error loading group users:', error);
      setGroupUsers([]); // Ensure it's always an array
      toast({
        title: "Error",
        description: "Failed to load group users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingInvitations = async () => {
    try {
      const { data, error } = await apiClient.getPendingInvitations();
      if (error) throw error;
      
      const invitations = Array.isArray(data) ? data : (data?.data || []);
      console.log('🔍 PENDING INVITATIONS DEBUG: Raw data:', data);
      console.log('🔍 PENDING INVITATIONS DEBUG: Processed invitations:', invitations);
      setPendingInvitations(invitations);
    } catch (error) {
      console.error('Error loading pending invitations:', error);
      setPendingInvitations([]);
    }
  };

  const addUserToGroup = async () => {
    if (!newUserEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    if (!newUserName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAdding(true);
      const { data, error } = await apiClient.addUserToGroup(newUserEmail.trim(), newUserName.trim());
      if (error) throw error;
      
      // Reload the group users and pending invitations
      await loadGroupUsers();
      await loadPendingInvitations();
      setNewUserEmail('');
      setNewUserName('');
      
      toast({
        title: "Success",
        description: data.message || "User added to your group",
      });
    } catch (error: any) {
      console.error('Error adding user to group:', error);
      const errorMessage = error.message || "Failed to add user to group";
      
      // Show different message for service unavailable
      if (errorMessage.includes('not available yet')) {
        toast({
          title: "Feature Coming Soon",
          description: "Group management is being set up. Please try again later.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsAdding(false);
    }
  };

  const removeUserFromGroup = async (userId: string) => {
    try {
      const { error } = await apiClient.removeUserFromGroup(userId);
      if (error) throw error;
      
      setGroupUsers(prev => prev.filter(user => user.id !== userId));
      
      toast({
        title: "Success",
        description: "User removed from your group",
      });
    } catch (error) {
      console.error('Error removing user from group:', error);
      toast({
        title: "Error",
        description: "Failed to remove user from group",
        variant: "destructive",
      });
    }
  };

  const approveInvitation = async (invitationId: string, displayName: string) => {
    try {
      const { error } = await apiClient.approveInvitation(invitationId, displayName);
      if (error) throw error;
      
      // Reload both lists
      await loadGroupUsers();
      await loadPendingInvitations();
      
      toast({
        title: "Success",
        description: "Invitation approved successfully",
      });
    } catch (error) {
      console.error('Error approving invitation:', error);
      toast({
        title: "Error",
        description: "Failed to approve invitation",
        variant: "destructive",
      });
    }
  };

  const declineInvitation = async (invitationId: string) => {
    try {
      const { error } = await apiClient.declineInvitation(invitationId);
      if (error) throw error;
      
      // Reload pending invitations
      await loadPendingInvitations();
      
      toast({
        title: "Success",
        description: "Invitation declined",
      });
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast({
        title: "Error",
        description: "Failed to decline invitation",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Manage users in your group for collaboration features
      </p>
        {/* Add User Section */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Add User to Group
            </label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter user email address"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="text"
                  placeholder="Enter user name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="flex-1"
                />
              </div>
              <Button 
                onClick={addUserToGroup}
                disabled={isAdding || !newUserEmail.trim() || !newUserName.trim()}
                className="btn-primary"
                onKeyPress={(e) => e.key === 'Enter' && addUserToGroup()}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isAdding ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </div>
        </div>

        {/* Pending Invitations Section */}
        {pendingInvitations.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-foreground">
                Pending Invitations ({pendingInvitations.length})
              </h4>
            </div>
            
            <div className="space-y-2">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center">
                      <Users className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {invitation.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {invitation.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const displayName = prompt('Enter your display name for this user:', '');
                        if (displayName) {
                          approveInvitation(invitation.id, displayName);
                        }
                      }}
                      className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => declineInvitation(invitation.id)}
                      className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Group Users List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">
              Group Members ({groupUsers.length})
            </h4>
          </div>
          
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading group members...</p>
            </div>
          ) : !Array.isArray(groupUsers) || groupUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No group members yet</p>
              <p className="text-xs">Add users to start collaborating</p>
            </div>
          ) : (
            <div className="space-y-2">
              {groupUsers.map((user, index) => (
                <div
                  key={user.id || `user-${index}`}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    user.status === 'approved' 
                      ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
                      : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      user.status === 'approved' 
                        ? 'bg-green-100 dark:bg-green-900/40' 
                        : 'bg-yellow-100 dark:bg-yellow-900/40'
                    }`}>
                      <Users className={`h-4 w-4 ${
                        user.status === 'approved' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-yellow-600 dark:text-yellow-400'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {user.full_name || user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={user.status === 'approved' ? 'secondary' : 'outline'} 
                      className={`text-xs ${
                        user.status === 'approved' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700' 
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700'
                      }`}
                    >
                      {user.status === 'approved' ? 'Approved' : 
                       user.status === 'waiting_for_approval' ? 'Waiting for approval' : 
                       'Pending'}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Added {user.added_at ? new Date(user.added_at).toLocaleDateString() : 'Recently'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUserFromGroup(user.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
    </div>
  );
};
