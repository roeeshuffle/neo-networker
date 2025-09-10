import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const AUTH_PASSWORD = "121212";

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
    if (!TELEGRAM_API_KEY) {
      console.error('TELEGRAM_API_KEY not set');
      return new Response(JSON.stringify({ error: 'Bot token not configured' }), { 
        status: 500, headers: corsHeaders 
      });
    }

    console.log('Polling Telegram for updates...');

    // Get updates with long polling
    const url = `https://api.telegram.org/bot${TELEGRAM_API_KEY}/getUpdates?timeout=10&limit=10`;
    const response = await fetch(url);
    const data = await response.json();

    console.log('Telegram response:', data);

    if (!data.ok) {
      console.error('Telegram API error:', data);
      return new Response(JSON.stringify({ 
        error: `Telegram error: ${data.description}`,
        code: data.error_code 
      }), { 
        status: 400, headers: corsHeaders 
      });
    }

    const updates = data.result || [];
    console.log(`Processing ${updates.length} updates`);

    let processed = 0;
    for (const update of updates) {
      if (update.message && update.message.text) {
        await processMessage(update.message);
        processed++;
      }
    }

    // Mark updates as processed by getting them again with offset
    if (updates.length > 0) {
      const lastUpdateId = updates[updates.length - 1].update_id;
      await fetch(`https://api.telegram.org/bot${TELEGRAM_API_KEY}/getUpdates?offset=${lastUpdateId + 1}&limit=1`);
    }

    return new Response(JSON.stringify({ 
      success: true,
      processed: processed,
      total_updates: updates.length
    }), { headers: corsHeaders });

  } catch (error) {
    console.error('Error in telegram poll:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, headers: corsHeaders 
    });
  }
});

async function processMessage(message: any) {
  const chatId = message.chat.id;
  const text = message.text.trim();
  const userId = message.from.id;
  const userInfo = message.from;

  console.log(`Processing message from ${userId}: "${text}"`);

  try {
    // Get user auth status
    const { data: user } = await supabase
      .from('telegram_users')
      .select('is_authenticated, current_state, state_data')
      .eq('telegram_id', userId)
      .maybeSingle();

    const isAuth = user?.is_authenticated || false;
    const currentState = user?.current_state || 'idle';
    const stateData = user?.state_data || {};

    if (text === '/start') {
      if (isAuth) {
        await sendMessage(chatId, 
          "✅ Welcome back! You're already authenticated.\n\n" +
          "💡 Just type anything to search!\n" +
          "Example: 'fintech', 'Google', 'Sarah'\n\n" +
          "Commands:\n" +
          "/search - Search people\n" +
          "/add - Add new person\n" +
          "/help - Show help"
        );
      } else {
        await sendMessage(chatId, 
          "🤖 Welcome to VC Search Bot!\n\n" +
          "🔐 Enter password to access:"
        );
        await updateUserState(userId, 'authenticating', {});
      }
    } else if (text === '/help') {
      if (!isAuth) {
        await sendMessage(chatId, "🔐 Please authenticate first with /start");
        return;
      }
      await sendMessage(chatId,
        "🤖 VC Search Bot Help:\n\n" +
        "💡 Quick Search: Just type anything\n" +
        "Examples: 'ai', 'startup', 'Google'\n\n" +
        "Commands:\n" +
        "/search - Search mode\n" +
        "/add - Add new person\n" +
        "/cancel - Cancel operation"
      );
    } else if (text === '/search') {
      if (!isAuth) {
        await sendMessage(chatId, "🔐 Please authenticate first with /start");
        return;
      }
      await sendMessage(chatId, "🔍 What do you want to search for?");
      await updateUserState(userId, 'searching', {});
    } else if (text === '/add') {
      if (!isAuth) {
        await sendMessage(chatId, "🔐 Please authenticate first with /start");
        return;
      }
      await sendMessage(chatId, "➕ What's the person's full name?");
      await updateUserState(userId, 'adding', { step: 'name', data: {} });
    } else if (text === '/cancel') {
      await updateUserState(userId, 'idle', {});
      await sendMessage(chatId, "❌ Cancelled. Type /help for commands.");
    } else {
      // Handle based on current state
      if (currentState === 'authenticating') {
        await handleAuth(chatId, text, userId, userInfo);
      } else if (currentState === 'searching') {
        if (!isAuth) {
          await sendMessage(chatId, "🔐 Please authenticate first with /start");
          return;
        }
        await handleSearch(chatId, text);
        await updateUserState(userId, 'idle', {});
      } else if (currentState === 'adding') {
        if (!isAuth) {
          await sendMessage(chatId, "🔐 Please authenticate first with /start");
          return;
        }
        await handleAddPerson(chatId, text, stateData, userId);
      } else {
        // Default: search if authenticated
        if (isAuth) {
          await handleSearch(chatId, text);
        } else {
          await sendMessage(chatId, "🔐 Please authenticate first with /start");
        }
      }
    }
  } catch (error) {
    console.error('Error processing message:', error);
  }
}

