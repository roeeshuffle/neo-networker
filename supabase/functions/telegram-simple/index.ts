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

const AUTH_PASSWORD = "121212";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, chatId, message, query, telegramId, command } = await req.json();
    
    // Handle direct API calls from web interface
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

    // Handle bot commands with authentication
    if (action === 'handle_command') {
      await handleBotCommand(chatId, telegramId, command, message);
      return new Response(JSON.stringify({ success: true }), {
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

async function handleBotCommand(chatId: string, telegramId: number, command: string, message: string) {
  console.log(`Processing command: ${command} from user ${telegramId}`);
  
  if (command === '/start') {
    const isAuth = await checkUserAuthentication(telegramId);
    if (isAuth) {
      await updateUserState(telegramId, 'idle', {});
      await sendMessage(chatId, 
        "Welcome back to VC Search Engine Bot! 🚀\n\n" +
        "You are authenticated and ready to use the bot.\n\n" +
        "💡 Just type anything to search the database!\n\n" +
        "Commands:\n" +
        "🔍 Search - Just type a search term\n" +
        "➕ /add - Add a new person\n" +
        "❓ /help - Show help message"
      );
    } else {
      await updateUserState(telegramId, 'authenticating', {});
      await sendMessage(chatId, 
        "Welcome to VC Search Engine Bot! 🚀\n\n" +
        "🔐 Please enter the password to access the system:"
      );
    }
  } else if (command === 'authenticate') {
    await handleAuthentication(chatId, message, telegramId);
  } else if (command === 'search') {
    if (!await checkUserAuthentication(telegramId)) {
      await sendMessage(chatId, "🔐 Please authenticate first by typing /start");
      return;
    }
    const results = await searchPeople(message);
    await sendSearchResults(chatId, message, results);
  }
}

async function checkUserAuthentication(telegramId: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('telegram_users')
      .select('is_authenticated')
      .eq('telegram_id', telegramId)
      .eq('is_authenticated', true)
      .single();

    if (error || !data) {
      return false;
    }

    return data.is_authenticated;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

async function updateUserState(telegramId: number, state: string, stateData: any) {
  try {
    const { data: currentUser } = await supabase
      .from('telegram_users')
      .select('is_authenticated')
      .eq('telegram_id', telegramId)
      .single();

    await supabase
      .from('telegram_users')
      .upsert({
        telegram_id: telegramId,
        current_state: state,
        state_data: stateData,
        is_authenticated: currentUser?.is_authenticated || false
      }, {
        onConflict: 'telegram_id'
      });
    console.log(`Updated user ${telegramId} state to: ${state}`);
  } catch (error) {
    console.error('Error updating user state:', error);
  }
}

async function handleAuthentication(chatId: string, password: string, telegramId: number) {
  if (password === AUTH_PASSWORD) {
    try {
      const { error } = await supabase
        .from('telegram_users')
        .upsert({
          telegram_id: telegramId,
          is_authenticated: true,
          authenticated_at: new Date().toISOString(),
          current_state: 'idle'
        }, {
          onConflict: 'telegram_id'
        });

      if (error) {
        console.error('Authentication error:', error);
        await sendMessage(chatId, "❌ Authentication failed. Please try again with /start");
        return;
      }

      await sendMessage(chatId, 
        "✅ Authentication successful! Welcome to VC Search Engine!\n\n" +
        "💡 <b>You can now search by typing any term!</b>\n" +
        "Example: 'ai engineer', 'Google', 'fintech'\n\n" +
        "Commands:\n" +
        "🔍 Search - Just type your search term\n" +
        "➕ /add - Add a new person\n" +
        "❓ /help - Show help message"
      );
    } catch (error) {
      console.error('Database error:', error);
      await sendMessage(chatId, "❌ Authentication failed. Please try again with /start");
    }
  } else {
    await sendMessage(chatId, "❌ Incorrect password. Please try again.");
  }
}

async function sendSearchResults(chatId: string, query: string, people: any[]) {
  if (!people || people.length === 0) {
    await sendMessage(chatId, `🔍 No results found for "${query}"`);
    return;
  }

  let response = `🔍 Found ${people.length} result(s) for "<b>${query}</b>":\n\n`;
  
  people.forEach((person, index) => {
    response += `${index + 1}. <b>${person.full_name}</b>\n`;
    if (person.company) response += `   🏢 ${person.company}\n`;
    if (person.email) response += `   📧 ${person.email}\n`;
    if (person.categories) response += `   🏷️ ${person.categories}\n`;
    if (person.linkedin_profile) response += `   🔗 LinkedIn: ${person.linkedin_profile}\n`;
    response += '\n';
  });

  await sendMessage(chatId, response);
}