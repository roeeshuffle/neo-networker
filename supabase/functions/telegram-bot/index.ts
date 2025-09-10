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
  state: 'idle' | 'adding_person' | 'searching' | 'authenticating' | 'awaiting_email' | 'pending_update';
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
    const body = await req.json();
    
    // Handle webhook setup request
    if (body.action === 'setup_webhook') {
      return await setupWebhook(body.webhook_url);
    }
    
    const update: TelegramUpdate = body;
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
      .maybeSingle();

    console.log(`User state from DB:`, user);
    
    let session = {
      state: user?.current_state || 'idle',
      step: user?.state_data?.step,
      data: user?.state_data?.data || {}
    };

    if (text === '/start') {
      // Always reset user authentication and start fresh
      await resetUserAuthentication(userId);
      // The resetUserAuthentication already sets state to 'authenticating', no need to update again
      await sendMessage(chatId, 
        "Welcome to VC Search Engine Bot! 🚀\n\n" +
        "🔄 Starting fresh authentication process...\n\n" +
        "🔐 Please enter the password to access the system:"
      );
    } else if (text === '/help') {
      if (!await checkUserAuthentication(userId)) {
        await sendMessage(chatId, "🔐 Please authenticate first using /start");
        return new Response('OK', { headers: corsHeaders });
      }
      await sendMessage(chatId,
        "VC Search Engine Bot Commands:\n\n" +
        "💡 <b>Quick Search:</b> Just type anything to search!\n" +
        "Example: 'fintech', 'Sarah', 'Sequoia'\n\n" +
        "📝 <b>Tasks:</b> 'add task call John tomorrow', 'show all tasks', 'update task 5 status done'\n" +
        "👥 <b>People:</b> 'add John Doe from TechCorp', 'search ai engineer'\n\n" +
        "Commands:\n" +
        "🔍 /search - Search for people\n" +
        "➕ /add - Add a new person to the database\n" +
        "❌ /cancel - Cancel current operation\n\n" +
        "Simply type your request in natural language!"
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
        console.log(`User ${userId} attempting password authentication with: ${text}`);
        await handlePasswordAuthentication(chatId, text, userId, message.from);
      } else if (session.state === 'awaiting_email') {
        console.log(`User ${userId} providing email: ${text}`);
        await handleEmailAuthentication(chatId, text, userId, message.from);
      } else if (session.state === 'pending_update') {
        // Handle approval for task updates
        if (text === '1') {
          const { task_id, field, new_value } = user?.state_data || {};
          if (task_id && field && new_value !== undefined) {
            try {
              const { error } = await supabase
                .from('tasks')
                .update({ [field]: new_value })
                .eq('task_id', task_id);

              if (error) {
                await sendMessage(chatId, "❌ Error updating task. Please try again.");
              } else {
                await sendMessage(chatId, `✅ Task ${task_id} updated: ${field} = ${new_value}`);
              }
            } catch (error) {
              await sendMessage(chatId, "❌ Error updating task. Please try again.");
            }
          }
          await updateUserState(userId, 'idle', {});
        } else if (text === '0') {
          await sendMessage(chatId, "❌ Update cancelled.");
          await updateUserState(userId, 'idle', {});
        }
      } else if (session.state === 'pending_person_update') {
        // Handle approval for person updates (legacy state name)
        if (text === '1') {
          const { person_id, updates } = user?.state_data || {};
          if (person_id && updates) {
            try {
              const { error } = await supabase
                .from('people')
                .update(updates)
                .eq('id', person_id);

              if (error) {
                await sendMessage(chatId, "❌ Error updating person. Please try again.");
              } else {
                await sendMessage(chatId, "✅ Person updated successfully!");
              }
            } catch (error) {
              await sendMessage(chatId, "❌ Error updating person. Please try again.");
            }
          }
          await updateUserState(userId, 'idle', {});
        } else if (text === '0') {
          await sendMessage(chatId, "❌ Update cancelled.");
          await updateUserState(userId, 'idle', {});
        }
      } else if (session.state === 'pending_person_delete') {
        // Handle approval for person deletion
        if (text === '1') {
          const { person_id, person_name } = user?.state_data || {};
          if (person_id) {
            try {
              const { error } = await supabase
                .from('people')
                .delete()
                .eq('id', person_id);

              if (error) {
                await sendMessage(chatId, "❌ Error deleting person. Please try again.");
              } else {
                await sendMessage(chatId, `✅ ${person_name} deleted successfully.`);
              }
            } catch (error) {
              await sendMessage(chatId, "❌ Error deleting person. Please try again.");
            }
          }
          await updateUserState(userId, 'idle', {});
        } else if (text === '0') {
          await sendMessage(chatId, "❌ Deletion cancelled.");
          await updateUserState(userId, 'idle', {});
        }
      } else if (session.state === 'selecting_person_to_update') {
        // Handle person selection for update
        const selection = parseInt(text);
        const { candidates, updates } = user?.state_data || {};
        
        if (candidates && selection >= 1 && selection <= candidates.length) {
          const selectedPerson = candidates[selection - 1];
          
          // Show confirmation for selected person
          let preview = `👤 <b>${selectedPerson.full_name}</b>\n`;
          if (selectedPerson.company) preview += `🏢 ${selectedPerson.company}\n`;
          if (selectedPerson.email) preview += `📧 ${selectedPerson.email}\n`;
          
          preview += "\n🔄 Proposed updates:\n";
          Object.entries(updates || {}).forEach(([key, value]) => {
            preview += `• ${key}: ${value}\n`;
          });
          
          preview += "\nReply: 1 to approve, 0 to cancel";
          await sendMessage(chatId, preview);
          
          // Store pending update
          await updateUserState(userId, 'pending_person_update', {
            person_id: selectedPerson.id,
            updates: updates
          });
        } else {
          await sendMessage(chatId, "❌ Invalid selection. Please try again.");
        }
      } else if (session.state === 'selecting_person_to_delete') {
        // Handle person selection for deletion
        const selection = parseInt(text);
        const { candidates } = user?.state_data || {};
        
        if (candidates && selection >= 1 && selection <= candidates.length) {
          const selectedPerson = candidates[selection - 1];
          
          // Show confirmation for selected person
          const confirmMessage = `🗑️ Are you sure you want to delete <b>${selectedPerson.full_name}</b>?`;
          await sendMessage(chatId, `${confirmMessage}\n\nReply: 1 to confirm deletion, 0 to cancel`);
          
          // Store pending deletion
          await updateUserState(userId, 'pending_person_delete', {
            person_id: selectedPerson.id,
            person_name: selectedPerson.full_name
          });
        } else {
          await sendMessage(chatId, "❌ Invalid selection. Please try again.");
        }
      } else if (session.state === 'pending_update') {
        // Handle approval for person updates
        if (text === '1') {
          const { person_id, updates } = user?.state_data || {};
          if (person_id && updates) {
            try {
              const { error } = await supabase
                .from('people')
                .update(updates)
                .eq('id', person_id);

              if (error) {
                await sendMessage(chatId, "❌ Error updating person. Please try again.");
              } else {
                await sendMessage(chatId, "✅ Person updated successfully!");
              }
            } catch (error) {
              await sendMessage(chatId, "❌ Error updating person. Please try again.");
            }
          }
        } else {
          await sendMessage(chatId, "❌ Update cancelled.");
        }
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
      } else if (session.state === 'awaiting_task_selection') {
        if (!await checkUserAuthentication(userId)) {
          await sendMessage(chatId, "🔐 Please authenticate first using /start");
          return new Response('OK', { headers: corsHeaders });
        }
        
        // Handle task selection by number
        const taskNumber = parseInt(text.trim());
        if (isNaN(taskNumber) || taskNumber < 1) {
          await sendMessage(chatId, "❌ Please reply with a valid task number (1, 2, 3...)");
          return new Response('OK', { headers: corsHeaders });
        }
        
        const stateData = user?.state_data || {};
        const matchingTasks = stateData.matching_tasks || [];
        const pendingUpdate = stateData.pending_update || {};
        
        if (taskNumber > matchingTasks.length) {
          await sendMessage(chatId, `❌ Invalid task number. Please choose between 1 and ${matchingTasks.length}`);
          return new Response('OK', { headers: corsHeaders });
        }
        
        // Get the selected task
        const selectedTask = matchingTasks[taskNumber - 1];
        const { field, new_value } = pendingUpdate;
        
         // Perform the update
         let updateData: any = {};
         if (field === 'status') {
           updateData.status = new_value === 'done' ? 'completed' : (new_value === 'todo' ? 'pending' : new_value);
         } else {
           updateData[field] = new_value;
         }
         const { error } = await supabase.from('tasks').update(updateData).eq('task_id', selectedTask.task_id);
        
        if (error) {
          console.error('Task update error:', error);
          await sendMessage(chatId, "❌ Error updating task. Please try again.");
        } else {
          await sendMessage(chatId, `✅ Task ${selectedTask.task_id} updated: ${field} = ${new_value}\n📝 "${selectedTask.text}"`);
        }
        
        await updateUserState(userId, 'idle', {});
      } else if (session.state === 'confirming_person_delete') {
        if (!await checkUserAuthentication(userId)) {
          await sendMessage(chatId, "🔐 Please authenticate first using /start");
          return new Response('OK', { headers: corsHeaders });
        }
        
        const choice = parseInt(text.trim());
        if (choice === 0) {
          await sendMessage(chatId, "❌ Delete cancelled.");
          await updateUserState(userId, 'idle', {});
          return new Response('OK', { headers: corsHeaders });
        } else if (choice === 1) {
          // Proceed with deletion
          const stateData = user?.state_data || {};
          const personToDelete = stateData.person_to_delete;
          
          if (!personToDelete) {
            await sendMessage(chatId, "❌ Error: Person data not found. Please try again.");
            await updateUserState(userId, 'idle', {});
            return new Response('OK', { headers: corsHeaders });
          }
          
          try {
            const { error } = await supabase
              .from('people')
              .delete()
              .eq('id', personToDelete.id);
              
            if (error) {
              console.error('Delete error:', error);
              await sendMessage(chatId, "❌ Error deleting person. Please try again.");
            } else {
              await sendMessage(chatId, `✅ Successfully deleted: ${personToDelete.full_name}`);
            }
          } catch (error) {
            console.error('Delete person error:', error);
            await sendMessage(chatId, "❌ Error deleting person. Please try again.");
          }
        } else {
          await sendMessage(chatId, "❌ Please reply with 0 (cancel) or 1 (delete)");
          return new Response('OK', { headers: corsHeaders });
        }
        
        await updateUserState(userId, 'idle', {});
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

async function setupWebhook(webhookUrl: string) {
  if (!TELEGRAM_API_KEY) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'TELEGRAM_API_KEY not set' 
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_API_KEY}/setWebhook`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        max_connections: 40,
        allowed_updates: ["message"]
      })
    });

    const result = await response.json();
    
    if (result.ok) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Webhook setup successfully' 
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    } else {
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Telegram API error: ${result.description}` 
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: `Failed to setup webhook: ${error.message}` 
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

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

async function resetUserAuthentication(telegramId: number) {
  try {
    console.log(`Resetting authentication for user ${telegramId}`);
    await supabase
      .from('telegram_users')
      .upsert({
        telegram_id: telegramId,
        current_state: 'authenticating', // Set to authenticating, not idle
        state_data: {},
        is_authenticated: false,
        authenticated_at: null
      }, {
        onConflict: 'telegram_id'
      });
    console.log(`Reset authentication for user ${telegramId} - set state to authenticating`);
  } catch (error) {
    console.error('Error resetting user authentication:', error);
  }
}

async function updateUserState(telegramId: number, state: string, stateData: any) {
  try {
    // First get the current user to preserve authentication status
    const { data: currentUser } = await supabase
      .from('telegram_users')
      .select('is_authenticated')
      .eq('telegram_id', telegramId)
      .maybeSingle();

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

async function handlePasswordAuthentication(chatId: number, password: string, telegramId: number, userInfo: any) {
  if (password === AUTH_PASSWORD) {
    // Password correct, now ask for email
    await updateUserState(telegramId, 'awaiting_email', {});
    await sendMessage(chatId, 
      "✅ Password correct!\n\n" +
      "📧 Now please enter your email address to link your Telegram account:"
    );
  } else {
    await sendMessage(chatId, "❌ Incorrect password. Please try again or use /start to restart.");
  }
}

async function handleEmailAuthentication(chatId: number, email: string, telegramId: number, userInfo: any) {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      await sendMessage(chatId, "❌ Invalid email format. Please enter a valid email address:");
      return;
    }

    // Check if this email exists in profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', email.toLowerCase())
      .single();

    if (profileError || !profile) {
      await sendMessage(chatId, 
        "❌ Email not found in our system. Please contact an administrator to add your email first, or enter a different email:"
      );
      return;
    }

    // Check if user already exists in telegram_users table
    const { data: existingUser } = await supabase
      .from('telegram_users')
      .select('id')
      .eq('telegram_id', telegramId)
      .maybeSingle();

    // Update or insert telegram user record
    const { error } = await supabase
      .from('telegram_users')
      .upsert({
        telegram_id: telegramId,
        telegram_username: userInfo.username || null,
        first_name: userInfo.first_name || null,
        is_authenticated: true,
        authenticated_at: new Date().toISOString(),
        current_state: 'idle',
        // Store the linked user's profile ID in state_data for easy reference
        state_data: { linked_user_id: profile.id, linked_email: profile.email }
      }, {
        onConflict: 'telegram_id'
      });

    if (error) {
      console.error('Authentication error:', error);
      await sendMessage(chatId, "❌ Authentication failed. Please try again with /start");
      return;
    }

    await setCommands(chatId);
    
    // Personalized message based on whether this is a new or returning user
    const welcomeMessage = existingUser 
      ? `🔄 Re-authenticated successfully! Welcome back ${profile.full_name || profile.email}!\n\n🔗 Your Telegram account has been updated and re-linked to your profile.`
      : `✅ Authentication successful! Welcome ${profile.full_name || profile.email}!\n\n🔗 Your Telegram account is now linked to your profile.`;

    await sendMessage(chatId, 
      welcomeMessage + "\n\n" +
      "💡 <b>You can now just type anything!</b>\n" +
      "Examples:\n" +
      "• 'search fintech startups'\n" +
      "• 'add task call John tomorrow'\n" +
      "• 'show all tasks'\n" +
      "• 'add Sarah from Google'\n\n" +
      "Commands:\n" +
      "🔍 /search - Search people\n" +
      "➕ /add - Add a new person\n" +
      "❓ /help - Show help message"
    );
  } catch (error) {
    console.error('Database error:', error);
    await sendMessage(chatId, "❌ Authentication failed. Please try again with /start");
  }
}

async function handleFunctionRouter(chatId: number, text: string, userId: number) {
  if (!OPENAI_API_KEY) {
    await sendMessage(chatId, "❌ OpenAI API not configured. Please contact administrator.");
    return;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `You are a function router.  
Your job: take any user request and map it to EXACTLY ONE of these functions, and return ONLY a JSON array [function_number, parameters].  

---

### Functions

1. search_information(words: array of strings)

2. add_task(task: object)  
   task = {
     "text": string,            # required, main task text
     "assign_to": string|null,  # optional
     "due_date": string|null,   # optional, must be full ISO datetime (YYYY-MM-DD HH:MM)
     "status": string|null,     # optional ("todo", "in-progress", "done"), default = "todo"
     "label": string|null,      # optional ("work", "personal", "urgent")
     "priority": string|null,   # optional ("low", "medium", "high"), default = "medium"
     "repeat": string|null      # optional ("daily", "weekly", "monthly") for recurring tasks
   }  
   - Always convert natural language dates/times into ISO datetime format.
   - You are given today's date: **2025-09-09**.
   - Natural language examples:
     • "tomorrow morning" → "2025-09-10 09:00"
     • "next Thursday at 15:30" → "2025-09-11 15:30"  
     • "in 2 weeks at 10am" → "2025-09-23 10:00"
   - If no time mentioned, default to 09:00.
   - If no date mentioned, keep due_date = null.
   - Support recurring: "every Monday at 10am" → due_date="2025-09-15 10:00", repeat="weekly"
   - Default values: status="todo", priority="medium", label=null
   - Assignment patterns to recognize:
     • "Assign to Guy" → assign_to="Guy"
     • "Task for Guy" → assign_to="Guy"
     • "Guy should..." → assign_to="Guy"
     • "Tell Guy to..." → assign_to="Guy"
     • "Add task for Guy to meet Alon" → assign_to="Guy", text="meet Alon"
   - Rule: If no "task" is mentioned in the user prompt, do not use this function.

3. remove_task(task_id: string or number)

4. add_alert_to_task(task_id: string or number)

5. show_all_tasks(period: "daily" | "weekly" | "monthly" | "all", filter?: object)  
   filter = {"field": string, "value": string}  
   - Example: "show tasks high priority" → [5, {"period":"all","filter":{"field":"priority","value":"high"}}]

6. add_new_people(people_data: array of structured fields like Full Name, Email, LinkedIn, Company, Categories, Status, Newsletter, etc.)

7. show_all_meetings(period: "today" | "weekly" | "monthly")

8. update_task_request(words: array of strings, field: string, new_value: string)  
   - If the user gives a task ID, skip the search step and go straight to update_task.  
   - If the user only gives text (e.g. "call roee done"), return:  
     [8, {"words": ["call","roee"], "field": "status", "new_value": "done"}]  
   - The backend will then search tasks by words, show matches to the user, and ask which task ID to update.  
   - After confirmation, the backend itself will call the actual update function.

9. update_person(person_identifier: string|number, updates: object)  
   - If user specifies exact ID → update directly with [9, {"person_id": id, "updates": updates}]
   - If user specifies only a name → return [9, {"words": [name], "updates": updates}]
   - The backend will search for matching names, show candidates, user picks ID, then confirm action
   - Examples:
     "Update Assaf status to CEO" → [9, {"words": ["Assaf"], "updates": {"status": "CEO"}}]
     "Update person 123 status to CEO" → [9, {"person_id": "123", "updates": {"status": "CEO"}}]

10. delete_person(person_identifier: string|number)
    - If user specifies exact ID → delete directly with [10, {"person_id": id}]
    - If user specifies only a name → return [10, {"words": [name]}] 
    - The backend will search for matching names, show candidates, user picks ID, then confirm action
    - Examples:
      "Delete Assaf" → [10, {"words": ["Assaf"]}]
      "Delete person 123" → [10, {"person_id": "123"}]
   - Always confirm before deleting:
     Example: "Are you sure you want to delete Amir Tal? (0=cancel, 1=approve)"
   - After user approves → return:
     [10, "Amir Tal"]

---

### Rules
- Always return [function_number, parameters].  
- If no parameter is needed, return null.  
- If multiple matches are possible, choose the most direct.  
- Default values for tasks: "status":"todo", "priority":"medium".  
- Never confuse "tasks" and other words: only treat as task if user explicitly mentions or implies a task action.  

---

### Examples

**User:** "Find me info about AI and marketing"  
**Assistant:**  
[1, ["AI", "marketing"]]

**User:** "add task to meet guy"  
**Assistant:**  
[2, {"text":"meet guy","assign_to":null,"due_date":null,"status":"todo","label":null,"priority":"medium"}]

**User:** "Add a task: finish report by Monday, assign to Jonathan, high priority"  
**Assistant:**  
[2, {"text":"finish report","assign_to":"Jonathan","due_date":"2025-09-15 09:00","status":"todo","label":null,"priority":"high"}]

**User:** "Add task for Guy to meet Alon from Puzzelsoft next Thursday"  
**Assistant:**  
[2, {"text":"meet Alon from Puzzelsoft","assign_to":"Guy","due_date":"2025-09-11 09:00","status":"todo","label":null,"priority":"medium"}]

**User:** "Remove task 17"  
**Assistant:**  
[3, 17]

**User:** "Set an alert on task 22"  
**Assistant:**  
[4, 22]

**User:** "Show me my weekly tasks"  
**Assistant:**  
[5, {"period":"weekly"}]

**User:** "Show tasks high priority"  
**Assistant:**  
[5, {"period":"all","filter":{"field":"priority","value":"high"}}]

**User:** "call roee done"  
**Assistant:**  
[8, {"words": ["call","roee"], "field": "status", "new_value": "done"}]

**User:** "status of task 4 is done"  
**Assistant:**  
[8, {"task_id": 4, "field": "status", "new_value": "done"}]

**User:** "Show all meetings today"  
**Assistant:**  
[7, "today"]

**User:** "Delete Amir Tal"  
**Assistant:**  
[10, "Amir Tal"]

**User:** "Remove person with ID 42"  
**Assistant:**  
[10, "42"]

**User:** "Update person guy status to ceo"  
**Assistant:**  
[9, {"words": ["guy"], "updates": {"status": "ceo"}}]

**User:** "Update person 123 company to Microsoft"  
**Assistant:**  
[9, {"person_id": "123", "updates": {"company": "Microsoft"}}]

**User:** "Delete Assaf"  
**Assistant:**  
[10, {"words": ["Assaf"]}]

**User:** "Delete person 42"  
**Assistant:**  
[10, {"person_id": "42"}]`
          },
          { role: 'user', content: text }
        ],
        temperature: 0.1,
        max_tokens: 150
      }),
    });

    const data = await response.json();
    const functionCall = data.choices[0].message.content.trim();
    
    console.log(`Function router response: ${functionCall}`);
    
    try {
      const [functionNumber, parameters] = JSON.parse(functionCall);
      await executeBotFunction(chatId, functionNumber, parameters, userId, text);
    } catch (parseError) {
      console.error('Failed to parse function response:', parseError);
      // Fallback to search
      await handleSearch(chatId, text);
    }
    
  } catch (error) {
    console.error('Function router error:', error);
    // Fallback to search
    await handleSearch(chatId, text);
  }
}

