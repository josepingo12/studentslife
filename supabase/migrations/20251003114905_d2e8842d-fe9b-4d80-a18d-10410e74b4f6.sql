-- Create a safe, publicly readable view exposing only non-sensitive profile fields
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  first_name,
  last_name,
  business_name,
  profile_image_url
FROM public.profiles;

-- Lock down defaults and grant explicit read access to app roles
REVOKE ALL ON public.public_profiles FROM PUBLIC;
GRANT SELECT ON public.public_profiles TO anon, authenticated;