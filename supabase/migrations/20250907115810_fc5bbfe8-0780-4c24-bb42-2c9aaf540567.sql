-- Create profile for guy@wershuffle.com
INSERT INTO public.profiles (id, email, full_name, is_approved, approved_at)
SELECT 
  id,
  'guy@wershuffle.com',
  'Admin User',
  true,
  NOW()
FROM auth.users 
WHERE email = 'guy@wershuffle.com';