async function sendMessage(chatId: number, text: string) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_API_KEY}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
    });
    console.log(`✅ Sent: ${text.substring(0, 30)}...`);
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

async function updateUserState(telegramId: number, state: string, stateData: any) {
  try {
    await supabase
      .from('telegram_users')
      .upsert({
        telegram_id: telegramId,
        current_state: state,
        state_data: stateData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'telegram_id'
      });
    console.log(`Updated user ${telegramId} state: ${state}`);
  } catch (error) {
    console.error('Error updating user state:', error);
  }
}

async function handleAuth(chatId: number, password: string, telegramId: number, userInfo: any) {
  if (password === AUTH_PASSWORD) {
    try {
      await supabase
        .from('telegram_users')
        .upsert({
          telegram_id: telegramId,
          telegram_username: userInfo.username || null,
          first_name: userInfo.first_name || null,
          is_authenticated: true,
          authenticated_at: new Date().toISOString(),
          current_state: 'idle'
        }, {
          onConflict: 'telegram_id'
        });

      await sendMessage(chatId, 
        "✅ Authentication successful!\n\n" +
        "💡 Now just type anything to search!\n" +
        "Examples: 'fintech', 'Google', 'ai startup'\n\n" +
        "Type /help for all commands."
      );
    } catch (error) {
      console.error('Auth error:', error);
      await sendMessage(chatId, "❌ Authentication failed. Try /start again.");
    }
  } else {
    await sendMessage(chatId, "❌ Wrong password. Try again or /start to restart.");
  }
}

async function handleSearch(chatId: number, query: string) {
  try {
    const searchTerm = query.toLowerCase();
    
    const { data: people, error } = await supabase
      .from('people')
      .select('*')
      .or(`full_name.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%,categories.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .limit(5);

    if (error) {
      console.error('Search error:', error);
      await sendMessage(chatId, "❌ Search failed. Try again.");
      return;
    }

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
      response += '\n';
    });

    await sendMessage(chatId, response);
  } catch (error) {
    console.error('Search error:', error);
    await sendMessage(chatId, "❌ Search error occurred.");
  }
}

async function handleAddPerson(chatId: number, text: string, stateData: any, userId: number) {
  const step = stateData.step;
  const data = stateData.data || {};

  switch (step) {
    case 'name':
      data.full_name = text;
      await sendMessage(chatId, "📧 Email address? (or 'skip')");
      await updateUserState(userId, 'adding', { step: 'email', data });
      break;

    case 'email':
      data.email = text.toLowerCase() === 'skip' ? null : text;
      await sendMessage(chatId, "🏢 Company? (or 'skip')");
      await updateUserState(userId, 'adding', { step: 'company', data });
      break;

    case 'company':
      data.company = text.toLowerCase() === 'skip' ? null : text;
      
      // Save to database
      try {
        const { error } = await supabase
          .from('people')
          .insert([data]);

        if (error) {
          console.error('Insert error:', error);
          await sendMessage(chatId, "❌ Failed to save person.");
        } else {
          await sendMessage(chatId, 
            `✅ Added <b>${data.full_name}</b> successfully!\n\n` +
            "Type /add for another or just search normally."
          );
        }
      } catch (error) {
        console.error('Save error:', error);
        await sendMessage(chatId, "❌ Database error occurred.");
      }

      await updateUserState(userId, 'idle', {});
      break;

    default:
      await updateUserState(userId, 'idle', {});
      await sendMessage(chatId, "❌ Error occurred. Type /help for commands.");
  }
}