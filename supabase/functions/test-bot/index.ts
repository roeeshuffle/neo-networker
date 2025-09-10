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
    console.log('Testing bot with API key:', TELEGRAM_API_KEY ? 'Key exists' : 'No key found');
    
    if (!TELEGRAM_API_KEY) {
      return new Response(JSON.stringify({ 
        error: 'No TELEGRAM_API_KEY found in environment',
        success: false 
      }), { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    console.log('Making request to Telegram API...');
    
    // Test the bot token by getting bot info
    const botInfoResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_API_KEY}/getMe`);
    const botInfoData = await botInfoResponse.json();
    
    console.log('Bot info response:', JSON.stringify(botInfoData, null, 2));
    
    if (!botInfoData.ok) {
      return new Response(JSON.stringify({ 
        success: false,
        error: `Invalid bot token: ${botInfoData.description}`,
        telegram_error: botInfoData
      }), { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Get updates
    const updatesResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_API_KEY}/getUpdates`);
    const updatesData = await updatesResponse.json();
    
    console.log('Updates response:', JSON.stringify(updatesData, null, 2));

    return new Response(JSON.stringify({ 
      success: true,
      bot_info: botInfoData.result,
      recent_updates: updatesData.result?.slice(-3) || [],
      total_updates: updatesData.result?.length || 0,
      message: 'Bot is working! Check the logs for details.'
    }), { 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('Error testing bot:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      stack: error.stack
    }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});