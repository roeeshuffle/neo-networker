-- Create user_groups table
CREATE TABLE IF NOT EXISTS user_groups (
    id SERIAL PRIMARY KEY,
    owner_id VARCHAR(36) NOT NULL REFERENCES profiles(id),
    member_email VARCHAR(255) NOT NULL,
    member_name VARCHAR(255),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_owner_member UNIQUE (owner_id, member_email)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_groups_owner_id ON user_groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_user_groups_member_email ON user_groups(member_email);

-- Verify table was created
SELECT 'user_groups table created successfully' as status;
