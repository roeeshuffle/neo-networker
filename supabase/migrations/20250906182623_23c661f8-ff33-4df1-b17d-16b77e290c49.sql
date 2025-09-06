-- Create table for authenticated telegram users
CREATE TABLE public.telegram_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  telegram_id BIGINT NOT NULL UNIQUE,
  telegram_username TEXT,
  first_name TEXT,
  is_authenticated BOOLEAN DEFAULT FALSE,
  authenticated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;

-- Create policies for telegram users
CREATE POLICY "Authenticated users can view telegram users" 
ON public.telegram_users 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert telegram users" 
ON public.telegram_users 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update telegram users" 
ON public.telegram_users 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_telegram_users_updated_at
    BEFORE UPDATE ON public.telegram_users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster telegram_id lookups
CREATE INDEX idx_telegram_users_telegram_id ON public.telegram_users(telegram_id);