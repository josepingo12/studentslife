-- Create table to track post shares
CREATE TABLE public.post_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL,
  shared_to UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_post_shares_post_id ON public.post_shares(post_id);
CREATE INDEX idx_post_shares_shared_by ON public.post_shares(shared_by);

-- Enable RLS
ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can view share counts"
ON public.post_shares
FOR SELECT
USING (true);

CREATE POLICY "Users can create their own shares"
ON public.post_shares
FOR INSERT
WITH CHECK (auth.uid() = shared_by);

CREATE POLICY "Admins can manage all shares"
ON public.post_shares
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));