-- Add google_scopes column to profiles table for OAuth scope tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_scopes TEXT;

-- Update existing users with Google credentials to have current scopes
UPDATE profiles 
SET google_scopes = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/contacts.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid'
WHERE google_access_token IS NOT NULL AND google_scopes IS NULL;
