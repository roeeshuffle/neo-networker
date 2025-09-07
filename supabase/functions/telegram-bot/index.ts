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

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
  };
}

interface UserSession {
  state: 'idle' | 'adding_person' | 'searching' | 'authenticating';
  step?: string;
  data?: any;
}
const AUTH_PASSWORD = "121212";

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const update: TelegramUpdate = await req.json();
    console.log('Received update:', JSON.stringify(update, null, 2));

    if (!update.message || !update.message.text) {
      return new Response('OK', { headers: corsHeaders });
    }

    const message = update.message;
    const chatId = message.chat.id;
    const text = message.text.trim();
    const userId = message.from.id;

    // Get user session from database
    console.log(`Processing message from user ${userId}: "${text}"`);
    const { data: user } = await supabase
      .from('telegram_users')
      .select('current_state, state_data, is_authenticated')
      .eq('telegram_id', userId)
      .single();

    console.log(`User state from DB:`, user);
    
    let session = {
      state: user?.current_state || 'idle',
      step: user?.state_data?.step,
      data: user?.state_data?.data || {}
    };

    if (text === '/start') {
      // Check if user is already authenticated
      const isAuth = await checkUserAuthentication(userId);
      if (isAuth) {
        await updateUserState(userId, 'idle', {});
        await setCommands(chatId);
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
        return new Response('OK', { headers: corsHeaders });
      }
      await sendMessage(chatId,
        "VC Search Engine Bot Commands:\n\n" +
        "💡 <b>Quick Search:</b> Just type anything to search!\n" +
        "Example: 'fintech', 'Sarah', 'Sequoia'\n\n" +
        "🔍 /search - Search for people (same as typing directly)\n" +
        "➕ /add - Add a new person to the database\n" +
        "❌ /cancel - Cancel current operation\n\n" +
        "Simply type your search query or use commands!"
      );
    } else if (text === '/search') {
      if (!await checkUserAuthentication(userId)) {
        await sendMessage(chatId, "🔐 Please authenticate first using /start");
        return new Response('OK', { headers: corsHeaders });
      }
      await updateUserState(userId, 'searching', {});
      await sendMessage(chatId, "🔍 What would you like to search for? (name, company, hashtag, or specialty)");
    } else if (text === '/add') {
      if (!await checkUserAuthentication(userId)) {
        await sendMessage(chatId, "🔐 Please authenticate first using /start");
        return new Response('OK', { headers: corsHeaders });
      }
      await updateUserState(userId, 'adding_person', { step: 'name', data: {} });
      await sendMessage(chatId, "➕ Let's add a new person! What's their full name?");
    } else if (text === '/cancel') {
      await updateUserState(userId, 'idle', {});
      await sendMessage(chatId, "❌ Operation cancelled. Type /help to see available commands.");
      } else {
        // Handle conversation flows and regular messages
        console.log(`Current session state: ${session.state}`);
        if (session.state === 'authenticating') {
          console.log(`User ${userId} attempting authentication with: ${text}`);
          await handleAuthentication(chatId, text, userId, message.from);
          await updateUserState(userId, 'idle', {});
        } else if (session.state === 'searching') {
          if (!await checkUserAuthentication(userId)) {
            await sendMessage(chatId, "🔐 Please authenticate first using /start");
            return new Response('OK', { headers: corsHeaders });
          }
          await handleSearch(chatId, text);
          await updateUserState(userId, 'idle', {});
        } else if (session.state === 'adding_person') {
          if (!await checkUserAuthentication(userId)) {
            await sendMessage(chatId, "🔐 Please authenticate first using /start");
            return new Response('OK', { headers: corsHeaders });
          }
          await handleAddPerson(chatId, text, session, userId);
        } else {
          // For authenticated users, treat any regular message as a search
          if (await checkUserAuthentication(userId)) {
            await handleSearch(chatId, text);
          } else {
            await sendMessage(chatId, "🔐 Please authenticate first using /start");
          }
        }
      }

    return new Response('OK', { headers: corsHeaders });
  } catch (error) {
    console.error('Error processing update:', error);
    return new Response('Error', { status: 500, headers: corsHeaders });
  }
});

async function sendMessage(chatId: number, text: string) {
  if (!TELEGRAM_API_KEY) {
    console.error('TELEGRAM_API_KEY not set');
    return;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_API_KEY}/sendMessage`;
  
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
    });
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

async function setCommands(chatId: number) {
  if (!TELEGRAM_API_KEY) {
    console.error('TELEGRAM_API_KEY not set');
    return;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_API_KEY}/setMyCommands`;
  
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commands: [
          { command: 'start', description: 'Start the bot and authenticate' },
          { command: 'search', description: 'Search for people in database' },
          { command: 'add', description: 'Add a new person to database' },
          { command: 'help', description: 'Show help information' },
          { command: 'cancel', description: 'Cancel current operation' }
        ]
      })
    });
  } catch (error) {
    console.error('Error setting commands:', error);
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
    // First get the current user to preserve authentication status
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
        // Preserve existing authentication status
        is_authenticated: currentUser?.is_authenticated || false
      }, {
        onConflict: 'telegram_id'
      });
    console.log(`Updated user ${telegramId} state to: ${state}, auth status preserved`);
  } catch (error) {
    console.error('Error updating user state:', error);
  }
}

