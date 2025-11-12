-- Add moderation fields to posts table
ALTER TABLE public.posts 
  ALTER COLUMN status SET DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS moderation_reason text,
  ADD COLUMN IF NOT EXISTS moderation_category text,
  ADD COLUMN IF NOT EXISTS auto_moderated boolean DEFAULT false;

-- Add moderation fields to comments table
ALTER TABLE public.comments 
  ALTER COLUMN status SET DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS moderation_reason text,
  ADD COLUMN IF NOT EXISTS moderation_category text,
  ADD COLUMN IF NOT EXISTS auto_moderated boolean DEFAULT false;

-- Add moderation fields to messages table
ALTER TABLE public.messages 
  ALTER COLUMN status SET DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS moderation_reason text,
  ADD COLUMN IF NOT EXISTS moderation_category text,
  ADD COLUMN IF NOT EXISTS auto_moderated boolean DEFAULT false;

-- Add moderation fields to stories table
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS moderation_reason text,
  ADD COLUMN IF NOT EXISTS moderation_category text,
  ADD COLUMN IF NOT EXISTS auto_moderated boolean DEFAULT false;

-- Create index for faster querying of pending content
CREATE INDEX IF NOT EXISTS idx_posts_status_auto_moderated ON public.posts(status, auto_moderated);
CREATE INDEX IF NOT EXISTS idx_comments_status_auto_moderated ON public.comments(status, auto_moderated);
CREATE INDEX IF NOT EXISTS idx_messages_status_auto_moderated ON public.messages(status, auto_moderated);
CREATE INDEX IF NOT EXISTS idx_stories_status_auto_moderated ON public.stories(status, auto_moderated);

-- Update RLS policies for stories to include status check
DROP POLICY IF EXISTS "Everyone can view active stories" ON public.stories;
CREATE POLICY "Everyone can view approved active stories" 
  ON public.stories 
  FOR SELECT 
  USING (expires_at > now() AND (status = 'approved' OR status IS NULL));

-- Allow users to view their own pending stories
CREATE POLICY "Users can view their own pending stories" 
  ON public.stories 
  FOR SELECT 
  USING (user_id = auth.uid());

-- Update posts RLS to allow viewing approved posts
DROP POLICY IF EXISTS "Everyone can view posts" ON public.posts;
CREATE POLICY "Everyone can view approved posts" 
  ON public.posts 
  FOR SELECT 
  USING (status = 'approved');

-- Allow users to view their own pending posts
CREATE POLICY "Users can view their own pending posts" 
  ON public.posts 
  FOR SELECT 
  USING (user_id = auth.uid());

-- Similar for comments
DROP POLICY IF EXISTS "Everyone can view comments" ON public.comments;
CREATE POLICY "Everyone can view approved comments" 
  ON public.comments 
  FOR SELECT 
  USING (status = 'approved');

CREATE POLICY "Users can view their own pending comments" 
  ON public.comments 
  FOR SELECT 
  USING (user_id = auth.uid());