async function executeBotFunction(chatId: number, functionNumber: number, parameters: any, userId: number, originalText: string) {
  console.log(`Executing function ${functionNumber} with params:`, parameters);
  
  switch (functionNumber) {
    case 1: // search_information
      if (parameters && Array.isArray(parameters)) {
        const searchQuery = parameters.join(' ');
        await handleSearch(chatId, searchQuery);
      } else {
        await handleSearch(chatId, originalText);
      }
      break;
      
    case 2: // add_task
      await handleAddTask(chatId, parameters, userId);
      break;
      
    case 3: // remove_task
      await handleRemoveTask(chatId, parameters);
      break;
      
    case 4: // add_alert_to_task
      await handleAddAlertToTask(chatId, parameters);
      break;
      
    case 5: // show_all_tasks
      await handleShowTasks(chatId, parameters);
      break;
      
    case 6: // add_new_people
      await handleAddPeopleFromBot(chatId, parameters, userId);
      break;
      
    case 7: // show_all_meetings
      await handleShowMeetings(chatId, parameters);
      break;
      
    case 8: // update_task
      await handleUpdateTask(chatId, parameters);
      break;
      
    case 9: // update_person
      await handleUpdatePerson(chatId, parameters, userId);
      break;
      
    case 10: // delete_person
      await handleDeletePerson(chatId, parameters, userId);
      break;
      
    default:
      await sendMessage(chatId, `🚧 Function ${functionNumber} is not implemented yet.`);
  }
}

