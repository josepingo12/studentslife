-- Rimuovi il vecchio constraint
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_media_type_check;

-- Aggiungi il nuovo constraint che include 'audio'
ALTER TABLE public.messages
ADD CONSTRAINT messages_media_type_check 
CHECK (media_type IN ('image', 'video', 'file', 'audio'));