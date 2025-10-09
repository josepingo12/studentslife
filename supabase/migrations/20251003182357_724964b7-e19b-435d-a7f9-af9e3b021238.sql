-- Add qr_enabled column to events table
ALTER TABLE public.events 
ADD COLUMN qr_enabled boolean NOT NULL DEFAULT true;