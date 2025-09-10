import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, chatId, message, query } = await req.json();
    
    if (action === 'send_message') {
      await sendMessage(chatId, message);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (action === 'search_people') {
      const results = await searchPeople(query);
      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'get_updates') {
      const updates = await getUpdates();
      return new Response(JSON.stringify({ updates }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function sendMessage(chatId: string, text: string) {
  if (!TELEGRAM_API_KEY) {
    throw new Error('TELEGRAM_API_KEY not configured');
  }

  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_API_KEY}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    })
  });

  if (!response.ok) {
    throw new Error(`Telegram API error: ${response.statusText}`);
  }

  return await response.json();
}

async function getUpdates() {
  if (!TELEGRAM_API_KEY) {
    throw new Error('TELEGRAM_API_KEY not configured');
  }

  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_API_KEY}/getUpdates`);
  
  if (!response.ok) {
    throw new Error(`Telegram API error: ${response.statusText}`);
  }

  return await response.json();
}

async function searchPeople(query: string) {
  if (!query) return [];
  
  const searchTerm = query.toLowerCase();
  
  const { data: people, error } = await supabase
    .from('people')
    .select('*')
    .or(`full_name.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%,categories.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
    .limit(5);

  if (error) {
    console.error('Search error:', error);
    return [];
  }

  return people || [];
}