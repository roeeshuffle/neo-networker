-- Get the user ID for guy@wershuffle.com and create their profile
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

-- Also create profile for roee2912@gmail.com if exists
DO $$
DECLARE
    roee_user_id UUID;
BEGIN
    -- Get the user ID for roee2912@gmail.com
    SELECT id INTO roee_user_id 
    FROM auth.users 
    WHERE email = 'roee2912@gmail.com';
    
    -- Insert the profile if the user exists
    IF roee_user_id IS NOT NULL THEN
        INSERT INTO public.profiles (id, email, full_name, is_approved, approved_at, approved_by)
        VALUES (
            roee_user_id,
            'roee2912@gmail.com',
            'Roee Feingold',
            true,
            NOW(),
            (SELECT id FROM auth.users WHERE email = 'guy@wershuffle.com')
        );
    END IF;
END $$;