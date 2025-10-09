-- Create table to track partner views
CREATE TABLE IF NOT EXISTS public.partner_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_views ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own partner views"
ON public.partner_views
FOR SELECT
USING (auth.uid() = client_id);

CREATE POLICY "Users can create their own partner views"
ON public.partner_views
FOR INSERT
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Admins can manage all partner views"
ON public.partner_views
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_partner_views_client_id ON public.partner_views(client_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_views_partner_id ON public.partner_views(partner_id);