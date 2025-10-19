import React, { useState, useEffect } from 'react';
import { apiClient } from '@/integrations/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { GoogleSyncPreviewDialog } from '@/components/GoogleSyncPreviewDialog';

interface GoogleIntegrationSettingsProps {
  currentUser?: any;
}

export const GoogleIntegrationSettings: React.FC<GoogleIntegrationSettingsProps> = ({ currentUser }) => {
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleContactsSynced, setGoogleContactsSynced] = useState(false);
  const [googleCalendarSynced, setGoogleCalendarSynced] = useState(false);
  const [googleConfigured, setGoogleConfigured] = useState(true);
  
  // Preview dialog state
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewType, setPreviewType] = useState<'contacts' | 'calendar'>('contacts');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);

  useEffect(() => {
    checkGoogleStatus();
  }, []);

  const checkGoogleStatus = async () => {
    try {
      const { data, error } = await apiClient.getGoogleStatus();
      if (error && error.error === 'Google OAuth not configured') {
        setGoogleConfigured(false);
        return;
      }
      if (data) {
        setGoogleConnected(data.has_google_account || false);
        setGoogleContactsSynced(!!data.contacts_synced_at);
        setGoogleCalendarSynced(!!data.calendar_synced_at);
        setGoogleConfigured(data.service_configured !== false);
      }
    } catch (error: any) {
      console.error('Error checking Google status:', error);
      // If Google Auth is not configured, this is expected in development
      if (error?.error === 'Google OAuth not configured') {
        setGoogleConfigured(false);
      }
      setGoogleConnected(false);
    }
  };

  const connectGoogle = async () => {
    setGoogleLoading(true);
    try {
      const { data } = await apiClient.connectGoogle();
      if (data?.authorization_url) {
        window.open(data.authorization_url, '_blank');
        toast({
          title: "Success",
          description: "Redirecting to Google authentication...",
        });
      }
    } catch (error) {
      console.error('Error connecting Google:', error);
      toast({
        title: "Error",
        description: "Failed to connect Google account",
        variant: "destructive"
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const disconnectGoogle = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await apiClient.disconnectGoogle();
      if (error) throw error;

      toast({
        title: "Success",
        description: "Google account disconnected successfully!",
      });
      
      setGoogleConnected(false);
      setGoogleContactsSynced(false);
      setGoogleCalendarSynced(false);
    } catch (error) {
      console.error('Error disconnecting Google:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect Google account",
        variant: "destructive"
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const syncGoogleContacts = async () => {
    setContactsLoading(true);
    try {
      const { data, error } = await apiClient.syncGoogleContacts();
      if (error) throw error;

      toast({
        title: "Success",
        description: "Google contacts synced successfully!",
      });
      
      setGoogleContactsSynced(true);
    } catch (error) {
      console.error('Error syncing Google contacts:', error);
      toast({
        title: "Error",
        description: "Failed to sync Google contacts",
        variant: "destructive"
      });
    } finally {
      setContactsLoading(false);
    }
  };

  const syncGoogleCalendar = async () => {
    setCalendarLoading(true);
    try {
      const { data, error } = await apiClient.syncGoogleCalendar();
      if (error) throw error;

      toast({
        title: "Success",
        description: "Google calendar synced successfully!",
      });
      
      setGoogleCalendarSynced(true);
    } catch (error) {
      console.error('Error syncing Google calendar:', error);
      toast({
        title: "Error",
        description: "Failed to sync Google calendar",
        variant: "destructive"
      });
    } finally {
      setCalendarLoading(false);
    }
  };

  const previewGoogleContacts = async () => {
    setPreviewLoading(true);
    try {
      const { data, error } = await apiClient.previewGoogleContacts();
      if (error) throw error;

      setPreviewData(data || []);
      setPreviewType('contacts');
      setPreviewDialogOpen(true);
    } catch (error) {
      console.error('Error previewing Google contacts:', error);
      toast({
        title: "Error",
        description: "Failed to preview Google contacts",
        variant: "destructive"
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const previewGoogleCalendar = async () => {
    setPreviewLoading(true);
    try {
      const { data, error } = await apiClient.previewGoogleCalendar();
      if (error) throw error;

      setPreviewData(data || []);
      setPreviewType('calendar');
      setPreviewDialogOpen(true);
    } catch (error) {
      console.error('Error previewing Google calendar:', error);
      toast({
        title: "Error",
        description: "Failed to preview Google calendar",
        variant: "destructive"
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Google Integration</h3>
      </div>

      {/* Google Auth Not Configured Message */}
      {!googleConfigured && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Google OAuth Not Configured
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Google OAuth is not configured in the development environment. This is normal for local development.
                To enable Google integration, configure the following environment variables:
              </p>
              <ul className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 list-disc list-inside">
                <li><code>GOOGLE_CLIENT_ID</code></li>
                <li><code>GOOGLE_CLIENT_SECRET</code></li>
                <li><code>GOOGLE_REDIRECT_URI</code></li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Google Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!googleConfigured ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Google OAuth is not configured in this environment.
              </p>
            </div>
          ) : googleConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Connected</span>
              </div>
              <Button
                variant="outline"
                onClick={disconnectGoogle}
                disabled={googleLoading}
              >
                {googleLoading ? "Disconnecting..." : "Disconnect Google"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your Google account to sync contacts and calendar events.
              </p>
              <Button
                onClick={connectGoogle}
                disabled={googleLoading}
              >
                {googleLoading ? "Connecting..." : "Connect Google"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Google Contacts Sync */}
      {googleConfigured && googleConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Google Contacts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Sync Status</span>
                  {googleContactsSynced ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs">Synced</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-orange-600">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-xs">Not Synced</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={previewGoogleContacts}
                disabled={previewLoading}
              >
                Preview Contacts
              </Button>
              <Button
                onClick={syncGoogleContacts}
                disabled={contactsLoading}
              >
                {contactsLoading ? "Syncing..." : "Sync Contacts"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Google Calendar Sync */}
      {googleConfigured && googleConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Google Calendar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Sync Status</span>
                  {googleCalendarSynced ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs">Synced</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-orange-600">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-xs">Not Synced</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={previewGoogleCalendar}
                disabled={previewLoading}
              >
                Preview Calendar
              </Button>
              <Button
                onClick={syncGoogleCalendar}
                disabled={calendarLoading}
              >
                {calendarLoading ? "Syncing..." : "Sync Calendar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <GoogleSyncPreviewDialog
        isOpen={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        type={previewType}
        data={previewData}
        loading={previewLoading}
      />
    </div>
  );
};
