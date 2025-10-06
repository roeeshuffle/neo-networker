import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff } from 'lucide-react';

export const NotificationsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Notifications Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
            <p className="text-sm text-muted-foreground">Stay updated with your latest activities</p>
          </div>
        </div>
      </div>

      {/* Notifications Content */}
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <BellOff className="h-8 w-8 text-muted-foreground" />
            </div>
            <h4 className="text-lg font-medium text-foreground mb-2">No notifications yet</h4>
            <p className="text-muted-foreground">
              When you have notifications, they'll appear here. This includes task assignments, 
              event reminders, and other important updates.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
