-- Add link_url column to events table for external links (e.g., ticket purchase)
ALTER TABLE public.events 
ADD COLUMN link_url text;