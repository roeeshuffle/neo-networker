-- Update existing guy@wershuffle.com to be email confirmed
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  encrypted_password = crypt('123456', gen_salt('bf'))
WHERE email = 'guy@wershuffle.com';