// Helper function to parse natural language dates to SQL date format
function parseNaturalDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  
  const today = new Date('2025-09-09'); // Current date provided
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  const lowerDateStr = dateStr.toLowerCase().trim();
  let timeStr = '09:00'; // Default time
  
  // Extract time if present (e.g., "15:30", "3:30 PM", "10am", "morning")
  const timeMatch = lowerDateStr.match(/(\d{1,2}):(\d{2})(\s*(am|pm))?/i);
  const ampmMatch = lowerDateStr.match(/(\d{1,2})\s*(am|pm)/i);
  
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const isPM = timeMatch[4]?.toLowerCase() === 'pm';
    
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    
    timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } else if (ampmMatch) {
    let hours = parseInt(ampmMatch[1]);
    const isPM = ampmMatch[2].toLowerCase() === 'pm';
    
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    
    timeStr = `${hours.toString().padStart(2, '0')}:00`;
  } else if (lowerDateStr.includes('morning')) {
    timeStr = '09:00';
  } else if (lowerDateStr.includes('afternoon')) {
    timeStr = '14:00';
  } else if (lowerDateStr.includes('evening')) {
    timeStr = '18:00';
  } else if (lowerDateStr.includes('night')) {
    timeStr = '20:00';
  }
  
  let targetDate = new Date(today);
  
  // Handle "today"
  if (lowerDateStr.includes('today')) {
    // Keep today's date
  } else if (lowerDateStr.includes('tomorrow')) {
    targetDate.setDate(today.getDate() + 1);
  } else if (lowerDateStr.includes('in') && lowerDateStr.includes('week')) {
    // Handle "in 2 weeks", "in 1 week"
    const weeksMatch = lowerDateStr.match(/in\s+(\d+)\s+weeks?/);
    if (weeksMatch) {
      const weeks = parseInt(weeksMatch[1]);
      targetDate.setDate(today.getDate() + (weeks * 7));
    }
  } else if (lowerDateStr.includes('in') && lowerDateStr.includes('day')) {
    // Handle "in 3 days", "in 1 day"
    const daysMatch = lowerDateStr.match(/in\s+(\d+)\s+days?/);
    if (daysMatch) {
      const days = parseInt(daysMatch[1]);
      targetDate.setDate(today.getDate() + days);
    }
  } else if (lowerDateStr.includes('next')) {
    // Handle "next friday", "next monday", etc.
    const nextDayMatch = lowerDateStr.match(/next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
    if (nextDayMatch) {
      const dayIndex = dayNames.indexOf(nextDayMatch[1]);
      const currentDay = today.getDay();
      let daysUntilTarget = (dayIndex - currentDay + 7) % 7;
      if (daysUntilTarget === 0) daysUntilTarget = 7; // Next week if it's the same day
      targetDate.setDate(today.getDate() + daysUntilTarget);
    }
  } else {
    // Handle day names like "friday", "monday"
    const dayMatch = lowerDateStr.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
    if (dayMatch) {
      const dayIndex = dayNames.indexOf(dayMatch[1]);
      const currentDay = today.getDay();
      const daysUntilTarget = (dayIndex - currentDay + 7) % 7;
      const finalDaysToAdd = daysUntilTarget === 0 ? 7 : daysUntilTarget; // If today is the target day, get next week's
      
      targetDate.setDate(today.getDate() + finalDaysToAdd);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(lowerDateStr.split(' ')[0])) {
      // Try to parse as ISO date (YYYY-MM-DD)
      return `${lowerDateStr.split(' ')[0]} ${timeStr}`;
    } else {
      // If nothing matches, return null (no due date)
      return null;
    }
  }
  
  // Return ISO timestamp with timezone
  const year = targetDate.getFullYear();
  const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
  const day = targetDate.getDate().toString().padStart(2, '0');
  
  // Return full ISO timestamp that preserves timezone
  return `${year}-${month}-${day}T${timeStr}:00.000Z`;
}

