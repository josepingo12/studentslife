-- Allow authenticated users to view partner profiles for discovery
CREATE POLICY "Authenticated users can view partner profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = profiles.id
    AND user_roles.role = 'partner'::app_role
  )
);