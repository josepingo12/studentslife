-- Create story_views table
CREATE TABLE public.story_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

-- Enable RLS
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- Everyone can view story views
CREATE POLICY "Everyone can view story views"
ON public.story_views
FOR SELECT
USING (true);

-- Users can create their own views
CREATE POLICY "Users can create their own views"
ON public.story_views
FOR INSERT
WITH CHECK (auth.uid() = viewer_id);

-- Admins can manage all views
CREATE POLICY "Admins can manage all story views"
ON public.story_views
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for story_views
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_views;