-- Add current_state column to telegram_users table to track user conversation state
ALTER TABLE public.telegram_users 
ADD COLUMN current_state TEXT DEFAULT 'idle',
ADD COLUMN state_data JSONB DEFAULT '{}';