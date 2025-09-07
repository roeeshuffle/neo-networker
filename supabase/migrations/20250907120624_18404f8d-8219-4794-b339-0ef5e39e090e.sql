-- Drop the problematic policies
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.profiles;

-- Create a security definer function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'guy@wershuffle.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Create new policies using the function
CREATE POLICY "Admin can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin() OR auth.uid() = id);

CREATE POLICY "Admin can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.is_admin());