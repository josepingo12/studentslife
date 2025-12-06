-- Add policy to allow clients to delete their own QR codes
CREATE POLICY "Clients can delete their own QR codes" 
ON public.qr_codes 
FOR DELETE 
USING (client_id = auth.uid());