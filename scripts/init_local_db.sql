-- Local Database Initialization Script
-- This script sets up the local development database

-- Create database if it doesn't exist (PostgreSQL will create it automatically)
-- But we can add any initial setup here

-- Create a test admin user
-- Note: This will be handled by the application, but we can add any initial data here

-- Add any initial data or configurations for local development
-- For example, you might want to add some test data

-- Example: Insert a test user (password: '123456')
-- INSERT INTO profiles (id, full_name, email, password_hash, is_approved, created_at, updated_at)
-- VALUES (
--     'test-user-id',
--     'Test User',
--     'test@localhost',
--     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2K', -- '123456'
--     true,
--     NOW(),
--     NOW()
-- ) ON CONFLICT (email) DO NOTHING;

-- The application will handle user creation through the API
-- This script is mainly for any database-level configurations
