-- Add owner column to existing tables and create sharing functionality

-- Add owner column to people table
ALTER TABLE public.people 
ADD COLUMN owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add owner column to tasks table  
ALTER TABLE public.tasks
ADD COLUMN owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing records to have an owner (set to first admin user for now)
UPDATE public.people SET owner_id = (SELECT id FROM auth.users WHERE email = 'guy@wershuffle.com' LIMIT 1) WHERE owner_id IS NULL;
UPDATE public.tasks SET owner_id = (SELECT id FROM auth.users WHERE email = 'guy@wershuffle.com' LIMIT 1) WHERE owner_id IS NULL;

-- Make owner_id NOT NULL after setting defaults
ALTER TABLE public.people ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE public.tasks ALTER COLUMN owner_id SET NOT NULL;

-- Create shared_with table for managing data sharing
CREATE TABLE public.shared_data (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shared_with_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    table_name text NOT NULL,
    record_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(owner_id, shared_with_user_id, table_name, record_id)
);

-- Enable RLS on shared_data table
ALTER TABLE public.shared_data ENABLE ROW LEVEL SECURITY;

-- Create policies for shared_data table
CREATE POLICY "Users can view their own shared data" 
ON public.shared_data 
FOR SELECT 
USING (auth.uid() = owner_id OR auth.uid() = shared_with_user_id);

CREATE POLICY "Users can create their own shared data" 
ON public.shared_data 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own shared data" 
ON public.shared_data 
FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own shared data" 
ON public.shared_data 
FOR DELETE 
USING (auth.uid() = owner_id);

-- Update RLS policies for people table to include sharing
DROP POLICY IF EXISTS "Authenticated users can view all contacts" ON public.people;
DROP POLICY IF EXISTS "Authenticated users can create contacts" ON public.people;
DROP POLICY IF EXISTS "Authenticated users can update all contacts" ON public.people;
DROP POLICY IF EXISTS "Authenticated users can delete all contacts" ON public.people;

CREATE POLICY "Users can view their own and shared contacts" 
ON public.people 
FOR SELECT 
USING (
    auth.uid() = owner_id 
    OR EXISTS (
        SELECT 1 FROM public.shared_data 
        WHERE shared_data.table_name = 'people' 
        AND shared_data.record_id = people.id 
        AND shared_data.shared_with_user_id = auth.uid()
    )
);

CREATE POLICY "Users can create their own contacts" 
ON public.people 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own contacts" 
ON public.people 
FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own contacts" 
ON public.people 
FOR DELETE 
USING (auth.uid() = owner_id);

-- Update RLS policies for tasks table to include sharing
DROP POLICY IF EXISTS "Authenticated users can view all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can update all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can delete all tasks" ON public.tasks;

CREATE POLICY "Users can view their own and shared tasks" 
ON public.tasks 
FOR SELECT 
USING (
    auth.uid() = owner_id 
    OR EXISTS (
        SELECT 1 FROM public.shared_data 
        WHERE shared_data.table_name = 'tasks' 
        AND shared_data.record_id = tasks.id 
        AND shared_data.shared_with_user_id = auth.uid()
    )
);

CREATE POLICY "Users can create their own tasks" 
ON public.tasks 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own tasks" 
ON public.tasks 
FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own tasks" 
ON public.tasks 
FOR DELETE 
USING (auth.uid() = owner_id);

-- Add admin role check function for the two specified admins
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email IN ('guy@wershuffle.com', 'roee2912@gmail.com')
  );
$$;

-- Add profile picture URL to profiles table
ALTER TABLE public.profiles 
ADD COLUMN avatar_url text,
ADD COLUMN provider text DEFAULT 'email';

-- Create trigger for automatic timestamp updates on shared_data
CREATE TRIGGER update_shared_data_updated_at
BEFORE UPDATE ON public.shared_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();