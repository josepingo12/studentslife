-- Fix partner profiles visibility policy to avoid recursive RLS on user_roles
DO $$
BEGIN
  -- Drop old ambiguous/ineffective policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view partner profiles'
  ) THEN
    DROP POLICY "Users can view partner profiles" ON public.profiles;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Authenticated users can view partner profiles'
  ) THEN
    DROP POLICY "Authenticated users can view partner profiles" ON public.profiles;
  END IF;
END $$;

-- Recreate policy using security definer function to bypass RLS on user_roles
CREATE POLICY "Anyone can view partner profiles"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (
  public.has_role(profiles.id, 'partner'::app_role)
);