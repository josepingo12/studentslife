-- Add terms acceptance tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE;

-- Add moderation fields to posts
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
ADD COLUMN IF NOT EXISTS moderation_score INTEGER DEFAULT 0;

-- Add moderation fields to messages
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
ADD COLUMN IF NOT EXISTS moderation_score INTEGER DEFAULT 0;

-- Add moderation fields to comments
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
ADD COLUMN IF NOT EXISTS moderation_score INTEGER DEFAULT 0;

-- Create content_flags table for user reports
CREATE TABLE IF NOT EXISTS public.content_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'message', 'video')),
  reporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'hate_speech', 'harassment', 'violence', 'inappropriate', 'other')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  moderator_id UUID REFERENCES auth.users(id),
  moderation_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_blocks table
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(blocker_user_id, blocked_user_id),
  CHECK (blocker_user_id != blocked_user_id)
);

-- Enable RLS
ALTER TABLE public.content_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_flags
CREATE POLICY "Users can create flags" ON public.content_flags
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_user_id);

CREATE POLICY "Users can view their own flags" ON public.content_flags
  FOR SELECT TO authenticated
  USING (auth.uid() = reporter_user_id);

CREATE POLICY "Admins can manage all flags" ON public.content_flags
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_blocks
CREATE POLICY "Users can create their own blocks" ON public.user_blocks
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = blocker_user_id);

CREATE POLICY "Users can delete their own blocks" ON public.user_blocks
  FOR DELETE TO authenticated
  USING (auth.uid() = blocker_user_id);

CREATE POLICY "Users can view their own blocks" ON public.user_blocks
  FOR SELECT TO authenticated
  USING (auth.uid() = blocker_user_id);

CREATE POLICY "Admins can manage all blocks" ON public.user_blocks
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_flags_status ON public.content_flags(status);
CREATE INDEX IF NOT EXISTS idx_content_flags_content ON public.content_flags(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON public.user_blocks(blocker_user_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON public.user_blocks(blocked_user_id);

-- Update function for content_flags
CREATE OR REPLACE FUNCTION update_content_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_content_flags_timestamp
  BEFORE UPDATE ON public.content_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_content_flags_updated_at();