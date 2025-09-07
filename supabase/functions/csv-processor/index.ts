import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { csvData } = await req.json();

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse CSV data - handle both comma and comma+space separators
    const lines = csvData.trim().split('\n');
    
    // More robust CSV parsing that handles quoted values
    const parseCSVLine = (line: string): string[] => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]).map((h: string) => h.replace(/"/g, ''));
    
    // Create mapping from CSV headers to database columns
    const columnMapping: { [key: string]: string } = {
      'Full Name': 'full_name',
      'full name': 'full_name',
      'fullname': 'full_name',
      'name': 'full_name',
      'Categories': 'categories',
      'categories': 'categories',
      'category': 'categories',
      'E-mail': 'email',
      'Email': 'email',
      'email': 'email',
      'Newsletter': 'newsletter',
      'newsletter': 'newsletter',
      'Company': 'company',
      'company': 'company',
      'Status': 'status',
      'status': 'status',
      'Linkedin': 'linkedin_profile',
      'LinkedIn': 'linkedin_profile',
      'linkedin': 'linkedin_profile',
      'linkedin_profile': 'linkedin_profile',
      'POC in APEX': 'poc_in_apex',
      'poc in apex': 'poc_in_apex',
      'poc_in_apex': 'poc_in_apex',
      'Who warm intro': 'who_warm_intro',
      'who warm intro': 'who_warm_intro',
      'who_warm_intro': 'who_warm_intro',
      'Agenda': 'agenda',
      'agenda': 'agenda',
      'Meeting Notes': 'meeting_notes',
      'meeting notes': 'meeting_notes',
      'meeting_notes': 'meeting_notes',
      'Should Avishag meet?': 'should_avishag_meet',
      'should avishag meet': 'should_avishag_meet',
      'should_avishag_meet': 'should_avishag_meet',
      'More info': 'more_info',
      'more info': 'more_info',
      'more_info': 'more_info'
    };

    const records = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]).map((v: string) => v.replace(/"/g, ''));
      const record: any = {};
      
      headers.forEach((header: string, index: number) => {
        const dbColumn = columnMapping[header.toLowerCase()] || columnMapping[header];
        if (dbColumn && values[index] !== undefined) {
          let value = values[index];
          
          // Validate full name is text
          if (dbColumn === 'full_name' && (!value || value.trim() === '')) {
            return; // Skip this record
          }
          
          // Validate email
          if (dbColumn === 'email' && value && !value.includes('@')) {
            value = ''; // Clear invalid email
          }
          
          // Validate LinkedIn URL
          if (dbColumn === 'linkedin_profile' && value && !value.toLowerCase().includes('linkedin')) {
            value = ''; // Clear invalid LinkedIn URL
          }
          
          // Handle boolean fields
          if (dbColumn === 'newsletter' || dbColumn === 'should_avishag_meet') {
            value = value.toLowerCase() === 'true' || value.toLowerCase() === 'yes' || value === '1';
          }
          
          record[dbColumn] = value;
        }
      });
      
      // Only add records that have at least a full_name
      if (record.full_name) {
        records.push(record);
      }
    }

    // Insert records into database
    const { data, error } = await supabaseClient
      .from('people')
      .insert(records);

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        imported: records.length,
        message: `Successfully imported ${records.length} records`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in csv-processor function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});