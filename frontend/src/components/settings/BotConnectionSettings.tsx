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

    // Phone number validation (dev environment only)
    const isDev = import.meta.env.DEV || import.meta.env.VITE_NODE_ENV === 'development';
    if (isDev) {
      // Remove all non-digit characters for validation
      const cleanPhone = whatsappPhone.replace(/\D/g, '');
      
      // Check if it's a valid format (should be 12-15 digits, starting with country code)
      if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        toast({
          title: "Invalid Phone Format",
          description: "Please enter a valid phone number in the format: 972507123456 (country code + number, no spaces or special characters)",
          variant: "destructive"
        });
        return;
      }
      
      // Check if it starts with a country code (common ones)
      const commonCountryCodes = ['1', '7', '20', '27', '30', '31', '32', '33', '34', '36', '39', '40', '41', '43', '44', '45', '46', '47', '48', '49', '51', '52', '53', '54', '55', '56', '57', '58', '60', '61', '62', '63', '64', '65', '66', '81', '82', '84', '86', '90', '91', '92', '93', '94', '95', '98', '212', '213', '216', '218', '220', '221', '222', '223', '224', '225', '226', '227', '228', '229', '230', '231', '232', '233', '234', '235', '236', '237', '238', '239', '240', '241', '242', '243', '244', '245', '246', '248', '249', '250', '251', '252', '253', '254', '255', '256', '257', '258', '260', '261', '262', '263', '264', '265', '266', '267', '268', '269', '290', '291', '297', '298', '299', '350', '351', '352', '353', '354', '355', '356', '357', '358', '359', '370', '371', '372', '373', '374', '375', '376', '377', '378', '380', '381', '382', '383', '385', '386', '387', '389', '420', '421', '423', '500', '501', '502', '503', '504', '505', '506', '507', '508', '509', '590', '591', '592', '593', '594', '595', '596', '597', '598', '599', '670', '672', '673', '674', '675', '676', '677', '678', '679', '680', '681', '682', '683', '684', '685', '686', '687', '688', '689', '690', '691', '692', '850', '852', '853', '855', '856', '880', '886', '960', '961', '962', '963', '964', '965', '966', '967', '968', '970', '971', '972', '973', '974', '975', '976', '977', '992', '993', '994', '995', '996', '998'];
      
      let hasValidCountryCode = false;
      for (const code of commonCountryCodes) {
        if (cleanPhone.startsWith(code)) {
          hasValidCountryCode = true;
          break;
        }
      }
      
      if (!hasValidCountryCode) {
        toast({
          title: "Invalid Country Code",
          description: "Please enter a valid phone number starting with a country code (e.g., 972 for Israel, 1 for US/Canada, 44 for UK)",
          variant: "destructive"
        });
        return;
      }
    }

    setWhatsappLoading(true);
    try {
      const { error } = await apiClient.connectWhatsapp(whatsappPhone);
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
      const { error } = await apiClient.disconnectWhatsapp();
      if (error) throw error;

      toast({
        title: "Success",
        description: "WhatsApp account disconnected successfully!",
      });
      
      // Force immediate state update
      setWhatsappConnected(false);
      setWhatsappPhone('');
      
      // Wait longer before refreshing to ensure backend has processed
      setTimeout(async () => {
        await refreshUser();
        await checkAllStatus();
        
        // Double-check: if phone number is still there, force it to be empty
        const { data: user } = await apiClient.getCurrentUser();
        if (user?.state_data?.whatsapp_phone_number) {
          console.warn('WhatsApp phone still in backend, forcing frontend state to empty');
          setWhatsappConnected(false);
          setWhatsappPhone('');
        }
      }, 5000); // Wait 5 seconds before refreshing
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
                  placeholder="972507123456"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter your phone number with country code (e.g., 972507123456 for Israel)
                </p>
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
