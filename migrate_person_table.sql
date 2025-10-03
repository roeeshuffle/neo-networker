-- Migration script to update the people table with new schema
-- This script will:
-- 1. Drop the old table and recreate with new structure
-- 2. Preserve existing data where possible
-- 3. Set up proper indexes and constraints

-- First, create a backup of existing data
CREATE TABLE people_backup AS SELECT * FROM people;

-- Drop the old table
DROP TABLE people CASCADE;

-- Create the new people table with updated schema
CREATE TABLE people (
    -- Core Identifiers
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    birthday DATE,
    
    -- Professional Info
    organization VARCHAR(255),  -- company / affiliation
    job_title VARCHAR(255),
    job_status VARCHAR(20) CHECK (job_status IN ('employed', 'unemployed', 'student', 'retired', 'other')),
    
    -- Communication Info
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(255),
    mobile VARCHAR(255),
    address TEXT,
    
    -- Social & Online Profiles
    linkedin_url VARCHAR(500),
    github_url VARCHAR(500),
    facebook_url VARCHAR(500),
    twitter_url VARCHAR(500),
    website_url VARCHAR(500),
    
    -- Connection Management Metadata
    notes TEXT,  -- free text for relationship context
    source VARCHAR(255),  -- how you got the contact (event, referral, etc.)
    tags TEXT,  -- labels/categories
    last_contact_date TIMESTAMP,
    next_follow_up_date TIMESTAMP,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'prospect', 'client', 'partner')),
    priority VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high')),
    group VARCHAR(255),  -- favourites, job, friends, etc.
    
    -- System Metadata
    owner_id VARCHAR(36) NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_people_owner_id ON people(owner_id);
CREATE INDEX idx_people_email ON people(email);
CREATE INDEX idx_people_status ON people(status);
CREATE INDEX idx_people_group ON people(group);
CREATE INDEX idx_people_source ON people(source);

-- Migrate existing data (where possible)
INSERT INTO people (
    id, first_name, last_name, email, organization, job_title, 
    notes, tags, status, owner_id, created_at, updated_at, source
)
SELECT 
    CASE 
        WHEN id ~ '^[0-9]+$' THEN id::INTEGER
        ELSE ROW_NUMBER() OVER (ORDER BY created_at)
    END as id,
    CASE 
        WHEN full_name IS NOT NULL AND full_name != '' THEN
            CASE 
                WHEN position(' ' in full_name) > 0 THEN 
                    split_part(full_name, ' ', 1)
                ELSE full_name
            END
        ELSE NULL
    END as first_name,
    CASE 
        WHEN full_name IS NOT NULL AND full_name != '' THEN
            CASE 
                WHEN position(' ' in full_name) > 0 THEN 
                    trim(substring(full_name from position(' ' in full_name) + 1))
                ELSE NULL
            END
        ELSE NULL
    END as last_name,
    email,
    company as organization,
    job_title,
    COALESCE(more_info, '') as notes,
    COALESCE(tags, '') as tags,
    COALESCE(status, 'active') as status,
    owner_id,
    COALESCE(created_at, CURRENT_TIMESTAMP) as created_at,
    COALESCE(updated_at, CURRENT_TIMESTAMP) as updated_at,
    'migrated' as source
FROM people_backup
WHERE owner_id IS NOT NULL;

-- Update the sequence to continue from the highest ID
SELECT setval('people_id_seq', (SELECT MAX(id) FROM people));

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_people_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_people_updated_at
    BEFORE UPDATE ON people
    FOR EACH ROW
    EXECUTE FUNCTION update_people_updated_at();

-- Drop the backup table after successful migration
-- DROP TABLE people_backup;
