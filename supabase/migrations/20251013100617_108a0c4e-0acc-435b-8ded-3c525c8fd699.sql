-- Allow video-only stories by making image_url nullable and ensuring at least one media is present
ALTER TABLE public.stories
  ALTER COLUMN image_url DROP NOT NULL;

-- Add a safety check so a story must have either an image or a video
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stories_media_present'
  ) THEN
    ALTER TABLE public.stories
    ADD CONSTRAINT stories_media_present CHECK (
      image_url IS NOT NULL OR video_url IS NOT NULL
    );
  END IF;
END $$;