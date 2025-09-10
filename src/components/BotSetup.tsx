import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const BotSetup = () => {
  const [loading, setLoading] = useState(false);
  const [webhookInfo, setWebhookInfo] = useState<any>(null);
  const { toast } = useToast();

  const setupWebhook = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-webhook-setup', {
        body: { action: 'set_webhook' }
      });

      if (error) throw error;

      toast({
        title: "Webhook Setup",
        description: data.ok ? "Webhook configured successfully!" : `Error: ${data.description}`,
        variant: data.ok ? "default" : "destructive"
      });

      if (data.ok) {
        getWebhookInfo();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to setup webhook: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getWebhookInfo = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-webhook-setup', {
        body: { action: 'get_webhook_info' }
      });

      if (error) throw error;

      setWebhookInfo(data.result);
      toast({
        title: "Webhook Info",
        description: "Webhook information retrieved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to get webhook info: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Telegram Bot Setup</CardTitle>
        <CardDescription>Configure the Telegram webhook to activate your bot</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-2">
          <Button onClick={setupWebhook} disabled={loading}>
            {loading ? "Setting up..." : "Setup Webhook"}
          </Button>
          <Button variant="outline" onClick={getWebhookInfo} disabled={loading}>
            {loading ? "Loading..." : "Check Webhook Status"}
          </Button>
        </div>
        
        {webhookInfo && (
          <div className="p-3 bg-gray-50 rounded-lg text-sm">
            <h4 className="font-semibold mb-2">Webhook Status:</h4>
            <p><strong>URL:</strong> {webhookInfo.url || 'Not set'}</p>
            <p><strong>Active:</strong> {webhookInfo.has_custom_certificate ? 'Yes' : 'No'}</p>
            <p><strong>Pending Updates:</strong> {webhookInfo.pending_update_count}</p>
            {webhookInfo.last_error_date && (
              <p className="text-red-600"><strong>Last Error:</strong> {webhookInfo.last_error_message}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};