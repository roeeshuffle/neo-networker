-- Fix security issue: Implement user-specific access controls for tasks

-- First, make created_by non-nullable and set default to current user (only if it's not already set)
DO $$ 
BEGIN 
  -- Only modify if column is nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' 
    AND column_name = 'created_by' 
    AND is_nullable = 'YES'
  ) THEN
    -- Update existing NULL values first
    UPDATE public.tasks 
    SET created_by = (
      SELECT id FROM auth.users 
      WHERE email = 'guy@wershuffle.com' 
      LIMIT 1
    ) 
    WHERE created_by IS NULL;
    
    -- Then make column non-nullable with default
    ALTER TABLE public.tasks 
    ALTER COLUMN created_by SET NOT NULL,
    ALTER COLUMN created_by SET DEFAULT auth.uid();
  END IF;
END $$;

-- Drop ALL existing policies for tasks table
DO $$ 
DECLARE 
  policy_name TEXT;
BEGIN 
  FOR policy_name IN 
    SELECT pol.polname 
    FROM pg_policy pol 
    JOIN pg_class cls ON pol.polrelid = cls.oid 
    WHERE cls.relname = 'tasks'
  LOOP 
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.tasks', policy_name);
  END LOOP;
END $$;

-- Create secure, user-specific policies

-- Users can view tasks they created or tasks assigned to their email
CREATE POLICY "Users can view their own tasks or assigned tasks" 
ON public.tasks 
FOR SELECT 
USING (
  created_by = auth.uid() OR
  assign_to = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Users can insert their own tasks (created_by will be automatically set)
CREATE POLICY "Users can create their own tasks" 
ON public.tasks 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

-- Users can update tasks they created or tasks assigned to them
CREATE POLICY "Users can update their own tasks or assigned tasks" 
ON public.tasks 
FOR UPDATE 
USING (
  created_by = auth.uid() OR
  assign_to = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Users can delete tasks they created
CREATE POLICY "Users can delete their own tasks" 
ON public.tasks 
FOR DELETE 
USING (created_by = auth.uid());

-- Admin users can access all tasks (for administrative purposes)
CREATE POLICY "Admins can access all tasks" 
ON public.tasks 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'guy@wershuffle.com'
  )
);