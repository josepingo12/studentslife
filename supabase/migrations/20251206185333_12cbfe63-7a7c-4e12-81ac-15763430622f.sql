-- Create stamp_history table to track individual stamp dates
CREATE TABLE public.stamp_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_stamps_id UUID NOT NULL REFERENCES public.client_stamps(id) ON DELETE CASCADE,
  stamped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  stamp_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stamp_history ENABLE ROW LEVEL SECURITY;

-- Create index for faster lookups
CREATE INDEX idx_stamp_history_client_stamps ON public.stamp_history(client_stamps_id);
CREATE INDEX idx_stamp_history_stamped_at ON public.stamp_history(stamped_at);

-- RLS Policies
CREATE POLICY "Clients can view their own stamp history" 
ON public.stamp_history 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM client_stamps cs 
    WHERE cs.id = stamp_history.client_stamps_id 
    AND cs.client_id = auth.uid()
  )
);

CREATE POLICY "Partners can view stamp history for their cards" 
ON public.stamp_history 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM client_stamps cs 
    WHERE cs.id = stamp_history.client_stamps_id 
    AND cs.partner_id = auth.uid()
  )
);

CREATE POLICY "Partners can insert stamp history" 
ON public.stamp_history 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM client_stamps cs 
    WHERE cs.id = stamp_history.client_stamps_id 
    AND cs.partner_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all stamp history" 
ON public.stamp_history 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));