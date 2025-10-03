-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('avatars', 'avatars', true),
  ('stories', 'stories', true),
  ('posts', 'posts', true),
  ('gallery', 'gallery', true);

-- Storage policies for avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for stories
CREATE POLICY "Anyone can view stories" ON storage.objects
  FOR SELECT USING (bucket_id = 'stories');

CREATE POLICY "Users can upload their own stories" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'stories' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own stories" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'stories' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for posts
CREATE POLICY "Anyone can view posts" ON storage.objects
  FOR SELECT USING (bucket_id = 'posts');

CREATE POLICY "Users can upload their own posts" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'posts' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own posts" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'posts' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for gallery
CREATE POLICY "Anyone can view gallery" ON storage.objects
  FOR SELECT USING (bucket_id = 'gallery');

CREATE POLICY "Partners can upload to gallery" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'gallery' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Partners can delete their gallery images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'gallery' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins can manage all storage
CREATE POLICY "Admins can manage avatars" ON storage.objects
  FOR ALL USING (
    bucket_id = 'avatars' AND 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can manage stories" ON storage.objects
  FOR ALL USING (
    bucket_id = 'stories' AND 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can manage posts" ON storage.objects
  FOR ALL USING (
    bucket_id = 'posts' AND 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can manage gallery" ON storage.objects
  FOR ALL USING (
    bucket_id = 'gallery' AND 
    has_role(auth.uid(), 'admin'::app_role)
  );