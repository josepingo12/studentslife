-- Create security definer function to check conversation participation
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

-- Add policy to allow users to see other participants in their conversations
CREATE POLICY "Users can view other participants in their conversations"
  ON conversation_participants FOR SELECT
  USING (public.is_conversation_participant(conversation_id, auth.uid()));