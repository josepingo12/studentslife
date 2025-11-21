-- Add latitude and longitude columns to profiles table for partner location mapping
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add index for faster geographic queries
CREATE INDEX IF NOT EXISTS idx_profiles_coordinates ON public.profiles(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN public.profiles.latitude IS 'Geographic latitude coordinate for partner business location';
COMMENT ON COLUMN public.profiles.longitude IS 'Geographic longitude coordinate for partner business location';