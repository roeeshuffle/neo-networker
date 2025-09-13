import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { csvData, customMapping } = await req.json()
    
    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const userId = user.id

    // Parse CSV
    const lines = csvData.trim().split('\n')
    if (lines.length <= 1) {
      throw new Error('CSV file must contain headers and data')
    }

    const headers = lines[0].split(',').map((h: string) => h.trim().replace(/"/g, ''))
    
    // Default column mapping for companies
    const defaultMapping: { [key: string]: string } = {
      'record id': 'record',
      'recordid': 'record',
      'id': 'record',
      'record': 'record',
      'company name': 'record',
      'name': 'record',
      'tags': 'tags',
      'tag': 'tags',
      'categories': 'categories',
      'category': 'categories',
      'linkedin': 'linkedin_profile',
      'linkedin_profile': 'linkedin_profile',
      'last interaction': 'last_interaction',
      'last_interaction': 'last_interaction',
      'connection strength': 'connection_strength',
      'connection_strength': 'connection_strength',
      'twitter follower count': 'twitter_follower_count',
      'twitter_follower_count': 'twitter_follower_count',
      'twitter': 'twitter',
      'domains': 'domains',
      'domain': 'domains',
      'description': 'description',
      'desc': 'description',
      'created at': 'created_at',
      'created_at': 'created_at',
      'notion_id': 'notion_id',
      'notion id': 'notion_id',
      'notion': 'notion_id'
    }

    // Merge with custom mapping
    const finalMapping = { ...defaultMapping, ...customMapping }

    // Function to parse CSV line properly handling quoted values
    function parseCSVLine(line: string): string[] {
      const result = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      
      result.push(current.trim())
      return result
    }

    const records = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      const record: any = {
        owner_id: userId,
        created_by: userId
      }
      
      headers.forEach((header, index) => {
        const dbColumn = finalMapping[header.toLowerCase()]
        if (dbColumn && values[index]) {
          let value = values[index].replace(/"/g, '').trim()
          
          // Handle specific field types
          if (dbColumn === 'record' && value) {
            record.record = value
          } else if (dbColumn === 'tags' && value) {
            // Convert comma-separated string to array
            record.tags = value.split(';').map(tag => tag.trim()).filter(Boolean)
          } else if (dbColumn === 'domains' && value) {
            // Convert comma-separated string to array
            record.domains = value.split(';').map(domain => domain.trim()).filter(Boolean)
          } else if (dbColumn === 'twitter_follower_count' && value) {
            // Convert to integer
            const count = parseInt(value.replace(/,/g, ''), 10)
            if (!isNaN(count)) {
              record.twitter_follower_count = count
            }
          } else if (dbColumn === 'last_interaction' && value) {
            // Try to parse date
            const date = new Date(value)
            if (!isNaN(date.getTime())) {
              record.last_interaction = date.toISOString()
            }
          } else if (value) {
            record[dbColumn] = value
          }
        }
      })
      
      // Only add records that have at least a record name
      if (record.record) {
        records.push(record)
      }
    }

    if (records.length === 0) {
      throw new Error('No valid records found in CSV')
    }

    // Insert into companies table
    const { error: insertError } = await supabaseClient
      .from('companies')
      .insert(records)

    if (insertError) {
      console.error('Insert error:', insertError)
      throw insertError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        imported: records.length,
        message: `Successfully imported ${records.length} companies`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error processing CSV:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})