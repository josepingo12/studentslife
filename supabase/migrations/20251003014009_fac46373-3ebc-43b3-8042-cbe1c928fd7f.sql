-- Update get_user_role to return highest priority role (admin > partner > client)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role
    WHEN 'admin'::app_role THEN 1
    WHEN 'partner'::app_role THEN 2
    WHEN 'client'::app_role THEN 3
    ELSE 4
  END
  LIMIT 1
$$;