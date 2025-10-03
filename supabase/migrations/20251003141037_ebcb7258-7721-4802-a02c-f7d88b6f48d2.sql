-- Fix favorites foreign key name and conversations policies
-- Drop existing foreign key constraint that might have wrong name
ALTER TABLE favorites DROP CONSTRAINT IF EXISTS favorites_favorite_user_id_fkey;

-- Add correct foreign key with explicit name  
ALTER TABLE favorites 
  ADD CONSTRAINT favorites_favorite_user_id_fkey 
    FOREIGN KEY (favorite_user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Fix conversations policies - allow users to create conversations
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (true);

-- Allow users to view conversations via conversation_participants
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;

CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (public.is_conversation_participant(id, auth.uid()));