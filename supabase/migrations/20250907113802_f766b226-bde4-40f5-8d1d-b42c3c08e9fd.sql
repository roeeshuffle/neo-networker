-- Fix infinite recursion in RLS policies by dropping and recreating them
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.profiles;

-- Create simpler, non-recursive policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Admin can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (email = 'guy@wershuffle.com');

CREATE POLICY "Admin can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (email = 'guy@wershuffle.com');

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);