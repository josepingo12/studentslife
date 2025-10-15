-- Fix function search path with CASCADE
DROP FUNCTION IF EXISTS update_user_stats_timestamp() CASCADE;

CREATE OR REPLACE FUNCTION update_user_stats_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON public.user_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_timestamp();