async function handleAuthentication(chatId: number, password: string, telegramId: number, userInfo: any) {
  if (password === AUTH_PASSWORD) {
    try {
      // Insert or update user in telegram_users table
      const { error } = await supabase
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

      if (error) {
        console.error('Authentication error:', error);
        await sendMessage(chatId, "❌ Authentication failed. Please try again with /start");
        return;
      }

      await setCommands(chatId);
        await sendMessage(chatId, 
          "✅ Authentication successful! Welcome to VC Search Engine!\n\n" +
          "💡 <b>You can now just type anything to search!</b>\n" +
          "Example: 'ai engineer', 'Google', 'fintech'\n\n" +
          "Commands:\n" +
          "🔍 /search - Search people (optional)\n" +
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
      await sendMessage(chatId, "❌ Error searching database. Please try again.");
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
      if (person.poc_in_apex) response += `   👥 POC in APEX: ${person.poc_in_apex}\n`;
      if (person.who_warm_intro) response += `   🤝 Warm Intro: ${person.who_warm_intro}\n`;
      if (person.linkedin_profile) response += `   🔗 LinkedIn: ${person.linkedin_profile}\n`;
      if (person.newsletter) response += `   📰 Newsletter: ✅\n`;
      if (person.should_avishag_meet) response += `   👩‍💼 Should Avishag Meet: ✅\n`;
      response += '\n';
    });

    await sendMessage(chatId, response);
  } catch (error) {
    console.error('Search error:', error);
    await sendMessage(chatId, "❌ Error performing search. Please try again.");
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
      await sendMessage(chatId, "👔 What company do they work for? (or type 'skip')");
      break;

    case 'company':
      session.data.company = text.toLowerCase() === 'skip' ? null : text;
      session.step = 'categories';
      await updateUserState(userId, 'adding_person', { ...session });
      await sendMessage(chatId, "🏷️ What categories/tags describe them? (comma-separated, or type 'skip')");
      break;

    case 'categories':
      session.data.categories = text.toLowerCase() === 'skip' ? null : text;
      session.step = 'status';
      await updateUserState(userId, 'adding_person', { ...session });
      await sendMessage(chatId, "📊 What's their status? (or type 'skip')");
      break;

    case 'status':
      session.data.status = text.toLowerCase() === 'skip' ? null : text;
      session.step = 'linkedin';
      await updateUserState(userId, 'adding_person', { ...session });
      await sendMessage(chatId, "🔗 What's their LinkedIn profile URL? (or type 'skip')");
      break;

    case 'linkedin':
      session.data.linkedin_profile = text.toLowerCase() === 'skip' ? null : text;
      session.step = 'poc_apex';
      await updateUserState(userId, 'adding_person', { ...session });
      await sendMessage(chatId, "👥 Who is the POC in APEX? (or type 'skip')");
      break;

    case 'poc_apex':
      session.data.poc_in_apex = text.toLowerCase() === 'skip' ? null : text;
      session.step = 'warm_intro';
      await updateUserState(userId, 'adding_person', { ...session });
      await sendMessage(chatId, "🤝 Who can provide a warm intro? (or type 'skip')");
      break;

    case 'warm_intro':
      session.data.who_warm_intro = text.toLowerCase() === 'skip' ? null : text;
      session.step = 'more_info';
      await updateUserState(userId, 'adding_person', { ...session });
      await sendMessage(chatId, "📝 Any additional information? (or type 'skip')");
      break;

    case 'more_info':
      session.data.more_info = text.toLowerCase() === 'skip' ? null : text;
      
      // Save to database
      try {
        const { error } = await supabase
          .from('people')
          .insert([session.data]);

        if (error) {
          console.error('Insert error:', error);
          await sendMessage(chatId, "❌ Error saving person to database. Please try again.");
        } else {
          await sendMessage(chatId, 
            `✅ Successfully added <b>${session.data.full_name}</b> to the database!\n\n` +
            "Type /add to add another person or /search to find people."
          );
        }
      } catch (error) {
        console.error('Save error:', error);
        await sendMessage(chatId, "❌ Error saving to database. Please try again.");
      }

      // Reset session
      await updateUserState(userId, 'idle', {});
      break;

    default:
      await updateUserState(userId, 'idle', {});
      await sendMessage(chatId, "❌ Something went wrong. Type /help to see available commands.");
  }
}