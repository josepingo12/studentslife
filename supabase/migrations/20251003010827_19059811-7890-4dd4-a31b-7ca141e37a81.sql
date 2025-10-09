-- Add foreign key to profiles for story_views
ALTER TABLE public.story_views
DROP CONSTRAINT IF EXISTS story_views_viewer_id_fkey,
ADD CONSTRAINT story_views_viewer_id_fkey 
  FOREIGN KEY (viewer_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;