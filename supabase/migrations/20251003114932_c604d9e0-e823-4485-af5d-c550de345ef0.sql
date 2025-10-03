-- Drop the existing SECURITY DEFINER view
DROP VIEW IF EXISTS public.public_profiles;

-- Recreate the view WITHOUT security definer (uses invoker's rights by default)
CREATE VIEW public.public_profiles AS
SELECT 
  id,
  first_name,
  last_name,
  business_name,
  profile_image_url
FROM public.profiles;

-- Grant explicit read access to authenticated and anonymous users
GRANT SELECT ON public.public_profiles TO anon, authenticated;