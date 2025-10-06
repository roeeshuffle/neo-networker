-- Add group column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS group JSON;

-- Update existing users to have empty group array
UPDATE profiles SET group = '[]'::json WHERE group IS NULL;
