-- Update the existing guy@wershuffle.com user to be email confirmed
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'guy@wershuffle.com';