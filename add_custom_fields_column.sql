-- Add custom_fields column to profiles table
-- This script adds the missing column that the User model expects

-- Check if column exists first
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'custom_fields'
    ) THEN
        ALTER TABLE profiles ADD COLUMN custom_fields JSON;
        RAISE NOTICE 'Column custom_fields added to profiles table';
    ELSE
        RAISE NOTICE 'Column custom_fields already exists in profiles table';
    END IF;
END $$;
