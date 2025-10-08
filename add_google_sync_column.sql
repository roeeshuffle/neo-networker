-- Add google_sync column to events table
-- This script adds the google_sync column with default value TRUE

-- Check if column exists first
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'google_sync'
    ) THEN
        ALTER TABLE events ADD COLUMN google_sync BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'google_sync column added successfully';
    ELSE
        RAISE NOTICE 'google_sync column already exists';
    END IF;
END $$;
