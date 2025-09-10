-- Update handle_new_user trigger to support Google OAuth data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;