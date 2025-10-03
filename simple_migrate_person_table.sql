-- Simple migration script to create new people table structure
-- This will drop the old table and create the new one without data migration

-- Drop the old table
DROP TABLE IF EXISTS people CASCADE;

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
    
    -- Custom Fields (JSON)
    custom_fields JSONB,
    
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

-- Success message
SELECT 'People table migration completed successfully!' as message;