// Task Management Functions
async function handleAddTask(chatId: number, parameters: any, userId: number) {
  try {
    console.log('Add task parameters received:', parameters);
    
    let taskText = '';
    let assignTo = null;
    let dueDate = null;
    let status = 'pending';
    let label = null;
    let priority = 'medium';
    let repeat = null;
    
    // Handle different parameter formats - now expects structured task object
    if (typeof parameters === 'string') {
      taskText = parameters;
    } else if (parameters && typeof parameters === 'object') {
      // New structured format
      taskText = parameters.text || '';
      assignTo = parameters.assign_to || null;
      dueDate = parseNaturalDate(parameters.due_date); // Convert natural language date
      status = parameters.status === 'todo' ? 'pending' : (parameters.status || 'pending');
      label = parameters.label || null;
      priority = parameters.priority || 'medium';
      repeat = parameters.repeat || null;
      
      // Check for recurring tasks pattern in text if repeat is specified
      if (repeat && taskText.toLowerCase().includes('every')) {
        // For recurring tasks, find the next occurrence date
        const recurringMatch = taskText.toLowerCase().match(/every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
        if (recurringMatch && !dueDate) {
          // Calculate next occurrence of this day
          const dayName = recurringMatch[1];
          dueDate = parseNaturalDate(`next ${dayName}`);
        }
      }
    }
    
    if (!taskText || taskText.trim().length === 0) {
      await sendMessage(chatId, "❌ I need task details. Try: 'Add task call John tomorrow'");
      return;
    }

    // Get the authenticated telegram user to find their actual profile
    const { data: telegramUser, error: telegramError } = await supabase
      .from('telegram_users')
      .select('*')
      .eq('telegram_id', userId)
      .eq('is_authenticated', true)
      .single();

    if (telegramError || !telegramUser) {
      await sendMessage(chatId, "❌ You need to authenticate first. Please use /auth command.");
      return;
    }

    // Get the linked user ID from telegram user's state_data
    const linkedUserId = telegramUser.state_data?.linked_user_id;
    
    if (!linkedUserId) {
      await sendMessage(chatId, "❌ Your account is not properly linked. Please restart authentication with /start");
      return;
    }

    const task = {
      text: taskText.trim(),
      assign_to: assignTo,
      due_date: dueDate,
      status: status,
      label: label,
      priority: priority,
      owner_id: linkedUserId,
      created_by: linkedUserId  // Set created_by to fix the NOT NULL constraint error
    };

    console.log('Inserting task:', task);
    const { error } = await supabase.from('tasks').insert([task]);

    if (error) {
      console.error('Add task error:', error);
      await sendMessage(chatId, "❌ Error adding task. Please try again.");
      return;
    }

    let responseMsg = `✅ Task added: "${task.text}" (${task.priority} priority, ${task.status})`;
    if (assignTo) responseMsg += `\n👤 Assigned to: ${assignTo}`;
    if (dueDate) {
      // Format the display date better
      const displayDate = new Date(dueDate).toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace(',', '');
      responseMsg += `\n📅 Due: ${displayDate}`;
    }
    if (label) responseMsg += `\n🏷️ Label: ${label}`;
    if (repeat) responseMsg += `\n🔄 Repeats: ${repeat}`;
    
    await sendMessage(chatId, responseMsg);
  } catch (error) {
    console.error('Add task error:', error);
    await sendMessage(chatId, "❌ Error adding task. Please try again.");
  }
}

async function handleRemoveTask(chatId: number, parameters: any) {
  try {
    if (!parameters || (!parameters.task_id && typeof parameters !== 'string' && typeof parameters !== 'number')) {
      await sendMessage(chatId, "❌ I need a task ID to remove. Try: 'Remove task 5'");
      return;
    }

    const taskId = parameters.task_id || parameters;
    const { error } = await supabase.from('tasks').delete().eq('task_id', taskId);

    if (error) {
      await sendMessage(chatId, "❌ Error removing task. Please try again.");
      return;
    }

    await sendMessage(chatId, `✅ Task ${taskId} removed successfully.`);
  } catch (error) {
    await sendMessage(chatId, "❌ Error removing task. Please try again.");
  }
}

async function handleAddAlertToTask(chatId: number, parameters: any) {
  await sendMessage(chatId, "🚧 Task alerts feature coming soon!");
}

async function handleShowTasks(chatId: number, parameters: any) {
  try {
    // Get the authenticated telegram user to filter tasks by ownership
    const { data: telegramUser, error: telegramError } = await supabase
      .from('telegram_users')
      .select('*')
      .eq('telegram_id', chatId)
      .eq('is_authenticated', true)
      .single();

    if (telegramError || !telegramUser) {
      await sendMessage(chatId, "❌ You need to authenticate first. Please use /auth command.");
      return;
    }

    // Get the linked user ID from telegram user's state_data
    const linkedUserId = telegramUser.state_data?.linked_user_id;
    
    if (!linkedUserId) {
      await sendMessage(chatId, "❌ Your account is not properly linked. Please restart authentication with /start");
      return;
    }

    // Start with filtering by owner (simplified query for now)
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('owner_id', linkedUserId);
    
    // Apply period and advanced filters
    if (typeof parameters === 'string') {
      const period = parameters;
      const today = new Date();
      
      switch (period) {
        case 'daily':
          const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
          query = query.gte('due_date', startOfDay.toISOString()).lt('due_date', endOfDay.toISOString());
          break;
        case 'weekly':
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 7);
          query = query.gte('due_date', startOfWeek.toISOString()).lt('due_date', endOfWeek.toISOString());
          break;
        case 'monthly':
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
          query = query.gte('due_date', startOfMonth.toISOString()).lt('due_date', endOfMonth.toISOString());
          break;
        // 'all' - no filter needed
      }
    } else if (parameters && typeof parameters === 'object') {
      // Handle advanced filters
      if (parameters.filter && parameters.filter.field && parameters.filter.value) {
        const field = parameters.filter.field;
        const value = parameters.filter.value;
        
        if (field === 'due_date' && value === 'overdue') {
          // Show overdue tasks
          const now = new Date().toISOString();
          query = query.lt('due_date', now).neq('status', 'completed');
        } else if (field === 'assign_to') {
          query = query.ilike('assign_to', `%${value}%`);
        } else if (field === 'status') {
          // Map display status to database status
          const dbStatus = value === 'todo' ? 'pending' : (value === 'done' ? 'completed' : value);
          query = query.eq('status', dbStatus);
        } else {
          // Generic field filter
          query = query.eq(field, value);
        }
      }
      
      // Apply period filter if specified
      if (parameters.period && parameters.period !== 'all') {
        const period = parameters.period;
        const today = new Date();
        
        switch (period) {
          case 'daily':
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
            query = query.gte('due_date', startOfDay.toISOString()).lt('due_date', endOfDay.toISOString());
            break;
          case 'weekly':
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 7);
            query = query.gte('due_date', startOfWeek.toISOString()).lt('due_date', endOfWeek.toISOString());
            break;
          case 'monthly':
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
            query = query.gte('due_date', startOfMonth.toISOString()).lt('due_date', endOfMonth.toISOString());
            break;
        }
      }
      
      // Legacy filter support
      if (parameters.filter && parameters.value && !parameters.filter.field) {
        query = query.eq(parameters.filter, parameters.value);
      }
    }

    const { data: tasks, error } = await query.order('created_at', { ascending: false }).limit(20);

    if (error) {
      await sendMessage(chatId, "❌ Error fetching tasks. Please try again.");
      return;
    }

    if (!tasks || tasks.length === 0) {
      await sendMessage(chatId, "📝 No tasks found matching your criteria.");
      return;
    }

    let response = `📝 Found ${tasks.length} task(s):\n\n`;
    tasks.forEach((task: any, index: number) => {
      const statusEmoji = task.status === 'completed' ? '✅' : 
                         task.status === 'in-progress' ? '🔄' : '⏳';
      const priorityEmoji = task.priority === 'high' ? '🔥' : 
                           task.priority === 'low' ? '🔹' : '📌';
      
      response += `${statusEmoji} ${priorityEmoji} <b>${task.text}</b>\n`;
      response += `   ID: ${task.task_id} | Status: ${task.status} | Priority: ${task.priority}\n`;
      if (task.assign_to) response += `   👤 ${task.assign_to}\n`;
      if (task.due_date) {
        const displayDate = new Date(task.due_date).toLocaleString('en-IL', {
          timeZone: 'Asia/Jerusalem',
          year: 'numeric',
          month: '2-digit', 
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}:\d{2})/, '$3-$2-$1 $4');
        response += `   📅 ${displayDate}\n`;
      }
      if (task.label) response += `   🏷️ ${task.label}\n`;
      response += '\n';
    });

    await sendMessage(chatId, response);
  } catch (error) {
    await sendMessage(chatId, "❌ Error fetching tasks. Please try again.");
  }
}

