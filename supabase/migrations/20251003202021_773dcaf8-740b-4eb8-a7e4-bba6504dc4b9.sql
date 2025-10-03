-- Fix Security Issues: Restrict profile data access to authenticated users only
-- This prevents unauthenticated access to sensitive PII (email, phone numbers, addresses)

-- Drop the overly permissive policy that allows ANYONE (including unauthenticated) to view all profiles
DROP POLICY IF EXISTS "All users can view all profiles" ON public.profiles;

-- Drop the redundant policy
DROP POLICY IF EXISTS "Users can view any profile for chat" ON public.profiles;

-- Create a new policy: Only authenticated users can view profile information
-- This is necessary for social features (posts, comments, likes, etc.)
CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Add documentation comment
COMMENT ON TABLE public.profiles IS 'User profiles table with PII - access restricted to authenticated users via RLS. Contains: email, phone, business contact info. The public_profiles view exposes only non-sensitive fields (no email, phone, addresses).';