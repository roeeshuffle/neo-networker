import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const AUTH_PASSWORD = "121212";

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!TELEGRAM_API_KEY) {
      throw new Error('TELEGRAM_API_KEY not configured');
    }

    console.log('Starting telegram polling...');
    
    // Get updates from Telegram
    const updatesResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_API_KEY}/getUpdates?timeout=30`);
    const updatesData = await updatesResponse.json();
    
    if (!updatesData.ok) {
      console.error('Failed to get updates:', updatesData);
      return new Response('Failed to get updates', { status: 500, headers: corsHeaders });
    }

    const updates = updatesData.result;
    console.log(`Received ${updates.length} updates`);

    // Process each update
    for (const update of updates) {
      await processUpdate(update);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      processed: updates.length 
    }), { headers: corsHeaders });

  } catch (error) {
    console.error('Error in telegram polling:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});

async function processUpdate(update: any) {
  try {
    if (!update.message || !update.message.text) {
      return;
    }

    const message = update.message;
    const chatId = message.chat.id;
    const text = message.text.trim();
    const userId = message.from.id;

    console.log(`Processing message from user ${userId}: "${text}"`);

    // Get user session from database
    const { data: user } = await supabase
      .from('telegram_users')
      .select('current_state, state_data, is_authenticated')
      .eq('telegram_id', userId)
      .single();

    let session = {
      state: user?.current_state || 'idle',
      step: user?.state_data?.step,
      data: user?.state_data?.data || {}
    };

    if (text === '/start') {
      const isAuth = await checkUserAuthentication(userId);
      if (isAuth) {
        await updateUserState(userId, 'idle', {});
        await sendMessage(chatId, 
          "Welcome back to VC Search Engine Bot! 🚀\n\n" +
          "You are authenticated and ready to use the bot.\n\n" +
          "💡 Just type anything to search the database!\n\n" +
          "Commands:\n" +
          "🔍 /search - Search people in database\n" +
          "➕ /add - Add a new person\n" +
          "❓ /help - Show this help message"
        );
      } else {
        await updateUserState(userId, 'authenticating', {});
        await sendMessage(chatId, 
          "Welcome to VC Search Engine Bot! 🚀\n\n" +
          "🔐 Please enter the password to access the system:"
        );
      }
    } else if (text === '/help') {
      if (!await checkUserAuthentication(userId)) {
        await sendMessage(chatId, "🔐 Please authenticate first using /start");
        return;
      }
      await sendMessage(chatId,
        "VC Search Engine Bot Commands:\n\n" +
        "💡 <b>Quick Search:</b> Just type anything to search!\n" +
        "Example: 'fintech', 'Sarah', 'Sequoia'\n\n" +
        "🔍 /search - Search for people\n" +
        "➕ /add - Add a new person to the database\n" +
        "❌ /cancel - Cancel current operation\n\n" +
        "Simply type your search query!"
      );
    } else if (text === '/search') {
      if (!await checkUserAuthentication(userId)) {
        await sendMessage(chatId, "🔐 Please authenticate first using /start");
        return;
      }
      await updateUserState(userId, 'searching', {});
      await sendMessage(chatId, "🔍 What would you like to search for?");
    } else if (text === '/add') {
      if (!await checkUserAuthentication(userId)) {
        await sendMessage(chatId, "🔐 Please authenticate first using /start");
        return;
      }
      await updateUserState(userId, 'adding_person', { step: 'name', data: {} });
      await sendMessage(chatId, "➕ Let's add a new person! What's their full name?");
    } else if (text === '/cancel') {
      await updateUserState(userId, 'idle', {});
      await sendMessage(chatId, "❌ Operation cancelled.");
    } else {
      // Handle conversation flows and regular messages
      if (session.state === 'authenticating') {
        await handleAuthentication(chatId, text, userId, message.from);
      } else if (session.state === 'searching') {
        if (!await checkUserAuthentication(userId)) {
          await sendMessage(chatId, "🔐 Please authenticate first using /start");
          return;
        }
        await handleSearch(chatId, text);
        await updateUserState(userId, 'idle', {});
      } else if (session.state === 'adding_person') {
        if (!await checkUserAuthentication(userId)) {
          await sendMessage(chatId, "🔐 Please authenticate first using /start");
          return;
        }
        await handleAddPerson(chatId, text, session, userId);
      } else {
        // For authenticated users, handle direct search
        if (await checkUserAuthentication(userId)) {
          if (text.startsWith('.')) {
            const searchQuery = text.substring(1).trim();
            if (searchQuery) {
              await handleSearch(chatId, searchQuery);
            } else {
              await sendMessage(chatId, "❓ Please provide a search term after the dot");
            }
          } else {
            // Direct search without dot
            await handleSearch(chatId, text);
          }
        } else {
          await sendMessage(chatId, "🔐 Please authenticate first using /start");
        }
      }
    }

  } catch (error) {
    console.error('Error processing update:', error);
  }
}

async function sendMessage(chatId: number, text: string) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_API_KEY}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
    });
    console.log(`Sent message to ${chatId}: ${text.substring(0, 50)}...`);
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

async function checkUserAuthentication(telegramId: number): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('telegram_users')
      .select('is_authenticated')
      .eq('telegram_id', telegramId)
      .eq('is_authenticated', true)
      .single();

    return !!data?.is_authenticated;
  } catch {
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
  } catch (error) {
    console.error('Error updating user state:', error);
  }
}

async function handleAuthentication(chatId: number, password: string, telegramId: number, userInfo: any) {
  if (password === AUTH_PASSWORD) {
    try {
      await supabase
        .from('telegram_users')
        .upsert({
          telegram_id: telegramId,
          telegram_username: userInfo.username || null,
          first_name: userInfo.first_name || null,
          is_authenticated: true,
          authenticated_at: new Date().toISOString()
        }, {
          onConflict: 'telegram_id'
        });

      await sendMessage(chatId, 
        "✅ Authentication successful! Welcome to VC Search Engine!\n\n" +
        "💡 <b>You can now just type anything to search!</b>\n" +
        "Example: 'ai engineer', 'Google', 'fintech'\n\n" +
        "Commands:\n" +
        "🔍 /search - Search people\n" +
        "➕ /add - Add a new person\n" +
        "❓ /help - Show help message"
      );
    } catch (error) {
      console.error('Database error:', error);
      await sendMessage(chatId, "❌ Authentication failed. Please try again with /start");
    }
  } else {
    await sendMessage(chatId, "❌ Incorrect password. Please try again or use /start to restart.");
  }
}

async function handleSearch(chatId: number, query: string) {
  try {
    const searchTerm = query.toLowerCase();
    
    const { data: people, error } = await supabase
      .from('people')
      .select('*')
      .or(`full_name.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%,categories.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,status.ilike.%${searchTerm}%,linkedin_profile.ilike.%${searchTerm}%,poc_in_apex.ilike.%${searchTerm}%,who_warm_intro.ilike.%${searchTerm}%,agenda.ilike.%${searchTerm}%,meeting_notes.ilike.%${searchTerm}%,more_info.ilike.%${searchTerm}%`)
      .limit(10);

    if (error) {
      console.error('Search error:', error);
      await sendMessage(chatId, "❌ Error searching database.");
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
      if (person.status) response += `   📊 Status: ${person.status}\n`;
      if (person.linkedin_profile) response += `   🔗 LinkedIn: ${person.linkedin_profile}\n`;
      response += '\n';
    });

    await sendMessage(chatId, response);
  } catch (error) {
    console.error('Search error:', error);
    await sendMessage(chatId, "❌ Error performing search.");
  }
}

async function handleAddPerson(chatId: number, text: string, session: any, userId: number) {
  if (!session.data) session.data = {};

  switch (session.step) {
    case 'name':
      session.data.full_name = text;
      session.step = 'email';
      await updateUserState(userId, 'adding_person', { ...session });
      await sendMessage(chatId, "📧 What's their email address? (or type 'skip')");
      break;

    case 'email':
      session.data.email = text.toLowerCase() === 'skip' ? null : text;
      session.step = 'company';
      await updateUserState(userId, 'adding_person', { ...session });
      await sendMessage(chatId, "🏢 What company do they work for? (or type 'skip')");
      break;

    case 'company':
      session.data.company = text.toLowerCase() === 'skip' ? null : text;
      
      // Save to database
      try {
        const { error } = await supabase
          .from('people')
          .insert([session.data]);

        if (error) {
          console.error('Insert error:', error);
          await sendMessage(chatId, "❌ Error saving person to database.");
        } else {
          await sendMessage(chatId, 
            `✅ Successfully added <b>${session.data.full_name}</b>!\n\n` +
            "Type /add to add another person or just type to search."
          );
        }
      } catch (error) {
        console.error('Save error:', error);
        await sendMessage(chatId, "❌ Error saving to database.");
      }

      // Reset session
      await updateUserState(userId, 'idle', {});
      break;

    default:
      await updateUserState(userId, 'idle', {});
      await sendMessage(chatId, "❌ Something went wrong. Type /help for commands.");
  }
}