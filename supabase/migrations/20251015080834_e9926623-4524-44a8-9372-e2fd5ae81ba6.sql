-- Create enum for badge types
CREATE TYPE badge_type AS ENUM ('access', 'likes', 'qr_downloaded', 'posts', 'qr_scanned', 'events_created');

-- Create enum for user types for badges
CREATE TYPE badge_user_type AS ENUM ('client', 'partner', 'both');

-- Create badges table
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  badge_type badge_type NOT NULL,
  threshold INTEGER NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  user_type badge_user_type NOT NULL DEFAULT 'both',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_badges table to track earned badges
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  seen BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, badge_id)
);

-- Create user_stats table to track progress
CREATE TABLE public.user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_accesses INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  total_qr_downloaded INTEGER DEFAULT 0,
  total_posts INTEGER DEFAULT 0,
  total_qr_scanned INTEGER DEFAULT 0,
  total_events_created INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for badges (everyone can view)
CREATE POLICY "Everyone can view badges"
  ON public.badges FOR SELECT
  USING (true);

-- RLS Policies for user_badges
CREATE POLICY "Users can view their own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges"
  ON public.user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own badges"
  ON public.user_badges FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for user_stats
CREATE POLICY "Users can view their own stats"
  ON public.user_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats"
  ON public.user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
  ON public.user_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- Insert predefined badges for clients
INSERT INTO public.badges (name, description, badge_type, threshold, icon, color, user_type) VALUES
-- Access badges
('Explorer', '100 accessi effettuati', 'access', 100, '🌟', '#FFD700', 'both'),
('Adventurer', '300 accessi effettuati', 'access', 300, '⭐', '#FFA500', 'both'),
('Veteran', '500 accessi effettuati', 'access', 500, '🏆', '#FF6B6B', 'both'),
('Legend', '1000 accessi effettuati', 'access', 1000, '👑', '#9B59B6', 'both'),

-- Likes badges
('Rising Star', '15 mi piace ricevuti', 'likes', 15, '💫', '#FF69B4', 'both'),
('Popular', '30 mi piace ricevuti', 'likes', 30, '🌺', '#FF1493', 'both'),
('Influencer', '50 mi piace ricevuti', 'likes', 50, '🎭', '#C71585', 'both'),
('Superstar', '100 mi piace ricevuti', 'likes', 100, '🌟', '#8B008B', 'both'),

-- QR Downloaded badges (client)
('QR Collector', '10 QR code scaricati', 'qr_downloaded', 10, '📱', '#4ECDC4', 'client'),
('QR Hunter', '35 QR code scaricati', 'qr_downloaded', 35, '🎯', '#45B7D1', 'client'),
('QR Master', '50 QR code scaricati', 'qr_downloaded', 50, '🏅', '#5DADE2', 'client'),
('QR Legend', '75 QR code scaricati', 'qr_downloaded', 75, '💎', '#3498DB', 'client'),

-- Posts badges
('Content Creator', '10 post caricati', 'posts', 10, '📸', '#F39C12', 'both'),
('Active Poster', '35 post caricati', 'posts', 35, '🎨', '#E67E22', 'both'),
('Creative Mind', '50 post caricati', 'posts', 50, '🎪', '#D35400', 'both'),
('Content King', '75 post caricati', 'posts', 75, '👸', '#CA6F1E', 'both'),

-- QR Scanned badges (partner)
('QR Starter', '10 QR code scansionati', 'qr_scanned', 10, '📊', '#2ECC71', 'partner'),
('QR Pro', '35 QR code scansionati', 'qr_scanned', 35, '📈', '#27AE60', 'partner'),
('QR Expert', '50 QR code scansionati', 'qr_scanned', 50, '🚀', '#229954', 'partner'),
('QR Champion', '100 QR code scansionati', 'qr_scanned', 100, '🏆', '#1E8449', 'partner'),

-- Events Created badges (partner)
('Event Organizer', '10 eventi creati', 'events_created', 10, '🎉', '#E74C3C', 'partner'),
('Event Manager', '35 eventi creati', 'events_created', 35, '🎊', '#C0392B', 'partner'),
('Event Master', '50 eventi creati', 'events_created', 50, '🎈', '#A93226', 'partner'),
('Event Legend', '100 eventi creati', 'events_created', 100, '🎆', '#922B21', 'partner');

-- Function to update user stats timestamp
CREATE OR REPLACE FUNCTION update_user_stats_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_stats
CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON public.user_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_timestamp();