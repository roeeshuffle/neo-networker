-- Database Schema Fix Script
-- Run this directly on your PostgreSQL database to fix the schema issues

-- Add missing columns to tasks table (only if they don't exist)
DO $$ 
BEGIN
    -- Add title column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'title') THEN
        ALTER TABLE tasks ADD COLUMN title VARCHAR(255);
        UPDATE tasks SET title = COALESCE(text, 'Untitled Task') WHERE title IS NULL;
        ALTER TABLE tasks ALTER COLUMN title SET NOT NULL;
    END IF;
    
    -- Add description column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'description') THEN
        ALTER TABLE tasks ADD COLUMN description TEXT;
    END IF;
    
    -- Add project column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'project') THEN
        ALTER TABLE tasks ADD COLUMN project VARCHAR(100);
        UPDATE tasks SET project = 'personal' WHERE project IS NULL;
        ALTER TABLE tasks ALTER COLUMN project SET NOT NULL;
    END IF;
    
    -- Add scheduled_date column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'scheduled_date') THEN
        ALTER TABLE tasks ADD COLUMN scheduled_date TIMESTAMP;
    END IF;
    
    -- Add is_scheduled column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'is_scheduled') THEN
        ALTER TABLE tasks ADD COLUMN is_scheduled BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add is_active column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'is_active') THEN
        ALTER TABLE tasks ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

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

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS ix_events_id ON events (id);

-- Add event_type column to events table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'event_type') THEN
        ALTER TABLE events ADD COLUMN event_type VARCHAR(50) DEFAULT 'event';
    END IF;
END $$;

-- Update alembic version to mark migration as complete
INSERT INTO alembic_version (version_num) VALUES ('e4b455227745') ON CONFLICT (version_num) DO NOTHING;

-- Success message
SELECT 'Database schema fixed successfully!' as message;
