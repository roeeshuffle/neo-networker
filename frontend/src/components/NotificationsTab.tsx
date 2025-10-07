import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Check, CheckCheck, Clock, User, Calendar, FileText, Users } from 'lucide-react';
import { apiClient } from '@/integrations/api/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Notification {
  id: string;
  user_email: string;
  notification: string;
  notification_type: string;
  is_read: boolean;
  seen: boolean;
  created_at: string;
}

interface NotificationsTabProps {
  onNotificationRead?: () => void;
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({ onNotificationRead }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, isAuthenticated, token } = useAuth();

  console.log('🔔 NotificationsTab: Component rendered');
  console.log('🔔 NotificationsTab: User:', user);
  console.log('🔔 NotificationsTab: Is authenticated:', isAuthenticated);
  console.log('🔔 NotificationsTab: Token:', token ? 'Present' : 'Missing');

  useEffect(() => {
    console.log('🔔 NotificationsTab: useEffect triggered');
    if (isAuthenticated) {
      console.log('🔔 NotificationsTab: User is authenticated, fetching notifications');
      fetchNotifications();
    } else {
      console.log('🔔 NotificationsTab: User is not authenticated, skipping fetch');
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchNotifications = async () => {
    try {
      console.log('🔔 NotificationsTab: Starting to fetch notifications...');
      setLoading(true);
      
      const response = await apiClient.getNotifications();
      console.log('🔔 NotificationsTab: API response:', response);
      
      if (response.data) {
        console.log('🔔 NotificationsTab: Received notifications:', response.data);
        // Handle both array format and object with notifications property
        const notificationsData = Array.isArray(response.data) ? response.data : response.data.notifications || [];
        setNotifications(notificationsData);
      } else {
        console.error('🔔 NotificationsTab: Error fetching notifications:', response.error);
        toast({
          title: "Error",
          description: "Failed to fetch notifications",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('🔔 NotificationsTab: Exception fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log('🔔 NotificationsTab: Finished fetching notifications');
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      setMarkingRead(notificationId);
      const response = await apiClient.markNotificationRead(notificationId);
      if (response.data) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, is_read: true }
              : notif
          )
        );
        toast({
          title: "Success",
          description: "Notification marked as read",
        });
        onNotificationRead?.(); // Refresh unread count
      } else {
        console.error('Error marking notification as read:', response.error);
        toast({
          title: "Error",
          description: "Failed to mark notification as read",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    } finally {
      setMarkingRead(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await apiClient.markAllNotificationsRead();
      if (response.data) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, is_read: true }))
        );
        toast({
          title: "Success",
          description: "All notifications marked as read",
        });
        onNotificationRead?.(); // Refresh unread count
      } else {
        console.error('Error marking all notifications as read:', response.error);
        toast({
          title: "Error",
          description: "Failed to mark all notifications as read",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return <FileText className="h-4 w-4" />;
      case 'contact_shared':
        return <Users className="h-4 w-4" />;
      case 'event_assigned':
        return <Calendar className="h-4 w-4" />;
      case 'group_invitation':
        return <User className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'contact_shared':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'event_assigned':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'group_invitation':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 px-[5%]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
              <p className="text-sm text-muted-foreground">Loading notifications...</p>
            </div>
          </div>
        </div>
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-[5%]">
      {/* Notifications Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
            <p className="text-sm text-muted-foreground">
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        {notifications.length > 0 && (
          <Button 
            onClick={handleMarkAllAsRead}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Notifications Content */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <BellOff className="h-8 w-8 text-muted-foreground" />
              </div>
              <h4 className="text-lg font-medium text-foreground mb-2">No notifications found</h4>
              <p className="text-muted-foreground">
                When you have notifications, they'll appear here. This includes task assignments, 
                event reminders, and other important updates.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card key={notification.id} className={`${!notification.is_read ? 'border-primary/20 bg-primary/5' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getNotificationTypeColor(notification.notification_type)}`}>
                      {getNotificationIcon(notification.notification_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`text-xs ${getNotificationTypeColor(notification.notification_type)}`}>
                          {notification.notification_type.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(notification.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{notification.notification}</p>
                    </div>
                  </div>
                  
                  {!notification.is_read && (
                    <Button
                      onClick={() => handleMarkAsRead(notification.id)}
                      variant="ghost"
                      size="sm"
                      disabled={markingRead === notification.id}
                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
