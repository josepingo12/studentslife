-- Add user columns to conversations table for simpler 1-on-1 chats
ALTER TABLE conversations 
  ADD COLUMN IF NOT EXISTS user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Migrate existing conversation_participants data to conversations
UPDATE conversations c
SET 
  user1_id = (
    SELECT user_id FROM conversation_participants 
    WHERE conversation_id = c.id 
    ORDER BY joined_at ASC 
    LIMIT 1
  ),
  user2_id = (
    SELECT user_id FROM conversation_participants 
    WHERE conversation_id = c.id 
    ORDER BY joined_at ASC 
    OFFSET 1 LIMIT 1
  )
WHERE user1_id IS NULL;

-- Drop old complex policies on conversations
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Admins can manage conversations" ON conversations;

-- Simple new policies using direct user columns
CREATE POLICY "Users can view their own conversations" 
  ON conversations FOR SELECT 
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create conversations" 
  ON conversations FOR INSERT 
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Admins can manage conversations"
  ON conversations FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Update messages policies to use simpler approach
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update their messages" ON messages;

CREATE POLICY "Users can view messages in their conversations" 
  ON messages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = conversation_id 
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = conversation_id 
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their messages"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = conversation_id 
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );