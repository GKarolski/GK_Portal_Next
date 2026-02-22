-- RUN THIS IN SUPABASE SQL EDITOR TO FIX YOUR ADMIN PERMISSIONS
-- 1. Go to your Supabase Dashboard -> Authentication -> Users
-- 2. Copy the "User ID" (UUID) for your account
-- 3. Replace 'TWOJE_ID_TUTAJ' below with that ID

BEGIN;
  -- Update your role in the profiles table
  UPDATE public.profiles 
  SET role = 'ADMIN', is_active = TRUE 
  WHERE id = 'TWOJE_ID_TUTAJ';

  -- Update your metadata in auth.users (important for RLS functions)
  UPDATE auth.users 
  SET raw_user_meta_data = raw_user_meta_data || '{"role": "ADMIN"}'::jsonb
  WHERE id = 'TWOJE_ID_TUTAJ';
COMMIT;

-- After running this, run a SELECT to verify:
-- SELECT id, name, role FROM public.profiles WHERE role = 'ADMIN';
