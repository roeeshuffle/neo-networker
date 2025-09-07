-- Create guy@wershuffle.com directly with confirmed email
-- Note: This requires inserting into auth.users with proper password hash
-- We'll use a simpler approach by creating a confirmed user

INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  is_sso_user,
  aud,
  role
) VALUES (
  gen_random_uuid(),
  'guy@wershuffle.com',
  crypt('123456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"full_name": "Admin User"}',
  false,
  'authenticated',
  'authenticated'
);