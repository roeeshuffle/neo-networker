import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { GroupSettings } from '@/components/GroupSettings';

interface GroupManagementSettingsProps {
  currentUser?: any;
}

export const GroupManagementSettings: React.FC<GroupManagementSettingsProps> = ({ currentUser }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Group Management</h3>
      </div>

      {/* Group Settings Component */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Contact Groups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GroupSettings />
        </CardContent>
      </Card>

      {/* Group Features Info */}
      <Card>
        <CardHeader>
          <CardTitle>Group Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Organize Contacts</h4>
                <p className="text-xs text-muted-foreground">
                  Create custom groups to categorize your contacts by company, industry, or relationship.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Targeted Messaging</h4>
                <p className="text-xs text-muted-foreground">
                  Send messages to specific groups for more effective communication.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Group Analytics</h4>
                <p className="text-xs text-muted-foreground">
                  Track engagement and activity within each group.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Bulk Operations</h4>
                <p className="text-xs text-muted-foreground">
                  Perform bulk actions on contacts within groups.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
