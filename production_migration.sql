-- Production Database Migration Script
-- Run this script on your production database before deploying the new code

-- Add Stripe customer ID to users table for subscription management
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);

-- Add Google Calendar sync fields to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS google_event_id VARCHAR(255);
ALTER TABLE events ADD COLUMN IF NOT EXISTS google_sync BOOLEAN DEFAULT TRUE;

-- Create index on stripe_customer_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);

-- Create index on google_event_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_events_google_event_id ON events(google_event_id);

-- Verify the changes
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name IN ('profiles', 'events') 
    AND column_name IN ('stripe_customer_id', 'google_event_id', 'google_sync')
ORDER BY table_name, column_name;
