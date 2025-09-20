import { useState, useEffect } from "react";
import { apiClient } from "@/integrations/api/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface OwnerInfoProps {
  ownerId: string;
}

interface Owner {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
}

export const OwnerInfo = ({ ownerId }: OwnerInfoProps) => {
  const [owner, setOwner] = useState<Owner | null>(null);

  useEffect(() => {
    const fetchOwner = async () => {
      try {
      const { data, error } = await apiClient.getCurrentUser();

        if (error) throw error;
        setOwner(data);
      } catch (error) {
        console.error('Error fetching owner:', error);
      }
    };

    if (ownerId) {
      fetchOwner();
    }
  }, [ownerId]);

  if (!owner) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  return (
    <div className="flex items-center space-x-2">
      <Avatar className="h-6 w-6">
        <AvatarImage src={owner.avatar_url} />
        <AvatarFallback className="text-xs">
          {owner.full_name?.charAt(0)?.toUpperCase() || owner.email.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium">
        {owner.full_name || owner.email}
      </span>
    </div>
  );
};