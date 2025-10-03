-- This SQL will be used to assign admin role after registration
-- First, you need to register at /register-client or /register-partner with admin@gmail.com
-- Then run this SQL to make that user an admin

-- Create a function to set admin role by email
CREATE OR REPLACE FUNCTION public.set_admin_by_email(_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
BEGIN
  -- Get user id from email
  SELECT id INTO _user_id
  FROM auth.users
  WHERE email = _email;
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', _email;
  END IF;
  
  -- Insert admin role if not exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Update profile status to approved
  UPDATE public.profiles
  SET account_status = 'approved'
  WHERE id = _user_id;
END;
$$;

-- Now set admin@gmail.com as admin (will work after user registers)
-- This will fail silently if user doesn't exist yet
DO $$
BEGIN
  PERFORM public.set_admin_by_email('admin@gmail.com');
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignore error if user doesn't exist yet
END $$;