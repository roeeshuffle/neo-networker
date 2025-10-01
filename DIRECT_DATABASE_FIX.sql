-- DIRECT DATABASE FIX SCRIPT
-- This script directly fixes the database schema issues

-- Fix tasks table
-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add title column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'title') THEN
        ALTER TABLE tasks ADD COLUMN title VARCHAR(255);
        UPDATE tasks SET title = COALESCE(text, 'Untitled Task') WHERE title IS NULL;
        ALTER TABLE tasks ALTER COLUMN title SET NOT NULL;
    END IF;

    -- Add description column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'description') THEN
        ALTER TABLE tasks ADD COLUMN description TEXT;
    END IF;

    -- Add project column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'project') THEN
        ALTER TABLE tasks ADD COLUMN project VARCHAR(100);
        UPDATE tasks SET project = 'personal' WHERE project IS NULL;
        ALTER TABLE tasks ALTER COLUMN project SET NOT NULL;
    END IF;

    -- Add scheduled_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'scheduled_date') THEN
        ALTER TABLE tasks ADD COLUMN scheduled_date TIMESTAMP;
    END IF;

    -- Add is_scheduled column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'is_scheduled') THEN
        ALTER TABLE tasks ADD COLUMN is_scheduled BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'is_active') THEN
        ALTER TABLE tasks ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Fix events table
-- Create events table if it doesn't exist
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_datetime TIMESTAMP NOT NULL,
    end_datetime TIMESTAMP NOT NULL,
    location VARCHAR(255),
    event_type VARCHAR(50) DEFAULT 'event',
    participants JSON,
    alert_minutes INTEGER DEFAULT 15,
    repeat_pattern VARCHAR(50),
    repeat_interval INTEGER DEFAULT 1,
    repeat_days JSON,
    repeat_end_date TIMESTAMP,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(36) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES profiles(id)
);

-- Add event_type column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'event_type') THEN
        ALTER TABLE events ADD COLUMN event_type VARCHAR(50) DEFAULT 'event';
    END IF;
END $$;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS ix_events_id ON events (id);

-- Verify the fix
SELECT 'Tasks table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY column_name;

SELECT 'Events table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY column_name;
