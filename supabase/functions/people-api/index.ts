import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  try {
    // Telegram authentication endpoints
    if (path === '/telegram/auth' && req.method === 'POST') {
      const { telegram_id, password, telegram_username, first_name } = await req.json();
      
      if (password === '121212') {
        try {
          const { error } = await supabase
            .from('telegram_users')
            .upsert({
              telegram_id: telegram_id,
              telegram_username: telegram_username || null,
              first_name: first_name || null,
              is_authenticated: true,
              authenticated_at: new Date().toISOString()
            }, {
              onConflict: 'telegram_id'
            });

          if (error) throw error;

          return new Response(JSON.stringify({ 
            success: true, 
            message: 'Authentication successful'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error: any) {
          return new Response(JSON.stringify({ 
            success: false, 
            message: error.message 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else {
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Invalid password' 
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Check telegram authentication
    if (path === '/telegram/check' && req.method === 'POST') {
      const { telegram_id } = await req.json();
      
      try {
        const { data, error } = await supabase
          .from('telegram_users')
          .select('is_authenticated')
          .eq('telegram_id', telegram_id)
          .eq('is_authenticated', true)
          .single();

        return new Response(JSON.stringify({ 
          authenticated: !error && data?.is_authenticated === true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error: any) {
        return new Response(JSON.stringify({ 
          authenticated: false,
          error: error.message 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Authentication endpoint - simple hardcoded admin login
    if (path === '/login' && req.method === 'POST') {
      const { username, password } = await req.json();
      
      if (username === 'admin' && password === '1234') {
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Login successful',
          token: 'admin-token' // Simple token for demo
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Invalid credentials' 
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // People CRUD endpoints
    if (path === '/people') {
      switch (req.method) {
        case 'GET':
          const { data: people, error: fetchError } = await supabase
            .from('people')
            .select('*')
            .order('created_at', { ascending: false });

          if (fetchError) {
            return new Response(JSON.stringify({ error: fetchError.message }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          return new Response(JSON.stringify(people), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

        case 'POST':
          const personData = await req.json();
          
          const { data: newPerson, error: insertError } = await supabase
            .from('people')
            .insert([personData])
            .select()
            .single();

          if (insertError) {
            return new Response(JSON.stringify({ error: insertError.message }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          return new Response(JSON.stringify(newPerson), {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

        case 'PUT':
          const updateData = await req.json();
          const { id, ...updateFields } = updateData;

          const { data: updatedPerson, error: updateError } = await supabase
            .from('people')
            .update(updateFields)
            .eq('id', id)
            .select()
            .single();

          if (updateError) {
            return new Response(JSON.stringify({ error: updateError.message }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          return new Response(JSON.stringify(updatedPerson), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

        case 'DELETE':
          const deleteData = await req.json();
          const personId = deleteData.id;

          const { error: deleteError } = await supabase
            .from('people')
            .delete()
            .eq('id', personId);

          if (deleteError) {
            return new Response(JSON.stringify({ error: deleteError.message }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
      }
    }

    // Search endpoint
    if (path === '/search' && req.method === 'GET') {
      const query = url.searchParams.get('q');
      
      if (!query) {
        return new Response(JSON.stringify({ error: 'Query parameter required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const searchTerm = query.toLowerCase();
      
      const { data: searchResults, error: searchError } = await supabase
        .from('people')
        .select('*')
        .or(`full_name.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%,career_history.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (searchError) {
        return new Response(JSON.stringify({ error: searchError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(searchResults), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});