-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Enable realtime for conversations table  
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;