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

  useEffect(() => {
    console.log('🔧 SettingsTab loaded with WhatsApp support!');
    checkTelegramStatus();
    checkWhatsappStatus();
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
        setWhatsappConnected(true);
        setWhatsappPhone(user.whatsapp_phone);
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
    </div>
  );
};
