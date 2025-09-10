import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bot, MessageSquare, Settings, CheckCircle } from "lucide-react";

export const BotSetup = () => {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [chatId, setChatId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const setupWebhook = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-webhook-setup', {
        body: { 
          action: 'setup',
          webhook_url: webhookUrl || `https://ufekkcirsznhrvqwwsyf.supabase.co/functions/v1/telegram-bot`
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Webhook configured successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to setup webhook",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkWebhook = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-webhook-setup', {
        body: { action: 'status' }
      });

      if (error) throw error;

      toast({
        title: "Webhook Status",
        description: data?.message || "Webhook checked successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to check webhook",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTestMessage = async () => {
    if (!chatId || !message) {
      toast({
        title: "Error",
        description: "Please provide both chat ID and message",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-webhook-setup', {
        body: { 
          action: 'send',
          chat_id: parseInt(chatId),
          message: message
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Test message sent!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Bot className="h-5 w-5" />
            Telegram Bot Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Webhook Configuration */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Webhook Configuration
            </Label>
            <div className="flex gap-3">
              <Input
                placeholder="Custom webhook URL (optional)"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="flex-1"
              />
              <Button onClick={setupWebhook} disabled={loading}>
                Setup Webhook
              </Button>
              <Button variant="outline" onClick={checkWebhook} disabled={loading}>
                Check Status
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Default webhook: https://ufekkcirsznhrvqwwsyf.supabase.co/functions/v1/telegram-bot
            </p>
          </div>

          {/* Test Message */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Test Bot Connection
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                placeholder="Your Telegram Chat ID"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
              />
              <Input
                placeholder="Test message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <Button onClick={sendTestMessage} disabled={loading} className="w-full">
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Test Message
            </Button>
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <p className="font-medium mb-2">How to get your Chat ID:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Send "/start" to @userinfobot on Telegram</li>
                <li>Copy the Chat ID from the response</li>
                <li>Enter it above to test the bot</li>
              </ol>
            </div>
          </div>

          {/* Bot Instructions */}
          <div className="bg-primary-soft/20 p-4 rounded-lg border border-primary/20">
            <h4 className="font-medium flex items-center gap-2 mb-3">
              <CheckCircle className="h-4 w-4" />
              Bot Usage Instructions
            </h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>1. Start the bot by sending <code className="bg-muted px-1 rounded">/start</code></p>
              <p>2. Authenticate with password: <code className="bg-muted px-1 rounded">121212</code></p>
              <p>3. Search contacts by typing <code className="bg-muted px-1 rounded">.search_term</code></p>
              <p>4. Add new contacts with <code className="bg-muted px-1 rounded">/add</code></p>
              <p>5. Get help anytime with <code className="bg-muted px-1 rounded">/help</code></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};