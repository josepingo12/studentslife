-- Fix RLS policy to allow users to insert their own role during registration
-- Drop the restrictive admin-only insert policy
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;

-- Create new policy that allows users to insert their own role
CREATE POLICY "Users can insert their own role during registration"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Keep admin insert policy for admin operations
CREATE POLICY "Admins can insert any role"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));