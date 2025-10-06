import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronDown, X, Users } from 'lucide-react';
import { apiClient } from '@/integrations/api/client';
import { cn } from '@/lib/utils';

interface GroupUser {
  id: string;
  email: string;
  full_name?: string;
  added_at: string;
}

interface UserSelectorProps {
  selectedUsers: GroupUser[];
  onUsersChange: (users: GroupUser[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const UserSelector: React.FC<UserSelectorProps> = ({
  selectedUsers,
  onUsersChange,
  placeholder = "Select users...",
  className,
  disabled = false
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupUsers, setGroupUsers] = useState<GroupUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load group users on component mount
  useEffect(() => {
    loadGroupUsers();
  }, []);

  const loadGroupUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await apiClient.getUserGroup();
      if (error) throw error;
      
      // Ensure data is an array
      const users = Array.isArray(data) ? data : (data?.data || []);
      setGroupUsers(users);
    } catch (error) {
      console.error('Error loading group users:', error);
      setGroupUsers([]); // Ensure it's always an array
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = (user: GroupUser) => {
    const isAlreadySelected = selectedUsers.some(selected => selected.id === user.id);
    
    if (isAlreadySelected) {
      // Remove user from selection
      onUsersChange(selectedUsers.filter(selected => selected.id !== user.id));
    } else {
      // Add user to selection
      onUsersChange([...selectedUsers, user]);
    }
  };

  const handleRemoveUser = (userId: string) => {
    onUsersChange(selectedUsers.filter(user => user.id !== userId));
  };

  const filteredUsers = groupUsers.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
      (user.full_name && user.full_name.toLowerCase().includes(query))
    );
  });

  const displayName = (user: GroupUser) => {
    return user.full_name || user.email;
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Selected Users Display */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((user) => (
            <Badge
              key={user.id}
              variant="secondary"
              className="flex items-center gap-1 px-2 py-1"
            >
              <Users className="h-3 w-3" />
              <span className="text-xs">{displayName(user)}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive/10"
                onClick={() => handleRemoveUser(user.id)}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* User Selection Dropdown */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            <span className="truncate">
              {selectedUsers.length === 0 
                ? placeholder 
                : `${selectedUsers.length} user${selectedUsers.length === 1 ? '' : 's'} selected`
              }
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              ref={inputRef}
              placeholder="Search users..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {isLoading ? (
                <CommandEmpty>Loading users...</CommandEmpty>
              ) : filteredUsers.length === 0 ? (
                <CommandEmpty>
                  {searchQuery ? 'No users found' : 'No group members available'}
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {filteredUsers.map((user) => {
                    const isSelected = selectedUsers.some(selected => selected.id === user.id);
                    return (
                      <CommandItem
                        key={user.id}
                        value={user.email}
                        onSelect={() => handleSelectUser(user)}
                        className="flex items-center gap-2"
                      >
                        <div className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                        )}>
                          <Check className="h-3 w-3" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {displayName(user)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {user.email}
                          </span>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
