import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Share2 } from "lucide-react";

interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
}

interface ShareDataDialogProps {
  tableName: string;
  recordId: string;
  currentShares?: string[];
}

export const ShareDataDialog = ({ tableName, recordId, currentShares = [] }: ShareDataDialogProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>(currentShares);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .eq('is_approved', true);

      if (error) throw error;

      const currentUser = await supabase.auth.getUser();
      const filteredUsers = profiles?.filter(user => user.id !== currentUser.data.user?.id) || [];
      
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error('Not authenticated');

      // Remove existing shares
      await supabase
        .from('shared_data')
        .delete()
        .eq('table_name', tableName)
        .eq('record_id', recordId)
        .eq('owner_id', currentUser.data.user.id);

      // Add new shares
      if (selectedUsers.length > 0) {
        const shares = selectedUsers.map(userId => ({
          owner_id: currentUser.data.user!.id,
          shared_with_user_id: userId,
          table_name: tableName,
          record_id: recordId
        }));

        const { error } = await supabase
          .from('shared_data')
          .insert(shares);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Sharing settings updated successfully",
      });
      
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update sharing settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share with Users</DialogTitle>
          <DialogDescription>
            Select users to share this {tableName.slice(0, -1)} with
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {users.length === 0 ? (
            <p className="text-muted-foreground text-sm">No other users available</p>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={user.id}
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={() => handleUserToggle(user.id)}
                  />
                  <div className="flex items-center space-x-2 flex-1">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>
                        {user.full_name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.full_name || user.email}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};