async function handleUpdateTask(chatId: number, parameters: any) {
  try {
    // Get the authenticated telegram user to filter tasks by ownership
    const { data: telegramUser, error: telegramError } = await supabase
      .from('telegram_users')
      .select('*')
      .eq('telegram_id', chatId)
      .eq('is_authenticated', true)
      .single();

    if (telegramError || !telegramUser) {
      await sendMessage(chatId, "❌ You need to authenticate first. Please use /start command.");
      return;
    }

    // Get the linked user ID from telegram user's state_data
    const linkedUserId = telegramUser.state_data?.linked_user_id;
    
    if (!linkedUserId) {
      await sendMessage(chatId, "❌ Your account is not properly linked. Please restart authentication with /start");
      return;
    }

    // Handle different formats: direct task ID update vs. word-based search
    if (parameters && parameters.task_id && (parameters.updates || (parameters.field && parameters.new_value))) {
      // Direct update with task ID - supports both single and multiple field updates
      let updateData: any = {};
      
      if (parameters.updates) {
        // New format with multiple updates
        if (Array.isArray(parameters.updates)) {
          // Multiple field updates
          for (const update of parameters.updates) {
            const field = update.field;
            const newValue = update.new_value;
            
            if (field === 'status') {
              updateData.status = newValue === 'done' ? 'completed' : (newValue === 'todo' ? 'pending' : newValue);
            } else {
              updateData[field] = newValue;
            }
          }
        } else {
          // Single field update (legacy format)
          const field = parameters.updates.field;
          const newValue = parameters.updates.new_value;
          
          if (field === 'status') {
            updateData.status = newValue === 'done' ? 'completed' : (newValue === 'todo' ? 'pending' : newValue);
          } else {
            updateData[field] = newValue;
          }
        }
      } else {
        // Legacy format with direct field and new_value
        const field = parameters.field;
        const newValue = parameters.new_value;
        
        if (field === 'status') {
          updateData.status = newValue === 'done' ? 'completed' : (newValue === 'todo' ? 'pending' : newValue);
        } else {
          updateData[field] = newValue;
        }
      }
      
      const { error } = await supabase.from('tasks').update(updateData).eq('task_id', parameters.task_id).eq('owner_id', linkedUserId);

      if (error) {
        await sendMessage(chatId, "❌ Error updating task. Please try again.");
        return;
      }

      const updateSummary = Object.entries(updateData).map(([key, value]) => `${key} = ${value}`).join(', ');
      await sendMessage(chatId, `✅ Task ${parameters.task_id} updated: ${updateSummary}`);
      return;
    }

    // Words-based search for task update (new functionality)
    if (parameters && parameters.words && parameters.field && parameters.new_value) {
      const { words, field, new_value } = parameters;
      
      // Get the authenticated telegram user to filter tasks by ownership
      const { data: telegramUser, error: telegramError } = await supabase
        .from('telegram_users')
        .select('*')
        .eq('telegram_id', chatId)
        .eq('is_authenticated', true)
        .single();

      if (telegramError || !telegramUser) {
        await sendMessage(chatId, "❌ You need to authenticate first. Please use /start command.");
        return;
      }

      // Get the linked user ID from telegram user's state_data
      const linkedUserId = telegramUser.state_data?.linked_user_id;
      
      if (!linkedUserId) {
        await sendMessage(chatId, "❌ Your account is not properly linked. Please restart authentication with /start");
        return;
      }
      
      // Search for tasks that contain any of the words in their text AND belong to the user
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('task_id, text, status, priority, due_date, assign_to')
        .eq('owner_id', linkedUserId)
        .or(`text.ilike.%${words[0]}%${words.length > 1 ? `,text.ilike.%${words[1]}%` : ''}`)
        .limit(10);

      if (error) {
        console.error('Search tasks error:', error);
        await sendMessage(chatId, "❌ Error searching tasks. Please try again.");
        return;
      }

      if (!tasks || tasks.length === 0) {
        await sendMessage(chatId, `❌ No tasks found matching: ${words.join(', ')}`);
        return;
      }

      // Show matching tasks to user and save state for selection
      let response = `🔍 Found ${tasks.length} matching task(s). Reply with task number to update ${field} to "${new_value}":\n\n`;
      
      tasks.forEach((task, index) => {
        const dueText = task.due_date ? ` (due: ${new Date(task.due_date).toLocaleString('en-IL', {
          timeZone: 'Asia/Jerusalem',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}:\d{2})/, '$3-$2-$1 $4')})` : '';
        const assignText = task.assign_to ? ` [${task.assign_to}]` : '';
        response += `${index + 1}. ID: ${task.task_id} - ${task.text}${dueText}${assignText}\n`;
      });

      response += '\n💡 Reply with the task number (1, 2, 3...) to update it.';

      await sendMessage(chatId, response);
      
      // Save state for task selection
      await updateUserState(chatId, 'awaiting_task_selection', {
        matching_tasks: tasks,
        pending_update: { field, new_value }
      });
      
      return;
    }

    await sendMessage(chatId, "❌ Invalid update parameters. Please specify task ID with updates, or search terms with field and new value.");
  } catch (error) {
    console.error('Update task error:', error);
    await sendMessage(chatId, "❌ Error updating task. Please try again.");
  }
}

