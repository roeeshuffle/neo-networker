-- Create profile for the confirmed guy@wershuffle.com user
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the user ID for guy@wershuffle.com
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'guy@wershuffle.com';
    
    -- Insert the profile if the user exists
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.profiles (id, email, full_name, is_approved, approved_at, approved_by)
        VALUES (
            admin_user_id,
            'guy@wershuffle.com',
            'Admin User',
            true,
            NOW(),
            admin_user_id
        );
    END IF;
END $$;