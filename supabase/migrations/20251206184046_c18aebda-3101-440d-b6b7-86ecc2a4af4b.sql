
-- Create loyalty_cards table for partner configuration
CREATE TABLE public.loyalty_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  reward_description TEXT NOT NULL DEFAULT '',
  stamps_required INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(partner_id)
);

-- Create client_stamps table for tracking stamps
CREATE TABLE public.client_stamps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  loyalty_card_id UUID NOT NULL REFERENCES public.loyalty_cards(id) ON DELETE CASCADE,
  stamps_count INTEGER NOT NULL DEFAULT 0,
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  last_stamp_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(client_id, partner_id)
);

-- Enable RLS
ALTER TABLE public.loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_stamps ENABLE ROW LEVEL SECURITY;

-- Loyalty cards policies
CREATE POLICY "Partners can manage their own loyalty card"
ON public.loyalty_cards FOR ALL
USING (partner_id = auth.uid())
WITH CHECK (partner_id = auth.uid());

CREATE POLICY "Everyone can view active loyalty cards"
ON public.loyalty_cards FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage all loyalty cards"
ON public.loyalty_cards FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Client stamps policies
CREATE POLICY "Clients can view their own stamps"
ON public.client_stamps FOR SELECT
USING (client_id = auth.uid());

CREATE POLICY "Partners can view stamps for their cards"
ON public.client_stamps FOR SELECT
USING (partner_id = auth.uid());

CREATE POLICY "Partners can update stamps for their cards"
ON public.client_stamps FOR UPDATE
USING (partner_id = auth.uid());

CREATE POLICY "Clients can insert their own stamps"
ON public.client_stamps FOR INSERT
WITH CHECK (client_id = auth.uid());

CREATE POLICY "Clients can update their own stamps"
ON public.client_stamps FOR UPDATE
USING (client_id = auth.uid());

CREATE POLICY "Admins can manage all stamps"
ON public.client_stamps FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for stamps
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_stamps;
