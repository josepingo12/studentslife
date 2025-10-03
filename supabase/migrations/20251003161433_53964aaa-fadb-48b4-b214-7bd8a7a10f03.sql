-- Remove obsolete business_category check constraint
-- The categories are already managed in the categories table
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_business_category_check;