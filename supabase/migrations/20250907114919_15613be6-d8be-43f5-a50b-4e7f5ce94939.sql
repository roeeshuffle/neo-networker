-- Clear all existing user data from profiles table
DELETE FROM public.profiles;

-- Update the trigger function to automatically approve guy@wershuffle.com
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, is_approved, approved_at)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Admin User'),
    CASE 
      WHEN NEW.email = 'guy@wershuffle.com' THEN true 
      ELSE false 
    END,
    CASE 
      WHEN NEW.email = 'guy@wershuffle.com' THEN NOW() 
      ELSE NULL 
    END
  );
  RETURN NEW;
END;
$$;