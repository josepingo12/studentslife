-- Add account approval status to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'pending' CHECK (account_status IN ('pending', 'approved', 'blocked'));

-- Create categories table for dynamic business categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Everyone can view categories
CREATE POLICY "Everyone can view categories"
ON public.categories
FOR SELECT
USING (true);

-- Only admins can manage categories
CREATE POLICY "Admins can manage categories"
ON public.categories
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create access logs table for tracking user logins
CREATE TABLE IF NOT EXISTS public.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on access_logs
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view access logs
CREATE POLICY "Admins can view access logs"
ON public.access_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can insert their own access logs
CREATE POLICY "Users can log their access"
ON public.access_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Insert default categories
INSERT INTO public.categories (name, display_name) VALUES
  ('bar_restaurant', 'Bar & Ristoranti'),
  ('gym_fitness', 'Palestre & Fitness'),
  ('beauty_wellness', 'Bellezza & Benessere'),
  ('entertainment', 'Intrattenimento'),
  ('shopping', 'Shopping & Retail'),
  ('services', 'Servizi')
ON CONFLICT (name) DO NOTHING;

-- Create function to update categories updated_at
CREATE OR REPLACE FUNCTION public.update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for categories
DROP TRIGGER IF EXISTS update_categories_updated_at_trigger ON public.categories;
CREATE TRIGGER update_categories_updated_at_trigger
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_categories_updated_at();