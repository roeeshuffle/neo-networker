import React, { useState, useEffect } from 'react';
import { apiClient } from '@/integrations/api/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

interface SettingsTabProps {
  onDeleteAllTelegramUsers?: () => Promise<void>;
  onDeleteAllPeople?: () => Promise<void>;
  currentUser?: any;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ 
  onDeleteAllTelegramUsers, 
  onDeleteAllPeople,
  currentUser 
}) => {
  const { refreshUser } = useAuth();
  const [telegramId, setTelegramId] = useState('');
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [preferredPlatform, setPreferredPlatform] = useState('telegram');
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleContactsSynced, setGoogleContactsSynced] = useState(false);
  const [googleCalendarSynced, setGoogleCalendarSynced] = useState(false);

  useEffect(() => {
    console.log('🔧 SettingsTab loaded with WhatsApp and Google support!');
    checkTelegramStatus();
    checkWhatsappStatus();
    // checkGoogleStatus(); // Temporarily disabled - Google Auth routes commented out
  }, []);

  const checkTelegramStatus = async () => {
    try {
      const { data: user } = await apiClient.getCurrentUser();
      if (user?.telegram_id) {
        setTelegramConnected(true);
        setTelegramId(user.telegram_id.toString());
      } else {
        setTelegramConnected(false);
        setTelegramId('');
      }
    } catch (error) {
      console.error('Error checking Telegram status:', error);
      setTelegramConnected(false);
      setTelegramId('');
    }
  };

  const connectTelegram = async () => {
    if (!telegramId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid Telegram ID",
        variant: "destructive"
      });
      return;
    }

    setTelegramLoading(true);
    try {
      const { error } = await apiClient.connectTelegram(telegramId);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Telegram account connected successfully!",
      });
      
      // Refresh the user data in the authentication context
      await refreshUser();
      // Also refresh the local state
      await checkTelegramStatus();
    } catch (error) {
      console.error('Error connecting Telegram:', error);
      toast({
        title: "Error",
        description: "Failed to connect Telegram account",
        variant: "destructive"
      });
    } finally {
      setTelegramLoading(false);
    }
  };

  const disconnectTelegram = async () => {
    setTelegramLoading(true);
    try {
      const { error } = await apiClient.disconnectTelegram();
      if (error) throw error;

      toast({
        title: "Success",
        description: "Telegram account disconnected successfully!",
      });
      
      // Refresh the user data in the authentication context
      await refreshUser();
      // Also refresh the local state
      await checkTelegramStatus();
    } catch (error) {
      console.error('Error disconnecting Telegram:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect Telegram account",
        variant: "destructive"
      });
    } finally {
      setTelegramLoading(false);
    }
  };

  const checkWhatsappStatus = async () => {
    try {
      console.log('🔍 Checking WhatsApp status...');
      const { data: user } = await apiClient.getCurrentUser();
      console.log('👤 User data:', user);
      console.log('👤 User whatsapp_phone:', user?.whatsapp_phone);
      
      if (user?.whatsapp_phone) {
        console.log('✅ WhatsApp phone found:', user.whatsapp_phone);
        console.log('🔧 Setting whatsappConnected to true');
        setWhatsappConnected(true);
        console.log('🔧 Setting whatsappPhone to:', user.whatsapp_phone);
        setWhatsappPhone(user.whatsapp_phone);
        console.log('✅ State should now be updated');
      } else {
        console.log('❌ No WhatsApp phone found');
        setWhatsappConnected(false);
        setWhatsappPhone('');
      }
      if (user?.preferred_messaging_platform) {
        console.log('📱 Preferred platform:', user.preferred_messaging_platform);
        setPreferredPlatform(user.preferred_messaging_platform);
      }
    } catch (error) {
      console.error('❌ Error checking WhatsApp status:', error);
      setWhatsappConnected(false);
      setWhatsappPhone('');
    }
  };

  const connectWhatsapp = async () => {
    if (!whatsappPhone.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid WhatsApp phone number",
        variant: "destructive"
      });
      return;
    }

    // Remove + prefix and clean the phone number
    const cleanPhone = whatsappPhone.replace(/^\+/, '').replace(/\s+/g, '').replace(/-/g, '');
    
    console.log('🔧 Connecting WhatsApp with phone:', cleanPhone);
    
    setWhatsappLoading(true);
    try {
      const { error } = await apiClient.connectWhatsapp(cleanPhone);
      if (error) throw error;

      console.log('✅ WhatsApp connected successfully, refreshing user data...');

      toast({
        title: "Success",
        description: "WhatsApp account connected successfully!",
      });
      
      // Refresh the user data in the authentication context
      await refreshUser();
      // Also refresh the local state
      await checkWhatsappStatus();
      
      console.log('✅ User data refreshed, WhatsApp status checked');
    } catch (error) {
      console.error('❌ Error connecting WhatsApp:', error);
      toast({
        title: "Error",
        description: "Failed to connect WhatsApp account",
        variant: "destructive"
      });
    } finally {
      setWhatsappLoading(false);
    }
  };

  const disconnectWhatsapp = async () => {
    setWhatsappLoading(true);
    try {
      const { error } = await apiClient.disconnectWhatsapp();
      if (error) throw error;

      toast({
        title: "Success",
        description: "WhatsApp account disconnected successfully!",
      });
      
      // Refresh the user data in the authentication context
      await refreshUser();
      // Also refresh the local state
      await checkWhatsappStatus();
    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect WhatsApp account",
        variant: "destructive"
      });
    } finally {
      setWhatsappLoading(false);
    }
  };

  const checkGoogleStatus = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/google/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGoogleConnected(data.has_google_account);
        setGoogleContactsSynced(!!data.contacts_synced_at);
        setGoogleCalendarSynced(!!data.calendar_synced_at);
      } else {
        setGoogleConnected(false);
        setGoogleContactsSynced(false);
        setGoogleCalendarSynced(false);
      }
    } catch (error) {
      console.error('Error checking Google status:', error);
      setGoogleConnected(false);
      setGoogleContactsSynced(false);
      setGoogleCalendarSynced(false);
    }
  };

  const connectGoogle = async () => {
    setGoogleLoading(true);
    try {
      // Get Google OAuth authorization URL
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/google`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to initiate Google authentication');
      }

      const data = await response.json();
      const { authorization_url } = data;

      // Open Google OAuth in a popup window
      const popup = window.open(
        authorization_url,
        'googleAuth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for the popup to close or receive a message
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setGoogleLoading(false);
          checkGoogleStatus(); // Refresh status
        }
      }, 1000);

      // Listen for messages from the popup
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup?.close();
          
          toast({
            title: "Success",
            description: "Google account connected successfully!",
          });
          
          checkGoogleStatus();
          setGoogleLoading(false);
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup?.close();
          
          toast({
            title: "Google Auth Failed",
            description: event.data.error || "Authentication failed",
            variant: "destructive",
          });
          setGoogleLoading(false);
        }
      };

      window.addEventListener('message', messageListener);

    } catch (error: any) {
      console.error("Google Auth error:", error);
      toast({
        title: "Error", 
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      setGoogleLoading(false);
    }
  };

  const disconnectGoogle = async () => {
    setGoogleLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/google/revoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to disconnect Google account');
      }

      toast({
        title: "Success",
        description: "Google account disconnected successfully!",
      });
      
      await refreshUser();
      await checkGoogleStatus();
    } catch (error: any) {
      console.error('Error disconnecting Google:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect Google account",
        variant: "destructive"
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const syncGoogleContacts = async () => {
    setGoogleLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/google/contacts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync contacts');
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: `Synced ${data.count} Google contacts!`,
      });
      
      await checkGoogleStatus();
    } catch (error: any) {
      console.error('Error syncing Google contacts:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to sync Google contacts",
        variant: "destructive"
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const syncGoogleCalendar = async () => {
    setGoogleLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/google/calendar`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync calendar');
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: `Synced ${data.count} Google calendar events!`,
      });
      
      await checkGoogleStatus();
    } catch (error: any) {
      console.error('Error syncing Google calendar:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to sync Google calendar",
        variant: "destructive"
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const updatePreferredPlatform = async (platform: string) => {
    try {
      const { error } = await apiClient.updatePreferredPlatform(platform);
      if (error) throw error;

      setPreferredPlatform(platform);
      toast({
        title: "Success",
        description: `Preferred messaging platform updated to ${platform}`,
      });
      
      await refreshUser();
    } catch (error) {
      console.error('Error updating preferred platform:', error);
      toast({
        title: "Error",
        description: "Failed to update preferred platform",
        variant: "destructive"
      });
    }
  };


  // Debug current state before rendering
  console.log('🎨 Rendering SettingsTab with state:', {
    whatsappConnected,
    whatsappPhone,
    preferredPlatform
  });

  return (
    <div className="space-y-6">
      {/* Messaging Platform Connection Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5" />
            Bot Connection
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Connect your Telegram and WhatsApp accounts to receive bot messages
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Platform Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Preferred Messaging Platform</label>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="platform"
                  value="telegram"
                  checked={preferredPlatform === 'telegram'}
                  onChange={(e) => updatePreferredPlatform(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Telegram</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="platform"
                  value="whatsapp"
                  checked={preferredPlatform === 'whatsapp'}
                  onChange={(e) => updatePreferredPlatform(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm">WhatsApp</span>
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Choose which platform to use for bot messages (you can connect both)
            </p>
          </div>

          {/* Telegram Connection */}
          <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="font-medium text-blue-800">Telegram Connection</span>
            </div>
            {telegramConnected ? (
              <div className="flex items-center justify-between p-3 border border-green-200 rounded-lg bg-green-50">
                <div>
                  <div className="font-medium text-green-800">Telegram Connected</div>
                  <div className="text-sm text-green-600">ID: {telegramId}</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={disconnectTelegram}
                  disabled={telegramLoading}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Telegram User ID</label>
                  <p className="text-xs text-muted-foreground mb-2">
                    To get your Telegram ID, message @userinfobot on Telegram
                  </p>
                  <Input
                    type="text"
                    value={telegramId}
                    onChange={(e) => setTelegramId(e.target.value)}
                    placeholder="Enter your Telegram ID"
                  />
                </div>
                <Button
                  onClick={connectTelegram}
                  disabled={telegramLoading || !telegramId.trim()}
                  className="w-full"
                >
                  {telegramLoading ? 'Connecting...' : 'Connect Telegram'}
                </Button>
              </div>
            )}
          </div>

          {/* WhatsApp Connection */}
          <div className="space-y-4 p-4 border rounded-lg bg-green-50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium text-green-800">WhatsApp Connection</span>
            </div>
            {whatsappConnected ? (
              <div className="flex items-center justify-between p-3 border border-green-200 rounded-lg bg-green-50">
                <div>
                  <div className="font-medium text-green-800">WhatsApp Connected</div>
                  <div className="text-sm text-green-600">Phone: {whatsappPhone}</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={disconnectWhatsapp}
                  disabled={whatsappLoading}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">WhatsApp Phone Number</label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Enter your WhatsApp phone number (with country code, e.g., +1234567890)
                  </p>
                  <Input
                    type="text"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    placeholder="+1234567890"
                  />
                </div>
                <Button
                  onClick={connectWhatsapp}
                  disabled={whatsappLoading || !whatsappPhone.trim()}
                  className="w-full"
                >
                  {whatsappLoading ? 'Connecting...' : 'Connect WhatsApp'}
                </Button>
              </div>
            )}
          </div>

          {/* Connection Status */}
          <div className="text-xs text-muted-foreground">
            <p>• You can connect both Telegram and WhatsApp simultaneously</p>
            <p>• Choose your preferred platform for bot messages using the radio buttons above</p>
            <p>• Phone numbers are automatically cleaned (removes + prefix and spaces)</p>
          </div>
        </CardContent>
      </Card>

      {/* Google Integration Section */}
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
            Google Integration
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Connect your Google account to sync contacts and calendar events
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Google Connection */}
          <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="font-medium text-blue-800">Google Account</span>
            </div>
            {googleConnected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-green-200 rounded-lg bg-green-50">
                  <div>
                    <div className="font-medium text-green-800">Google Connected</div>
                    <div className="text-sm text-green-600">Account linked successfully</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={disconnectGoogle}
                    disabled={googleLoading}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Disconnect
                  </Button>
                </div>
                
                {/* Sync Options */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
                    <div>
                      <div className="font-medium">Google Contacts</div>
                      <div className="text-sm text-muted-foreground">
                        {googleContactsSynced ? 'Last synced' : 'Not synced yet'}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={syncGoogleContacts}
                      disabled={googleLoading}
                    >
                      {googleLoading ? 'Syncing...' : 'Sync Contacts'}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
                    <div>
                      <div className="font-medium">Google Calendar</div>
                      <div className="text-sm text-muted-foreground">
                        {googleCalendarSynced ? 'Last synced' : 'Not synced yet'}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={syncGoogleCalendar}
                      disabled={googleLoading}
                    >
                      {googleLoading ? 'Syncing...' : 'Sync Calendar'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Connect your Google account to access contacts and calendar events. 
                  This will allow you to sync your Google data with the CRM.
                </div>
                <Button
                  onClick={connectGoogle}
                  disabled={googleLoading}
                  className="w-full"
                >
                  {googleLoading ? 'Connecting...' : 'Connect Google Account'}
                </Button>
              </div>
            )}
          </div>

          {/* Google Integration Info */}
          <div className="text-xs text-muted-foreground">
            <p>• Google integration requires calendar and contacts permissions</p>
            <p>• Your data is synced securely and stored in your CRM account</p>
            <p>• You can disconnect your Google account at any time</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
