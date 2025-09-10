-- Remove personal restrictions - allow all authenticated users to see all contacts and tasks

-- Drop all existing policies for people table
DO $$ 
DECLARE 
  policy_name TEXT;
BEGIN 
  FOR policy_name IN 
    SELECT pol.polname 
    FROM pg_policy pol 
    JOIN pg_class cls ON pol.polrelid = cls.oid 
    WHERE cls.relname = 'people'
  LOOP 
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.people', policy_name);
  END LOOP;
END $$;

-- Drop all existing policies for tasks table
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

-- Create open policies for people table - all authenticated users can access all contacts
CREATE POLICY "Authenticated users can view all contacts" 
ON public.people 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create contacts" 
ON public.people 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update all contacts" 
ON public.people 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete all contacts" 
ON public.people 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- Create open policies for tasks table - all authenticated users can access all tasks
CREATE POLICY "Authenticated users can view all tasks" 
ON public.tasks 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create tasks" 
ON public.tasks 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update all tasks" 
ON public.tasks 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete all tasks" 
ON public.tasks 
FOR DELETE 
USING (auth.role() = 'authenticated');