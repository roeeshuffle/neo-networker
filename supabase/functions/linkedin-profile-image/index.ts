import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  linkedin_url: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { linkedin_url }: RequestBody = await req.json();

    if (!linkedin_url) {
      return new Response(
        JSON.stringify({ error: 'LinkedIn URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate LinkedIn URL format
    if (!linkedin_url.includes('linkedin.com/in/')) {
      return new Response(
        JSON.stringify({ error: 'Invalid LinkedIn profile URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching profile image for: ${linkedin_url}`);

    // Headers to mimic a real browser request
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };

    // Fetch the LinkedIn profile page
    const response = await fetch(linkedin_url, { headers });

    if (!response.ok) {
      console.error(`Failed to fetch LinkedIn page: ${response.status} ${response.statusText}`);
      return new Response(
        JSON.stringify({ error: 'Failed to load LinkedIn profile page', profile_image_url: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();
    
    // Parse HTML to find profile image
    const profileImageUrl = extractProfileImage(html);

    if (profileImageUrl) {
      console.log(`Found profile image: ${profileImageUrl}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          profile_image_url: profileImageUrl,
          linkedin_url 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.log('No profile image found or profile is private');
      return new Response(
        JSON.stringify({ 
          success: false, 
          profile_image_url: null,
          message: 'Profile image not found or profile is private',
          linkedin_url 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error processing LinkedIn profile:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        profile_image_url: null,
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extractProfileImage(html: string): string | null {
  try {
    // Look for various patterns where LinkedIn profile images might be stored
    const patterns = [
      // Main profile picture patterns
      /"https:\/\/media\.licdn\.com\/dms\/image\/[^"]*"/g,
      /"https:\/\/media-exp\d*\.licdn\.com\/dms\/image\/[^"]*"/g,
      // Backup patterns for profile images
      /class="pv-top-card-profile-picture__image[^"]*"[^>]*src="([^"]*)"/g,
      /class="profile-photo-edit__preview"[^>]*src="([^"]*)"/g,
      // Generic LinkedIn image patterns
      /"https:\/\/media\.licdn\.com\/[^"]*profile[^"]*"/g,
    ];

    for (const pattern of patterns) {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        // Extract the URL from the match (remove quotes and clean up)
        let imageUrl = matches[0].replace(/"/g, '');
        
        // If it's from a src attribute, extract just the URL
        if (imageUrl.includes('src=')) {
          const srcMatch = imageUrl.match(/src="([^"]*)"/);
          if (srcMatch) {
            imageUrl = srcMatch[1];
          }
        }

        // Validate that it's a proper LinkedIn media URL
        if (imageUrl.includes('media.licdn.com') && 
            (imageUrl.includes('image') || imageUrl.includes('profile'))) {
          // Clean up any additional parameters and ensure it's a proper image URL
          const cleanUrl = imageUrl.split('&')[0].split('?')[0];
          return cleanUrl;
        }
      }
    }

    // Fallback: look for any img tag with LinkedIn profile indicators
    const imgTagPattern = /<img[^>]*src="([^"]*)"[^>]*(?:class="[^"]*profile[^"]*"|alt="[^"]*profile[^"]*")/gi;
    const imgMatches = html.match(imgTagPattern);
    
    if (imgMatches) {
      for (const imgMatch of imgMatches) {
        const srcMatch = imgMatch.match(/src="([^"]*)"/);
        if (srcMatch && srcMatch[1].includes('licdn.com')) {
          return srcMatch[1];
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting profile image:', error);
    return null;
  }
}