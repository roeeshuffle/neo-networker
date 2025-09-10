import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');

serve(async (req) => {
  try {
    if (!TELEGRAM_API_KEY) {
      console.error('TELEGRAM_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'API key not configured' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Configuring Telegram webhook...');

    // Set webhook URL to the telegram-bot function
    const webhookUrl = `https://ufekkcirsznhrvqwwsyf.supabase.co/functions/v1/telegram-bot`;
    
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_API_KEY}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl })
    });
    
    const result = await response.json();
    console.log('Webhook setup result:', result);
    
    if (result.ok) {
      console.log('✅ Bot is now online and ready!');
      return new Response(JSON.stringify({
        success: true,
        message: 'Bot configured successfully and is now online!',
        webhook_url: webhookUrl
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      console.error('❌ Failed to configure webhook:', result);
      return new Response(JSON.stringify({
        success: false,
        error: result.description || 'Failed to configure webhook'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    console.error('Error configuring bot:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});