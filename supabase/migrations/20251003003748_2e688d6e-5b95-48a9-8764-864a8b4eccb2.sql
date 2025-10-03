-- First, drop existing constraints if they exist to recreate them properly
DO $$ 
BEGIN
    -- Drop and recreate posts foreign key
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'posts_user_id_fkey' 
               AND table_name = 'posts') THEN
        ALTER TABLE public.posts DROP CONSTRAINT posts_user_id_fkey;
    END IF;
    
    ALTER TABLE public.posts
    ADD CONSTRAINT posts_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

    -- Drop and recreate stories foreign key
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'stories_user_id_fkey' 
               AND table_name = 'stories') THEN
        ALTER TABLE public.stories DROP CONSTRAINT stories_user_id_fkey;
    END IF;
    
    ALTER TABLE public.stories
    ADD CONSTRAINT stories_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

    -- Drop and recreate comments foreign key
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'comments_user_id_fkey' 
               AND table_name = 'comments') THEN
        ALTER TABLE public.comments DROP CONSTRAINT comments_user_id_fkey;
    END IF;
    
    ALTER TABLE public.comments
    ADD CONSTRAINT comments_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

    -- Drop and recreate likes foreign key
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'likes_user_id_fkey' 
               AND table_name = 'likes') THEN
        ALTER TABLE public.likes DROP CONSTRAINT likes_user_id_fkey;
    END IF;
    
    ALTER TABLE public.likes
    ADD CONSTRAINT likes_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
END $$;