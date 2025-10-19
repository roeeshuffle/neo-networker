import React, { useState, useEffect } from 'react';
import { apiClient } from '@/integrations/api/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Bot, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BotConnectionSettingsProps {
  currentUser?: any;
}

export const BotConnectionSettings: React.FC<BotConnectionSettingsProps> = ({ currentUser }) => {
  const { refreshUser } = useAuth();
  const [telegramId, setTelegramId] = useState('');
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [preferredPlatform, setPreferredPlatform] = useState('telegram');

  useEffect(() => {
    checkAllStatus();
  }, []);

  const checkAllStatus = async () => {
    try {
      const { data: user } = await apiClient.getCurrentUser();
      
      // Update Telegram status
      if (user?.telegram_id) {
        setTelegramConnected(true);
        setTelegramId(user.telegram_id.toString());
      } else {
        setTelegramConnected(false);
        setTelegramId('');
      }
      
      // Update WhatsApp status
      const whatsappPhone = user?.state_data?.whatsapp_phone_number;
      if (whatsappPhone) {
        setWhatsappConnected(true);
        setWhatsappPhone(whatsappPhone);
      } else {
        setWhatsappConnected(false);
        setWhatsappPhone('');
      }
      
      // Update preferred platform
      if (user?.preferred_messaging_platform) {
        setPreferredPlatform(user.preferred_messaging_platform);
      }
    } catch (error) {
      console.error('Error checking status:', error);
      setTelegramConnected(false);
      setTelegramId('');
      setWhatsappConnected(false);
      setWhatsappPhone('');
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
      const { data, error } = await apiClient.connectTelegram(telegramId);
      if (error) throw error;

      if (data?.transferred_from) {
        toast({
          title: "Success",
          description: `Telegram account transferred from ${data.transferred_from}!`,
        });
      } else {
        toast({
          title: "Success",
          description: "Telegram account connected successfully!",
        });
      }
      
      await refreshUser();
      await checkAllStatus();
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
      
      await refreshUser();
      await checkAllStatus();
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

  const connectWhatsApp = async () => {
    if (!whatsappPhone.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number",
        variant: "destructive"
      });
      return;
    }

    setWhatsappLoading(true);
    try {
      const { error } = await apiClient.connectWhatsApp(whatsappPhone);
      if (error) throw error;

      toast({
        title: "Success",
        description: "WhatsApp account connected successfully!",
      });
      
      await refreshUser();
      await checkAllStatus();
    } catch (error) {
      console.error('Error connecting WhatsApp:', error);
      toast({
        title: "Error",
        description: "Failed to connect WhatsApp account",
        variant: "destructive"
      });
    } finally {
      setWhatsappLoading(false);
    }
  };

  const disconnectWhatsApp = async () => {
    setWhatsappLoading(true);
    try {
      const { error } = await apiClient.disconnectWhatsApp();
      if (error) throw error;

      toast({
        title: "Success",
        description: "WhatsApp account disconnected successfully!",
      });
      
      await refreshUser();
      await checkAllStatus();
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
      const { error } = await apiClient.updateUserPreferences({
        preferred_messaging_platform: platform
      });
      if (error) throw error;

      setPreferredPlatform(platform);
      toast({
        title: "Success",
        description: "Preferred platform updated successfully!",
      });
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
      <div>
        <h3 className="text-lg font-semibold mb-2">Bot Connection</h3>
      </div>

      {/* Telegram Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Telegram Bot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {telegramConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Connected</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Telegram ID: {telegramId}
              </div>
              <Button
                variant="outline"
                onClick={disconnectTelegram}
                disabled={telegramLoading}
              >
                {telegramLoading ? "Disconnecting..." : "Disconnect Telegram"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Telegram ID</label>
                <Input
                  placeholder="Enter your Telegram ID"
                  value={telegramId}
                  onChange={(e) => setTelegramId(e.target.value)}
                />
              </div>
              <Button
                onClick={connectTelegram}
                disabled={telegramLoading}
              >
                {telegramLoading ? "Connecting..." : "Connect Telegram"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* WhatsApp Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            WhatsApp Bot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {whatsappConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Connected</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Phone: {whatsappPhone}
              </div>
              <Button
                variant="outline"
                onClick={disconnectWhatsApp}
                disabled={whatsappLoading}
              >
                {whatsappLoading ? "Disconnecting..." : "Disconnect WhatsApp"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <Input
                  placeholder="Enter your phone number"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                />
              </div>
              <Button
                onClick={connectWhatsApp}
                disabled={whatsappLoading}
              >
                {whatsappLoading ? "Connecting..." : "Connect WhatsApp"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preferred Platform */}
      <Card>
        <CardHeader>
          <CardTitle>Preferred Platform</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label className="text-sm font-medium">Choose your preferred messaging platform</label>
            <Select value={preferredPlatform} onValueChange={updatePreferredPlatform}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="telegram">Telegram</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
