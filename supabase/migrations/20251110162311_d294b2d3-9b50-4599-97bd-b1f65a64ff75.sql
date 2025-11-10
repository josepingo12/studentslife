-- Fix search_path for the update function
DROP FUNCTION IF EXISTS update_content_flags_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_content_flags_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER update_content_flags_timestamp
  BEFORE UPDATE ON public.content_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_content_flags_updated_at();