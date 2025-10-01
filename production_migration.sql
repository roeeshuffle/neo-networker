-- Production Database Migration Script
-- This script updates the production database to match the simplified model structure

-- Step 1: Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_phone_number VARCHAR(255);

-- Step 2: Rename columns to match simplified model
-- Rename 'name' to 'full_name' if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'full_name') THEN
        ALTER TABLE users RENAME COLUMN name TO full_name;
    END IF;
END $$;

-- Rename 'fullname' to 'full_name' if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'fullname') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'full_name') THEN
        ALTER TABLE users RENAME COLUMN fullname TO full_name;
    END IF;
END $$;

-- Rename 'password' to 'password_hash' if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash') THEN
        ALTER TABLE users RENAME COLUMN password TO password_hash;
    END IF;
END $$;

-- Step 3: Migrate data from telegram_users table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'telegram_users') THEN
        UPDATE users 
        SET telegram_id = tu.telegram_id,
            telegram_username = tu.telegram_username
        FROM telegram_users tu 
        WHERE users.id = tu.user_id;
        
        RAISE NOTICE 'Migrated telegram user data';
    END IF;
END $$;

-- Step 4: Drop foreign key constraints from tables we want to drop
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Drop foreign keys from telegram_users
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'telegram_users') THEN
        FOR constraint_record IN 
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'telegram_users' AND constraint_type = 'FOREIGN KEY'
        LOOP
            EXECUTE 'ALTER TABLE telegram_users DROP CONSTRAINT ' || constraint_record.constraint_name;
        END LOOP;
    END IF;
    
    -- Drop foreign keys from companies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
        FOR constraint_record IN 
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'companies' AND constraint_type = 'FOREIGN KEY'
        LOOP
            EXECUTE 'ALTER TABLE companies DROP CONSTRAINT ' || constraint_record.constraint_name;
        END LOOP;
    END IF;
    
    -- Drop foreign keys from shared_data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shared_data') THEN
        FOR constraint_record IN 
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'shared_data' AND constraint_type = 'FOREIGN KEY'
        LOOP
            EXECUTE 'ALTER TABLE shared_data DROP CONSTRAINT ' || constraint_record.constraint_name;
        END LOOP;
    END IF;
END $$;

-- Step 5: Drop unnecessary tables
DROP TABLE IF EXISTS telegram_users CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS shared_data CASCADE;

-- Step 6: Verify final structure
SELECT 'Migration completed successfully!' as status;

-- Show final table structure
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'people', 'tasks', 'events')
ORDER BY table_name, ordinal_position;
