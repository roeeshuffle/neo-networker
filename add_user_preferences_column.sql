-- Add user_preferences column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_preferences JSON;
