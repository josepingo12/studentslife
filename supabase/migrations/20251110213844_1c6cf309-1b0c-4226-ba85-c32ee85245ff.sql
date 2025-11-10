-- Fix conversation_participants RLS policies
-- Drop the conflicting INSERT policies
DROP POLICY IF EXISTS "Users can add participants to conversations (safe)" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can insert their own participation" ON public.conversation_participants;

-- Create a new comprehensive INSERT policy that allows:
-- 1. Users to add themselves as participants
-- 2. Users to add participants to conversations they created (where they are user1_id or user2_id)
CREATE POLICY "Users can manage conversation participants"
ON public.conversation_participants
FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = conversation_participants.conversation_id
    AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
  )
);