// People Management Functions
async function handleAddPeopleFromBot(chatId: number, parameters: any, userId: number) {
  try {
    if (!Array.isArray(parameters)) {
      await sendMessage(chatId, "❌ I need person details. Try: 'Add John Doe from TechCorp'");
      return;
    }

    // Get the authenticated telegram user to get the owner_id
    const { data: telegramUser, error: telegramError } = await supabase
      .from('telegram_users')
      .select('*')
      .eq('telegram_id', chatId)
      .eq('is_authenticated', true)
      .single();

    if (telegramError || !telegramUser) {
      await sendMessage(chatId, "❌ You need to authenticate first. Please use /start command.");
      return;
    }

    const linkedUserId = telegramUser.state_data?.linked_user_id;
    
    if (!linkedUserId) {
      await sendMessage(chatId, "❌ Your account is not properly linked. Please restart authentication with /start");
      return;
    }

    const results = [];
    for (const personData of parameters) {
      const person = {
        full_name: personData["Full Name"] || personData.full_name || personData.name,
        email: personData.Email || personData.email || null,
        company: personData.Company || personData.company || null,
        categories: personData.Categories || personData.categories || null,
        status: personData.Status || personData.status || null,
        linkedin_profile: personData.linkedin_profile || null,
        newsletter: personData.Newsletter || personData.newsletter || false,
        should_avishag_meet: personData.should_avishag_meet || false,
        owner_id: linkedUserId,
        created_by: linkedUserId
      };

      console.log('Inserting person:', JSON.stringify(person, null, 2));

      if (person.full_name) {
        const { data, error } = await supabase.from('people').insert([person]).select();
        if (error) {
          console.error('Error inserting person:', error);
          console.error('Person data that failed:', JSON.stringify(person, null, 2));
        } else {
          results.push(person.full_name);
          console.log('Successfully inserted person:', person.full_name);
        }
      } else {
        console.log('No full name provided for person data:', JSON.stringify(personData, null, 2));
      }
    }

    if (results.length > 0) {
      await sendMessage(chatId, `✅ Added ${results.length} person(s): ${results.join(', ')}`);
    } else {
      await sendMessage(chatId, "❌ Could not add any people. Please check the details and try again. Make sure to include the person's name.");
    }
  } catch (error) {
    console.error('Error in handleAddPeopleFromBot:', error);
    await sendMessage(chatId, "❌ Error adding people. Please try again.");
  }
}

