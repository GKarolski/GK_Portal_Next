-- RUN THIS IN SUPABASE SQL EDITOR TO FIX YOUR ADMIN PERMISSIONS

-- 1. Get your User ID (You can find it in Authentication -> Users)
-- Or just run this which targets the currently logged-in user in the SQL Editor
DO $$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  -- If you are running this in the SQL Editor, auth.uid() might be null.
  -- In that case, manually replace 'YOUR_USER_ID_HERE' with your ID from the Auth tab.
  -- current_user_id := 'YOUR_USER_ID_HERE'; 

  IF current_user_id IS NOT NULL THEN
    -- A) Update your role in the profiles table
    UPDATE public.profiles 
    SET role = 'ADMIN', is_active = TRUE 
    WHERE id = current_user_id;

    -- B) Update your metadata in auth.users (so our new is_admin() function works)
    UPDATE auth.users 
    SET raw_user_meta_data = raw_user_meta_data || '{"role": "ADMIN"}'::jsonb
    WHERE id = current_user_id;
    
    RAISE NOTICE 'Uprawnienia Admina zostały zaktualizowane dla użytkownika %', current_user_id;
  ELSE
    RAISE EXCEPTION 'Nie wykryto ID użytkownika. Wklej swoje ID ręcznie w skrypcie.';
  END IF;
END $$;
