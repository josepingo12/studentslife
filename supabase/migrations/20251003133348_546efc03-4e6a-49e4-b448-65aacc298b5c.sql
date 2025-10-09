-- Create post_views table for tracking post views
CREATE TABLE IF NOT EXISTS public.post_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, viewer_id)
);

-- Enable RLS
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

-- Everyone can view post views
CREATE POLICY "Everyone can view post views"
ON public.post_views
FOR SELECT
USING (true);

-- Users can create their own post views
CREATE POLICY "Users can create their own post views"
ON public.post_views
FOR INSERT
WITH CHECK (auth.uid() = viewer_id);

-- Admins can manage all post views
CREATE POLICY "Admins can manage all post views"
ON public.post_views
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for better performance
CREATE INDEX idx_post_views_post_id ON public.post_views(post_id);
CREATE INDEX idx_post_views_viewer_id ON public.post_views(viewer_id);