async function handleShowMeetings(chatId: number, parameters: any) {
  await sendMessage(chatId, "🚧 Meetings feature coming soon!");
}

async function handleUpdatePerson(chatId: number, parameters: any, userId: number) {
  try {
    const { data: telegramUser, error: telegramError } = await supabase
      .from('telegram_users')
      .select('*')
      .eq('telegram_id', chatId)
      .eq('is_authenticated', true)
      .maybeSingle();

    if (telegramError || !telegramUser) {
      await sendMessage(chatId, "❌ You need to authenticate first. Please use /start command.");
      return;
    }

    const linkedUserId = telegramUser.state_data?.linked_user_id;
    
    if (!linkedUserId) {
      await sendMessage(chatId, "❌ Your account is not properly linked. Please restart authentication with /start");
      return;
    }

    // Handle direct person ID update (UUID or numeric ID)
    if (parameters.person_id) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      let personToUpdate = null;
      if (uuidRegex.test(parameters.person_id) || !isNaN(parameters.person_id)) {
        // Direct lookup by ID
        const { data, error } = await supabase
          .from('people')
          .select('*')
          .eq('id', parameters.person_id)
          .eq('owner_id', linkedUserId)
          .maybeSingle();
          
        if (error || !data) {
          await sendMessage(chatId, "❌ Person not found with that ID.");
          return;
        }
        personToUpdate = data;
      }

      if (personToUpdate) {
        // Show confirmation for direct ID update
        let preview = `👤 <b>${personToUpdate.full_name}</b>\n`;
        if (personToUpdate.company) preview += `🏢 ${personToUpdate.company}\n`;
        if (personToUpdate.email) preview += `📧 ${personToUpdate.email}\n`;
        
        preview += "\n🔄 Proposed updates:\n";
        Object.entries(parameters.updates || {}).forEach(([key, value]) => {
          preview += `• ${key}: ${value}\n`;
        });
        
        preview += "\nReply: 1 to approve, 0 to cancel";
        await sendMessage(chatId, preview);
        
        // Store pending update in user state
        await updateUserState(userId, 'pending_person_update', {
          person_id: personToUpdate.id,
          updates: parameters.updates
        });
        return;
      }
    }

    // Handle search by name (words array)
    if (parameters.words && Array.isArray(parameters.words)) {
      const searchTerm = parameters.words.join(' ');
      
      // Search for people by name
      const { data: people, error: searchError } = await supabase
        .from('people')
        .select('*')
        .eq('owner_id', linkedUserId)
        .ilike('full_name', `%${searchTerm}%`);

      if (searchError || !people || people.length === 0) {
        await sendMessage(chatId, `❌ No person found with name containing "${searchTerm}".`);
        return;
      }
      
      if (people.length === 1) {
        // Single match - show confirmation
        const person = people[0];
        let preview = `👤 <b>${person.full_name}</b>\n`;
        if (person.company) preview += `🏢 ${person.company}\n`;
        if (person.email) preview += `📧 ${person.email}\n`;
        
        preview += "\n🔄 Proposed updates:\n";
        Object.entries(parameters.updates || {}).forEach(([key, value]) => {
          preview += `• ${key}: ${value}\n`;
        });
        
        preview += "\nReply: 1 to approve, 0 to cancel";
        await sendMessage(chatId, preview);
        
        // Store pending update in user state
        await updateUserState(userId, 'pending_person_update', {
          person_id: person.id,
          updates: parameters.updates
        });
        return;
      }

      // Multiple matches - show candidates
      let response = `🔍 Found ${people.length} people matching "${searchTerm}". Reply with person number to update:\n\n`;
      people.forEach((person, index) => {
        response += `${index + 1}. <b>${person.full_name}</b>`;
        if (person.company) response += ` (${person.company})`;
        if (person.email) response += ` - ${person.email}`;
        response += `\n`;
      });
      
      await sendMessage(chatId, response);
      
      // Store candidates for selection
      await updateUserState(userId, 'selecting_person_to_update', {
        candidates: people,
        updates: parameters.updates
      });
      return;
    }

    await sendMessage(chatId, "❌ Invalid person update request.");
  } catch (error) {
    console.error('Error in handleUpdatePerson:', error);
    await sendMessage(chatId, "❌ Error updating person. Please try again.");
  }
}

