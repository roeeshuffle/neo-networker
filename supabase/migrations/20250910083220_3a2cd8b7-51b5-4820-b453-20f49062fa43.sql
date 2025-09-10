-- Fix security issue: Implement user-specific access controls for tasks

-- First, make created_by non-nullable and set default to current user
ALTER TABLE public.tasks 
ALTER COLUMN created_by SET NOT NULL,
ALTER COLUMN created_by SET DEFAULT auth.uid();

-- Update existing tasks that have null created_by (set to a system user or admin)
UPDATE public.tasks 
SET created_by = (
  SELECT id FROM auth.users 
  WHERE email = 'guy@wershuffle.com' 
  LIMIT 1
) 
WHERE created_by IS NULL;

-- Drop the overly permissive existing policies
DROP POLICY IF EXISTS "Authenticated users can view all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can delete tasks" ON public.tasks;

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