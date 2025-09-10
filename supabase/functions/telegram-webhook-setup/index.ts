import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, webhook_url, chat_id, message } = await req.json();
    
    if (!TELEGRAM_API_KEY) {
      throw new Error('TELEGRAM_API_KEY not configured');
    }

    if (action === 'setup') {
      const url = `https://api.telegram.org/bot${TELEGRAM_API_KEY}/setWebhook`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhook_url
        })
      });
      
      const result = await response.json();
      console.log('Webhook setup result:', result);
      return new Response(JSON.stringify(result), { headers: corsHeaders });
      
    } else if (action === 'status') {
      const url = `https://api.telegram.org/bot${TELEGRAM_API_KEY}/getWebhookInfo`;
      const response = await fetch(url);
      const result = await response.json();
      console.log('Webhook status:', result);
      return new Response(JSON.stringify(result), { headers: corsHeaders });
      
    } else if (action === 'send') {
      const url = `https://api.telegram.org/bot${TELEGRAM_API_KEY}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chat_id,
          text: message
        })
      });
      
      const result = await response.json();
      console.log('Send message result:', result);
      return new Response(JSON.stringify(result), { headers: corsHeaders });
    }

    throw new Error('Invalid action');
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});