async function handleSearch(chatId: number, query: string) {
  try {
    // Get the authenticated telegram user to filter contacts by ownership
    const { data: telegramUser, error: telegramError } = await supabase
      .from('telegram_users')
      .select('*')
      .eq('telegram_id', chatId)
      .eq('is_authenticated', true)
      .single();

    if (telegramError || !telegramUser) {
      await sendMessage(chatId, "❌ You need to authenticate first. Please use /start command.");
      return;
    }

    // Get the linked user ID from telegram user's state_data
    const linkedUserId = telegramUser.state_data?.linked_user_id;
    
    if (!linkedUserId) {
      await sendMessage(chatId, "❌ Your account is not properly linked. Please restart authentication with /start");
      return;
    }

    const searchTerm = query.toLowerCase();
    
    const { data: people, error } = await supabase
      .from('people')
      .select('*')
      .eq('owner_id', linkedUserId)
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
    
    people.forEach((person: any, index: number) => {
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
          await sendMessage(chatId, "❌ Error adding person to database. Please try again with /add");
          await updateUserState(userId, 'idle', {});
          return;
        }

        let response = `✅ Successfully added: <b>${session.data.full_name}</b>\n`;
        if (session.data.company) response += `🏢 Company: ${session.data.company}\n`;
        if (session.data.email) response += `📧 Email: ${session.data.email}\n`;
        if (session.data.categories) response += `🏷️ Categories: ${session.data.categories}\n`;
        
        await sendMessage(chatId, response);
        await updateUserState(userId, 'idle', {});
      } catch (error) {
        console.error('Database error:', error);
        await sendMessage(chatId, "❌ Error adding person. Please try again with /add");
        await updateUserState(userId, 'idle', {});
      }
      break;

    default:
      await sendMessage(chatId, "❌ Something went wrong. Please try again with /add");
      await updateUserState(userId, 'idle', {});
  }
}

async function handleDeletePerson(chatId: number, parameters: any, userId: number) {
  try {
    const { data: telegramUser, error: telegramError } = await supabase
      .from('telegram_users')
      .select('*')
      .eq('telegram_id', chatId)
      .eq('is_authenticated', true)
      .maybeSingle();

    if (telegramError || !telegramUser) {
      await sendMessage(chatId, "❌ You need to authenticate first. Please use /start command.");
      return;
    }

    const linkedUserId = telegramUser.state_data?.linked_user_id;
    
    if (!linkedUserId) {
      await sendMessage(chatId, "❌ Your account is not properly linked. Please restart authentication with /start");
      return;
    }

    // Handle direct person ID deletion (UUID or numeric ID)
    if (parameters.person_id) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      let personToDelete = null;
      if (uuidRegex.test(parameters.person_id) || !isNaN(parameters.person_id)) {
        // Direct lookup by ID
        const { data, error } = await supabase
          .from('people')
          .select('*')
          .eq('id', parameters.person_id)
          .eq('owner_id', linkedUserId)
          .maybeSingle();
          
        if (error || !data) {
          await sendMessage(chatId, "❌ Person not found with that ID.");
          return;
        }
        personToDelete = data;
      }

      if (personToDelete) {
        // Show confirmation for direct ID deletion
        const confirmMessage = `🗑️ Are you sure you want to delete <b>${personToDelete.full_name}</b>?`;
        await sendMessage(chatId, `${confirmMessage}\n\nReply: 1 to confirm deletion, 0 to cancel`);
        
        // Store pending deletion in user state
        await updateUserState(userId, 'pending_person_delete', {
          person_id: personToDelete.id,
          person_name: personToDelete.full_name
        });
        return;
      }
    }

    // Handle search by name (words array)
    if (parameters.words && Array.isArray(parameters.words)) {
      const searchTerm = parameters.words.join(' ');
      
      // Search for people by name
      const { data: people, error: searchError } = await supabase
        .from('people')
        .select('*')
        .eq('owner_id', linkedUserId)
        .ilike('full_name', `%${searchTerm}%`);

      if (searchError || !people || people.length === 0) {
        await sendMessage(chatId, `❌ No person found with name containing "${searchTerm}".`);
        return;
      }
      
      if (people.length === 1) {
        // Single match - show confirmation
        const person = people[0];
        const confirmMessage = `🗑️ Are you sure you want to delete <b>${person.full_name}</b>?`;
        await sendMessage(chatId, `${confirmMessage}\n\nReply: 1 to confirm deletion, 0 to cancel`);
        
        // Store pending deletion in user state
        await updateUserState(userId, 'pending_person_delete', {
          person_id: person.id,
          person_name: person.full_name
        });
        return;
      }

      // Multiple matches - show candidates
      let response = `🔍 Found ${people.length} people matching "${searchTerm}". Reply with person number to delete:\n\n`;
      people.forEach((person, index) => {
        response += `${index + 1}. <b>${person.full_name}</b>`;
        if (person.company) response += ` (${person.company})`;
        if (person.email) response += ` - ${person.email}`;
        response += `\n`;
      });
      
      await sendMessage(chatId, response);
      
      // Store candidates for selection
      await updateUserState(userId, 'selecting_person_to_delete', {
        candidates: people
      });
      return;
    }

    await sendMessage(chatId, "❌ Invalid person deletion request.");
  } catch (error) {
    console.error('Error in handleDeletePerson:', error);
    await sendMessage(chatId, "❌ Error deleting person. Please try again.");
  }
}