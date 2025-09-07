-- Update the existing profile for guy@wershuffle.com to be approved
UPDATE public.profiles 
SET 
  is_approved = true,
  approved_at = NOW()
WHERE email = 'guy@wershuffle.com';