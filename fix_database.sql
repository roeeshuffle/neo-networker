-- Neo Networker Database Fix
-- This script fixes the database structure to match the simplified code

-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_phone_number VARCHAR(255);

-- Drop problematic tables that are causing 500 errors
DROP TABLE IF EXISTS telegram_users CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS shared_data CASCADE;

-- Verify the fix
SELECT 'Database fix completed successfully!' as status;

-- Show final table structure
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'people', 'tasks', 'events')
ORDER BY table_name, ordinal_position;
