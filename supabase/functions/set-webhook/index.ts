import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');

serve(async (req) => {
  try {
    if (!TELEGRAM_API_KEY) {
      throw new Error('TELEGRAM_API_KEY not configured');
    }

    // Set webhook to the telegram-bot function
    const webhookUrl = `https://ufekkcirsznhrvqwwsyf.supabase.co/functions/v1/telegram-bot`;
    
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_API_KEY}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl
      })
    });
    
    const result = await response.json();
    console.log('Webhook setup result:', result);
    
    return new Response(JSON.stringify({
      success: true,
      webhook_url: webhookUrl,
      telegram_response: result
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error setting webhook:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});