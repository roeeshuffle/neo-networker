-- Delete the existing guy@wershuffle.com user and their profile
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the user ID for guy@wershuffle.com
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'guy@wershuffle.com';
    
    -- Delete from profiles first (due to foreign key)
    IF admin_user_id IS NOT NULL THEN
        DELETE FROM public.profiles WHERE id = admin_user_id;
    END IF;
END $$;

-- Delete from auth.users (this will cascade)
DELETE FROM auth.users WHERE email = 'guy@wershuffle.com';