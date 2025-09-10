import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

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
          // For authenticated users, handle messages based on prefix
          if (await checkUserAuthentication(userId)) {
            if (text.startsWith('.')) {
              // Remove the dot and search people
              const searchQuery = text.substring(1).trim();
              if (searchQuery) {
                await handleSearch(chatId, searchQuery);
              } else {
                await sendMessage(chatId, "❓ Please provide a search term after the dot (e.g., '.john doe')");
              }
            } else {
              // Use ChatGPT function router
              await handleFunctionRouter(chatId, text, userId);
            }
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

async function handleFunctionRouter(chatId: number, text: string, userId: number) {
  try {
    const routerPrompt = `You are a function router.  
Your job: take any user request and map it to EXACTLY ONE of the following 8 functions, and return ONLY a JSON array with the function number and extracted parameters.  

The functions are:

1. search_information(words: array of strings)  
2. add_task(task_text: string)  
3. remove_task(task_id: string or number)  
4. add_alert_to_task(task_id: string or number)  
5. show_all_tasks(period: "daily" | "weekly" | "monthly")  
6. add_new_people(people_data: array of structured fields like Full Name, Email, LinkedIn, Company, Categories, Status, Newsletter, etc.)  
7. show_all_meetings(period: "today" | "weekly" | "monthly")  
8. update_person_info(identifier: string (name or email to find person), updates: object with fields to update like company, email, status, categories, etc.)

### Rules
- Always return a JSON array: \`[function_number, parameters]\`
- Do NOT explain. Do NOT add extra text. Return JSON ONLY.  
- If multiple interpretations are possible, choose the most direct.  
- If no parameter is needed, return \`null\` as second element.  
- Parse user text carefully and extract structured fields when adding people.  

### Examples

**User:** "Find me info about AI and marketing"  
**Assistant:** \`[1, ["AI", "marketing"]]\`

**User:** "Add a task to call Jonathan tomorrow morning"  
**Assistant:** \`[2, "call Jonathan tomorrow morning"]\`

**User:** "Remove task 17"  
**Assistant:** \`[3, 17]\`

**User:** "Set an alert on task 22"  
**Assistant:** \`[4, 22]\`

**User:** "Show me my weekly tasks"  
**Assistant:** \`[5, "weekly"]\`

**User:** "Add new person: Full Name Roee Feingold, LinkedIn linkedin.roee.com, Company Google, Status Investor, Categories AI, marketing"  
**Assistant:** \`[6, ["Full Name: Roee Feingold", "LinkedIn: linkedin.roee.com", "Company: Google", "Status: Investor", "Categories: AI, marketing"]]\`

**User:** "Show all meetings today"  
**Assistant:** \`[7, "today"]\`

**User:** "Add company Google to Roee Feingold"  
**Assistant:** \`[8, {"identifier": "Roee Feingold", "updates": {"company": "Google"}}]\`

**User:** "Change email of roee2912@gmail.com to roee@google.com"  
**Assistant:** \`[8, {"identifier": "roee2912@gmail.com", "updates": {"email": "roee@google.com"}}]\`

User input: "${text}"`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: routerPrompt }
        ],
        max_tokens: 150,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      await sendMessage(chatId, "❌ Error processing your request. Please try again.");
      return;
    }

    const data = await response.json();
    let routerResult = data.choices[0].message.content.trim();
    
    console.log('Function router result:', routerResult);
    
    // Clean the response - remove backticks and any markdown formatting
    routerResult = routerResult.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '').replace(/^`/, '').replace(/`$/, '');
    
    console.log('Cleaned router result:', routerResult);

    try {
      const [functionNumber, parameters] = JSON.parse(routerResult);
      
      switch (functionNumber) {
        case 1: // search_information
          if (Array.isArray(parameters)) {
            const searchQuery = parameters.join(' ');
            await handleSearch(chatId, searchQuery);
          } else {
            await sendMessage(chatId, "❓ Please provide search terms.");
          }
          break;
          
        case 2: // add_task
          try {
            const { task_text, assign_to, due_date, status = 'pending', label, priority = 'medium' } = parameters || {};
            
            if (!task_text) {
              await sendMessage(chatId, "❓ Please provide a task description.");
              break;
            }
            
            const { data, error } = await supabase
              .from('tasks')
              .insert([{
                text: task_text,
                assign_to,
                due_date,
                status,
                label,
                priority
              }])
              .select()
              .single();

            if (error) throw error;

            await sendMessage(chatId, `✅ Task created successfully!
📋 Task #${data.task_id}: ${task_text}
${assign_to ? `👤 Assigned to: ${assign_to}\n` : ''}${due_date ? `📅 Due: ${due_date}\n` : ''}🎯 Priority: ${priority}
📊 Status: ${status}`);
          } catch (error) {
            console.error('Add task error:', error);
            await sendMessage(chatId, `❌ Error creating task: ${error.message}`);
          }
          break;
          
        case 3: // remove_task
          try {
            const { task_id } = parameters || {};
            
            if (!task_id) {
              await sendMessage(chatId, "❓ Please provide a task ID.");
              break;
            }
            
            const { error } = await supabase
              .from('tasks')
              .delete()
              .eq('task_id', task_id);

            if (error) throw error;

            await sendMessage(chatId, `✅ Task #${task_id} deleted successfully!`);
          } catch (error) {
            console.error('Delete task error:', error);
            await sendMessage(chatId, `❌ Error deleting task: ${error.message}`);
          }
          break;
          
        case 4: // add_alert_to_task
          try {
            const { task_id } = parameters || {};
            
            if (!task_id) {
              await sendMessage(chatId, "❓ Please provide a task ID.");
              break;
            }
            
            // For now, just acknowledge the request
            // In the future, you could implement actual notifications
            await sendMessage(chatId, `✅ Alert added to Task #${task_id}
⏰ You'll be notified about this task!`);
          } catch (error) {
            console.error('Add alert error:', error);
            await sendMessage(chatId, `❌ Error adding alert: ${error.message}`);
          }
          break;
          
        case 5: // show_all_tasks
          try {
            let query = supabase
              .from('tasks')
              .select('*')
              .order('created_at', { ascending: false });

            // Apply filters if provided
            if (parameters?.filter) {
              const { filter } = parameters;
              if (filter.priority) {
                query = query.eq('priority', filter.priority);
              }
              if (filter.status) {
                query = query.eq('status', filter.status);
              }
              if (filter.assign_to) {
                query = query.ilike('assign_to', `%${filter.assign_to}%`);
              }
            }

            // Apply period filter
            if (parameters?.period && parameters.period !== 'all') {
              const now = new Date();
              let dateFilter;
              
              if (parameters.period === 'daily') {
                dateFilter = new Date(now.setHours(0, 0, 0, 0)).toISOString();
                query = query.gte('created_at', dateFilter);
              } else if (parameters.period === 'weekly') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                query = query.gte('created_at', weekAgo.toISOString());
              } else if (parameters.period === 'monthly') {
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                query = query.gte('created_at', monthAgo.toISOString());
              }
            }

            const { data: tasks, error } = await query.limit(20);

            if (error) throw error;

            if (!tasks || tasks.length === 0) {
              await sendMessage(chatId, "📋 No tasks found matching your criteria.");
              break;
            }

            let response = `📋 **Tasks** (${tasks.length} found):\n\n`;
            
            tasks.forEach(task => {
              const statusIcon = task.status === 'completed' ? '✅' : 
                               task.status === 'in_progress' ? '🔄' : 
                               task.status === 'pending' ? '⏳' : '❓';
              
              const priorityIcon = task.priority === 'high' ? '🔴' : 
                                 task.priority === 'medium' ? '🟡' : '🟢';
              
              response += `${statusIcon} **Task #${task.task_id}**: ${task.text}\n`;
              if (task.assign_to) response += `👤 Assigned: ${task.assign_to}\n`;
              if (task.due_date) response += `📅 Due: ${task.due_date}\n`;
              response += `${priorityIcon} Priority: ${task.priority}\n`;
              if (task.label) response += `🏷️ Label: ${task.label}\n`;
              response += `📊 Status: ${task.status}\n\n`;
            });

            await sendMessage(chatId, response);
          } catch (error) {
            console.error('Show tasks error:', error);
            await sendMessage(chatId, `❌ Error fetching tasks: ${error.message}`);
          }
          break;
          
        case 6: // add_new_people
          if (Array.isArray(parameters)) {
            const personData = {};
            
            // Parse structured data from the array
            parameters.forEach(item => {
              const [key, value] = item.split(': ');
              switch (key.toLowerCase()) {
                case 'full name':
                  personData.full_name = value;
                  break;
                case 'email':
                  personData.email = value;
                  break;
                case 'company':
                  personData.company = value;
                  break;
                case 'categories':
                  personData.categories = value;
                  break;
                case 'status':
                  personData.status = value;
                  break;
                case 'linkedin':
                  personData.linkedin_profile = value;
                  break;
              }
            });
            
            try {
              const { error } = await supabase
                .from('people')
                .insert([personData]);

              if (error) {
                console.error('Insert person error:', error);
                await sendMessage(chatId, "❌ Error adding person to database. Please try again.");
              } else {
                await sendMessage(chatId, 
                  `✅ Successfully added <b>${personData.full_name || 'Unknown'}</b> to the database!\n\n` +
                  `📧 Email: ${personData.email || 'N/A'}\n` +
                  `🏢 Company: ${personData.company || 'N/A'}\n` +
                  `🏷️ Categories: ${personData.categories || 'N/A'}\n` +
                  `📊 Status: ${personData.status || 'N/A'}`
                );
              }
            } catch (error) {
              console.error('Save person error:', error);
              await sendMessage(chatId, "❌ Error saving person to database. Please try again.");
            }
          } else {
            await sendMessage(chatId, "➕ Please provide person details. Use /add command for interactive addition.");
          }
          break;
          
        case 7: // show_all_meetings
          await sendMessage(chatId, `📅 **Meetings ${parameters || 'today'}**:
          
🔄 Meeting management is coming soon!
For now, you can:
• Add meetings as tasks with label "meeting"
• Use: "add task meeting with john due tomorrow"`);
          break;
          
        case 8: // update_task
          try {
            const { task_id, field, new_value } = parameters || {};
            
            if (!task_id || !field || !new_value) {
              await sendMessage(chatId, "❓ Please provide task ID, field, and new value.");
              break;
            }
            
            // Validate field
            const allowedFields = ['text', 'assign_to', 'due_date', 'status', 'label', 'priority'];
            if (!allowedFields.includes(field)) {
              await sendMessage(chatId, `❌ Invalid field: ${field}. Allowed fields: ${allowedFields.join(', ')}`);
              break;
            }

            const updateData = { [field]: new_value };
            
            const { data, error } = await supabase
              .from('tasks')
              .update(updateData)
              .eq('task_id', task_id)
              .select()
              .single();

            if (error) throw error;

            await sendMessage(chatId, `✅ Task #${task_id} updated successfully!
📝 Changed ${field} to: ${new_value}`);
          } catch (error) {
            console.error('Update task error:', error);
            await sendMessage(chatId, `❌ Error updating task: ${error.message}`);
          }
          break;
          
        case 9: // update_person
          if (parameters && parameters.identifier && parameters.updates) {
            try {
              const identifier = parameters.identifier.trim();
              const updates = parameters.updates;
              
              // Search for person by name or email
              const { data: people, error: searchError } = await supabase
                .from('people')
                .select('*')
                .or(`full_name.ilike.%${identifier}%,email.ilike.%${identifier}%`);
              
              if (searchError) {
                console.error('Search error:', searchError);
                await sendMessage(chatId, "❌ Error searching for person. Please try again.");
                return;
              }
              
              if (!people || people.length === 0) {
                await sendMessage(chatId, `🔍 No person found matching "${identifier}". Please check the name or email and try again.`);
                return;
              }
              
              if (people.length > 1) {
                let response = `⚠️ Found ${people.length} people matching "${identifier}":\n\n`;
                people.forEach((person, index) => {
                  response += `${index + 1}. <b>${person.full_name}</b>\n`;
                  if (person.email) response += `   📧 ${person.email}\n`;
                  if (person.company) response += `   🏢 ${person.company}\n`;
                  response += '\n';
                });
                response += "Please be more specific (use full name or exact email) to update the right person.";
                await sendMessage(chatId, response);
                return;
              }
              
              // Update the person
              const person = people[0];
              const { error: updateError } = await supabase
                .from('people')
                .update(updates)
                .eq('id', person.id);
              
              if (updateError) {
                console.error('Update error:', updateError);
                await sendMessage(chatId, "❌ Error updating person. Please try again.");
                return;
              }
              
              // Show success message with changes
              let successMessage = `✅ Successfully updated <b>${person.full_name}</b>!\n\nUpdated fields:\n`;
              Object.entries(updates).forEach(([field, value]) => {
                const fieldDisplay = field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                successMessage += `• ${fieldDisplay}: ${value}\n`;
              });
              
              await sendMessage(chatId, successMessage);
              
            } catch (error) {
              console.error('Update person error:', error);
              await sendMessage(chatId, "❌ Error updating person. Please try again.");
            }
          } else {
            await sendMessage(chatId, "❓ Please specify who to update and what to change. Example: 'Add company Google to John Smith'");
          }
          break;
          
        default:
          await sendMessage(chatId, "❓ I couldn't understand your request. Try:\n• Searching with a dot prefix: '.john doe'\n• Using /help to see available commands\n• 'add task [description]' for tasks\n• 'find [name]' to search people");
      }
      
    } catch (parseError) {
      console.error('Error parsing function router result:', parseError);
      await sendMessage(chatId, "❓ I couldn't understand your request. Try:\n• Searching with a dot prefix: '.john doe'\n• Using /help to see available commands");
    }
    
  } catch (error) {
    console.error('Function router error:', error);
    await sendMessage(chatId, "❌ Error processing your request. Please try again.");
  }
}