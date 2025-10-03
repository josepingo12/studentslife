-- Replace recursive policies on conversation_participants
DROP POLICY IF EXISTS "Users can add participants to conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON conversation_participants;

-- Ensure helper function exists (idempotent)
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conversation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_id = _conversation_id
      AND user_id = _user_id
  )
$$;

-- Non-recursive, safe policies
CREATE POLICY "Users can view participants in their conversations (safe)"
  ON conversation_participants FOR SELECT
  USING (public.is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "Users can add participants to conversations (safe)"
  ON conversation_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_conversation_participant(conversation_id, auth.uid()));