-- Function to auto-promote admin by email on signup
CREATE OR REPLACE FUNCTION public.grant_admin_if_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NEW.email = 'admin@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    UPDATE public.profiles
    SET account_status = 'approved'
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_grant_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_grant_admin
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE PROCEDURE public.grant_admin_if_email();

-- Harden categories timestamp function with fixed search_path
CREATE OR REPLACE FUNCTION public.update_categories_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;