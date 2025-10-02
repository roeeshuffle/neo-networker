import React, { useState, useEffect } from 'react';
import { apiClient } from '@/integrations/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Bot, Link, Unlink, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TelegramStatus {
  connected: boolean;
  telegram_user: {
    id: string;
    telegram_id: string;
    telegram_username: string;
    first_name: string;
  } | null;
}

export const TelegramSettingsTab: React.FC = () => {
  const [telegramStatus, setTelegramStatus] = useState<TelegramStatus>({ connected: false, telegram_user: null });
  const [loading, setLoading] = useState(false);
  const [telegramId, setTelegramId] = useState('');

  useEffect(() => {
    fetchTelegramStatus();
  }, []);

  const fetchTelegramStatus = async () => {
    try {
      const { data, error } = await apiClient.getTelegramStatus();
      if (error) {
        console.error('Error fetching Telegram status:', error);
        return;
      }
      setTelegramStatus(data || { connected: false, telegram_user: null });
    } catch (error) {
      console.error('Error fetching Telegram status:', error);
    }
  };

  const handleConnect = async () => {
    if (!telegramId.trim()) {
      toast({
        title: "Error",
        description: "Please enter your Telegram ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await apiClient.connectTelegram(telegramId);
      if (error) {
        toast({
          title: "Error",
          description: error.error || "Failed to connect Telegram account",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Telegram account connected successfully!",
      });
      
      setTelegramId('');
      await fetchTelegramStatus();
    } catch (error: any) {
      console.error('Error connecting Telegram:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to connect Telegram account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      const { data, error } = await apiClient.disconnectTelegram();
      if (error) {
        toast({
          title: "Error",
          description: error.error || "Failed to disconnect Telegram account",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Telegram account disconnected successfully!",
      });
      
      await fetchTelegramStatus();
    } catch (error: any) {
      console.error('Error disconnecting Telegram:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect Telegram account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyTelegramId = () => {
    if (telegramStatus.telegram_user?.telegram_id) {
      navigator.clipboard.writeText(telegramStatus.telegram_user.telegram_id);
      toast({
        title: "Copied",
        description: "Telegram ID copied to clipboard",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Telegram Bot Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {telegramStatus.connected ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              )}
              <div>
                <div className="font-medium">
                  {telegramStatus.connected ? 'Connected' : 'Not Connected'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {telegramStatus.connected 
                    ? 'Your Telegram account is connected to the bot'
                    : 'Connect your Telegram account to use the bot'
                  }
                </div>
              </div>
            </div>
            <Badge variant={telegramStatus.connected ? 'default' : 'secondary'}>
              {telegramStatus.connected ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          {/* Connection Details */}
          {telegramStatus.connected && telegramStatus.telegram_user && (
            <div className="space-y-4">
              <Separator />
              <div>
                <Label className="text-sm font-medium">Connection Details</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <div className="text-sm font-medium">Telegram ID</div>
                      <div className="text-sm text-muted-foreground font-mono">
                        {telegramStatus.telegram_user.telegram_id}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyTelegramId}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <div className="text-sm font-medium">Name</div>
                      <div className="text-sm text-muted-foreground">
                        {telegramStatus.telegram_user.first_name}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <div className="text-sm font-medium">Username</div>
                      <div className="text-sm text-muted-foreground">
                        @{telegramStatus.telegram_user.telegram_username || 'Not set'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <div className="text-sm font-medium">Authentication Status</div>
                      <div className="text-sm text-muted-foreground">
                        Connected
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Connect/Disconnect Actions */}
          <div className="space-y-4">
            <Separator />
            {!telegramStatus.connected ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="telegram-id">Telegram ID</Label>
                  <Input
                    id="telegram-id"
                    placeholder="Enter your Telegram ID"
                    value={telegramId}
                    onChange={(e) => setTelegramId(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    You can find your Telegram ID by messaging @userinfobot on Telegram
                  </p>
                </div>
                <Button 
                  onClick={handleConnect} 
                  disabled={loading || !telegramId.trim()}
                  className="w-full"
                >
                  <Link className="w-4 h-4 mr-2" />
                  {loading ? 'Connecting...' : 'Connect Telegram Account'}
                </Button>
              </div>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Unlink className="w-4 h-4 mr-2" />
                    Disconnect Telegram Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disconnect Telegram Account</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to disconnect your Telegram account? 
                      You will no longer be able to use the bot until you reconnect.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDisconnect}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Disconnect
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {/* Instructions */}
          <div className="space-y-4">
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2">How to use the Telegram Bot</h4>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>1. Connect your Telegram account using the form above</p>
                <p>2. Find the bot on Telegram: @your_bot_username</p>
                <p>3. Send /start to begin using the bot</p>
                <p>4. Send /auth to authenticate with your connected account</p>
                <p>5. Use natural language to manage tasks, contacts, and more!</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
