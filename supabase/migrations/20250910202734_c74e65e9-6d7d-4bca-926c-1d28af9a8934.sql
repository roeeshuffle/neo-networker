-- Add roee2912@gmail.com to admin users
CREATE OR REPLACE FUNCTION public.is_admin_user()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email IN ('guy@wershuffle.com', 'roee2912@gmail.com')
  );
$function$;

-- Update the is_admin function to include roee2912@gmail.com
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email IN ('guy@wershuffle.com', 'roee2912@gmail.com')
  );
END;
$function$;

-- Update the handle_new_user function to auto-approve roee2912@gmail.com
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, provider, is_approved, approved_at)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name', 
      NEW.raw_user_meta_data ->> 'user_name',
      'User'
    ),
    NEW.raw_user_meta_data ->> 'avatar_url',
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'provider' IS NOT NULL THEN NEW.raw_user_meta_data ->> 'provider'
      WHEN NEW.raw_user_meta_data ->> 'avatar_url' IS NOT NULL THEN 'google'
      ELSE 'email'
    END,
    CASE 
      WHEN NEW.email IN ('guy@wershuffle.com', 'roee2912@gmail.com') THEN true 
      ELSE false 
    END,
    CASE 
      WHEN NEW.email IN ('guy@wershuffle.com', 'roee2912@gmail.com') THEN NOW() 
      ELSE NULL 
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    provider = COALESCE(EXCLUDED.provider, profiles.provider);
  
  RETURN NEW;
END;
$function$;