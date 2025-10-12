-- Add video support to stories and posts tables

-- Add video_url and media_type to stories table
ALTER TABLE public.stories
ADD COLUMN IF NOT EXISTS video_url text,
ADD COLUMN IF NOT EXISTS media_type text CHECK (media_type IN ('image', 'video'));

-- Add video_url and media_type to posts table
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS video_url text,
ADD COLUMN IF NOT EXISTS media_type text CHECK (media_type IN ('image', 'video'));

-- Update existing records to have media_type = 'image' where image_url is not null
UPDATE public.stories
SET media_type = 'image'
WHERE image_url IS NOT NULL AND media_type IS NULL;

UPDATE public.posts
SET media_type = 'image'
WHERE image_url IS NOT NULL AND media_type IS NULL;