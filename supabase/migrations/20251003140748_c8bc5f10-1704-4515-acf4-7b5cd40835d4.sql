-- Fix the profiles access policy issue
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can view partner profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view favorited profiles" ON profiles;

-- Admin access
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can see their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can see any profile for now (needed for chat functionality)
CREATE POLICY "Users can view any profile for chat"
  ON profiles FOR SELECT
  USING (true);