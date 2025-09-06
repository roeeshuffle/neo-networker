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

const userSessions = new Map<number, UserSession>();
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

    // Get or create user session
    let session = userSessions.get(userId) || { state: 'idle' };

    if (text === '/start') {
      // Check if user is already authenticated
      const isAuth = await checkUserAuthentication(userId);
      if (isAuth) {
        session = { state: 'idle' };
        userSessions.set(userId, session);
        await setCommands(chatId);
        await sendMessage(chatId, 
          "Welcome back to VC Search Engine Bot! 🚀\n\n" +
          "You are authenticated and ready to use the bot.\n\n" +
          "Commands:\n" +
          "🔍 /search - Search people in database\n" +
          "➕ /add - Add a new person\n" +
          "❓ /help - Show this help message"
        );
      } else {
        session = { state: 'authenticating' };
        userSessions.set(userId, session);
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
        "🔍 /search - Search for people by name, company, hashtags, or specialties\n" +
        "➕ /add - Add a new person to the database\n" +
        "❌ /cancel - Cancel current operation\n\n" +
        "Simply type your search query after /search, or follow the prompts after /add!"
      );
    } else if (text === '/search') {
      if (!await checkUserAuthentication(userId)) {
        await sendMessage(chatId, "🔐 Please authenticate first using /start");
        return new Response('OK', { headers: corsHeaders });
      }
      session = { state: 'searching' };
      userSessions.set(userId, session);
      await sendMessage(chatId, "🔍 What would you like to search for? (name, company, hashtag, or specialty)");
    } else if (text === '/add') {
      if (!await checkUserAuthentication(userId)) {
        await sendMessage(chatId, "🔐 Please authenticate first using /start");
        return new Response('OK', { headers: corsHeaders });
      }
      session = { 
        state: 'adding_person', 
        step: 'name',
        data: {}
      };
      userSessions.set(userId, session);
      await sendMessage(chatId, "➕ Let's add a new person! What's their full name?");
    } else if (text === '/cancel') {
      session = { state: 'idle' };
      userSessions.set(userId, session);
      await sendMessage(chatId, "❌ Operation cancelled. Type /help to see available commands.");
    } else {
      // Handle conversation flows
      if (session.state === 'authenticating') {
        await handleAuthentication(chatId, text, userId, message.from);
        session = { state: 'idle' };
        userSessions.set(userId, session);
      } else if (session.state === 'searching') {
        if (!await checkUserAuthentication(userId)) {
          await sendMessage(chatId, "🔐 Please authenticate first using /start");
          return new Response('OK', { headers: corsHeaders });
        }
        await handleSearch(chatId, text);
        session = { state: 'idle' };
        userSessions.set(userId, session);
      } else if (session.state === 'adding_person') {
        if (!await checkUserAuthentication(userId)) {
          await sendMessage(chatId, "🔐 Please authenticate first using /start");
          return new Response('OK', { headers: corsHeaders });
        }
        await handleAddPerson(chatId, text, session);
        userSessions.set(userId, session);
      } else {
        await sendMessage(chatId, "I don't understand. Type /help to see available commands.");
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
        "You can now use:\n" +
        "🔍 /search - Search people in database\n" +
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
      .or(`full_name.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%,career_history.ilike.%${searchTerm}%`)
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
      if (person.hashtags && person.hashtags.length) {
        response += `   🏷️ ${person.hashtags.map((tag: string) => `#${tag}`).join(' ')}\n`;
      }
      if (person.professional_specialties && person.professional_specialties.length) {
        response += `   💼 ${person.professional_specialties.join(', ')}\n`;
      }
      response += '\n';
    });

    await sendMessage(chatId, response);
  } catch (error) {
    console.error('Search error:', error);
    await sendMessage(chatId, "❌ Error performing search. Please try again.");
  }
}

async function handleAddPerson(chatId: number, text: string, session: UserSession) {
  if (!session.data) session.data = {};

  switch (session.step) {
    case 'name':
      session.data.full_name = text;
      session.step = 'company';
      await sendMessage(chatId, "👔 What company do they work for? (or type 'skip')");
      break;

    case 'company':
      session.data.company = text.toLowerCase() === 'skip' ? null : text;
      session.step = 'career';
      await sendMessage(chatId, "📈 Tell me about their career history: (or type 'skip')");
      break;

    case 'career':
      session.data.career_history = text.toLowerCase() === 'skip' ? null : text;
      session.step = 'specialties';
      await sendMessage(chatId, "🎯 What are their professional specialties? (comma-separated, or type 'skip')");
      break;

    case 'specialties':
      if (text.toLowerCase() !== 'skip') {
        session.data.professional_specialties = text.split(',').map((s: string) => s.trim());
      }
      session.step = 'hashtags';
      await sendMessage(chatId, "🏷️ What hashtags describe them? (comma-separated, or type 'skip')");
      break;

    case 'hashtags':
      if (text.toLowerCase() !== 'skip') {
        session.data.hashtags = text.split(',').map((h: string) => h.trim().replace(/^#/, ''));
      }
      session.step = 'notes';
      await sendMessage(chatId, "📝 Any additional notes? (or type 'skip')");
      break;

    case 'notes':
      session.data.notes = text.toLowerCase() === 'skip' ? null : text;
      
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
      session.state = 'idle';
      session.step = undefined;
      session.data = {};
      break;

    default:
      session.state = 'idle';
      await sendMessage(chatId, "❌ Something went wrong. Type /help to see available commands.");
  }
}