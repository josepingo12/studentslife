-- Fix profiles visibility (skip foreign keys since they exist)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can view partner profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Recreate admin policy
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Allow users to see their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow all users to see other profiles (for chat list)
CREATE POLICY "All users can view all profiles"
  ON profiles FOR SELECT
  USING (true);