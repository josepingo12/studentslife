-- Drop existing problematic policies on conversation_participants
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can insert conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can manage their conversation participants" ON conversation_participants;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view their own participation"
  ON conversation_participants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own participation"
  ON conversation_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own participation"
  ON conversation_participants FOR DELETE
  USING (auth.uid() = user_id);