-- Create saved_posts table for bookmarking posts
CREATE TABLE public.saved_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Enable Row Level Security
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for saved_posts
CREATE POLICY "Users can view their own saved posts"
  ON public.saved_posts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save posts"
  ON public.saved_posts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave posts"
  ON public.saved_posts
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all saved posts"
  ON public.saved_posts
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for saved_posts
ALTER PUBLICATION supabase_realtime ADD TABLE public.saved_posts;